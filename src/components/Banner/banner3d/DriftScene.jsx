import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { loadCarModel } from './CarModel'
import { DRIFT_DEFAULTS, sanitizeDriftConfig } from './config'
import { createDriftTrack } from './DriftTrack'
import { clamp } from './math'
import { PerformanceGovernor } from './PerformanceGovernor'
import { createControlInputs, createInitialDriftState, simulateDriftStep } from './physics/driftPhysics'
import { SmokeParticles } from './SmokeParticles'
import { TireMarks } from './TireMarks'
import { disposeObject3D } from './utils/disposeObject3D'

function collectRearWheelPositions(wheels, output) {
  if (!Array.isArray(wheels) || wheels.length < 2) {
    return false
  }

  const positions = wheels.map((wheel) => {
    const worldPosition = new THREE.Vector3()
    wheel.getWorldPosition(worldPosition)
    return worldPosition
  })

  positions.sort((a, b) => a.x - b.x)
  const rear = positions.slice(0, 2).sort((a, b) => b.z - a.z)

  output.left.copy(rear[0])
  output.right.copy(rear[1])
  return true
}

function canCreateWebGLContext() {
  try {
    const probeCanvas = document.createElement('canvas')
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl')
    return !!gl
  } catch {
    return false
  }
}

function disposeTrack(trackAssets, scene) {
  if (!trackAssets) {
    return
  }

  trackAssets.meshes?.forEach((mesh) => {
    scene.remove(mesh)
    mesh.geometry?.dispose?.()
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose?.())
    } else {
      mesh.material?.dispose?.()
    }
  })

  trackAssets.textures?.forEach((texture) => texture.dispose?.())
}

export default function DriftScene({
  className,
  config = DRIFT_DEFAULTS,
  isVisible = true,
  onError,
  replayToken,
}) {
  const canvasRef = useRef(null)
  const visibilityRef = useRef(isVisible)
  visibilityRef.current = isVisible

  const safeConfig = useMemo(() => sanitizeDriftConfig(config), [config])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    if (!canCreateWebGLContext()) {
      onError?.(new Error('WebGL indisponivel no dispositivo atual'))
      return undefined
    }

    let resizeObserver
    let frameId = 0
    let disposed = false
    let renderer
    let scene
    let camera
    let shadowLight
    let rimLight
    let floorFillLight
    let smoke
    let tireMarks
    let trackAssets
    let carModel = null
    let environmentTarget = null
    let roomEnvironment = null
    let simulationState = createInitialDriftState(safeConfig)
    let startedAt = performance.now()

    const governor = new PerformanceGovernor({
      minFps: safeConfig.minFps,
      autoQuality: safeConfig.autoQuality,
    })

    const rearWheels = {
      left: new THREE.Vector3(),
      right: new THREE.Vector3(),
    }

    const worldWheelScale = new THREE.Vector3(1, 1, 1)

    function configureRenderer() {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
      })
      renderer.outputEncoding = THREE.sRGBEncoding
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.04
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.setClearColor(0x000000, 0)
    }

    function configureScene() {
      scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0xdde1e8, 18, 44)

      camera = new THREE.PerspectiveCamera(38, 1, 0.1, 110)
      camera.position.set(-9.5, 6.2, 11.8)
      camera.lookAt(0, 1.1, 0)
      scene.add(camera)

      shadowLight = new THREE.DirectionalLight(0xffffff, 2.4)
      shadowLight.position.set(7, 13, 9)
      shadowLight.castShadow = true
      shadowLight.shadow.mapSize.set(1024, 1024)
      shadowLight.shadow.camera.near = 1
      shadowLight.shadow.camera.far = 35
      shadowLight.shadow.camera.left = -15
      shadowLight.shadow.camera.right = 15
      shadowLight.shadow.camera.top = 15
      shadowLight.shadow.camera.bottom = -15
      scene.add(shadowLight)

      rimLight = new THREE.PointLight(0xffb36a, 13, 35, 2)
      rimLight.position.set(-8, 3.2, -4.4)
      scene.add(rimLight)

      floorFillLight = new THREE.HemisphereLight(0xe9f3ff, 0x393f4a, 1.05)
      scene.add(floorFillLight)

      trackAssets = createDriftTrack(scene)

      const pmremGenerator = new THREE.PMREMGenerator(renderer)
      roomEnvironment = new RoomEnvironment()
      environmentTarget = pmremGenerator.fromScene(roomEnvironment, 0.03)
      scene.environment = environmentTarget.texture
      roomEnvironment.dispose()
      pmremGenerator.dispose()
    }

    function resize() {
      if (!renderer || !camera) {
        return
      }

      const parent = canvas.parentElement
      const width = Math.max(parent?.clientWidth || 0, 1)
      const height = Math.max(parent?.clientHeight || 0, 1)
      const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2) * governor.pixelRatioScale

      renderer.setPixelRatio(pixelRatio)
      renderer.setSize(width, height, false)

      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    function updateCamera(dt) {
      const follow = new THREE.Vector3(simulationState.x - 9.4, 6.2, simulationState.z + 11.6)
      camera.position.lerp(follow, clamp(dt * 2.2, 0.02, 0.12))

      const lookTarget = new THREE.Vector3(
        simulationState.x + 1.4,
        1.2,
        simulationState.z + simulationState.driftAngle * 4.5,
      )
      camera.lookAt(lookTarget)
    }

    function updateCarRig(dt) {
      if (!carModel?.root) {
        return
      }

      const visualYaw = simulationState.yaw + simulationState.driftAngle * 0.72
      carModel.root.position.set(simulationState.x, 0, simulationState.z)
      carModel.root.rotation.set(
        0,
        visualYaw,
        clamp(-simulationState.driftAngle * 0.18, -0.08, 0.08),
      )

      if (!Array.isArray(carModel.wheels)) {
        return
      }

      carModel.wheels.forEach((wheel, index) => {
        const isFront = index < 2
        wheel.getWorldScale(worldWheelScale)

        if (wheel.rotation) {
          wheel.rotation.x = simulationState.wheelSpin
          if (isFront) {
            wheel.rotation.y = clamp(simulationState.driftAngle * 0.8, -0.5, 0.5)
          }
        }
      })

      if (!collectRearWheelPositions(carModel.wheels, rearWheels)) {
        return
      }

      const driftIntensity = clamp(Math.abs(simulationState.driftAngle) / (Math.PI / 5), 0, 1)
      smoke.emit([rearWheels.left, rearWheels.right], driftIntensity, dt)
      tireMarks.addFromRearWheels(rearWheels.left, rearWheels.right, driftIntensity, simulationState.time)
    }

    function tick(now) {
      if (disposed) {
        return
      }

      frameId = requestAnimationFrame(tick)

      if (!visibilityRef.current) {
        return
      }

      const elapsed = (now - startedAt) / 1000
      const inputs = createControlInputs(elapsed, safeConfig)
      const dt = clamp(renderer.info.render.frame > 0 ? elapsed - simulationState.time : 1 / 60, 1 / 240, 1 / 20)

      simulationState = simulateDriftStep(simulationState, safeConfig, dt, inputs)

      if (simulationState.completed) {
        simulationState = createInitialDriftState(safeConfig)
        startedAt = performance.now()
        tireMarks.reset()
      }

      updateCarRig(dt)
      smoke.update(dt)
      tireMarks.update(simulationState.time)
      updateCamera(dt)

      const qualityChanged = governor.update(dt)
      smoke.setQuality(governor.qualityScale)

      if (qualityChanged) {
        resize()
      }

      renderer.render(scene, camera)
    }

    async function boot() {
      try {
        configureRenderer()
        configureScene()
        smoke = new SmokeParticles(scene, safeConfig)
        tireMarks = new TireMarks(scene, safeConfig)

        const loadingManager = new THREE.LoadingManager()
        loadingManager.onError = (url) => {
          console.warn(`[Banner3D] Falha ao carregar recurso: ${url}`)
        }

        carModel = await loadCarModel({
          modelUrl: safeConfig.modelUrl,
          loadingManager,
          onWarning: (error) => {
            console.warn('[Banner3D] Falha no GLTF, usando fallback procedimental.', error)
          },
        })

        if (disposed) {
          return
        }

        scene.add(carModel.root)
        resize()

        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(resize)
          resizeObserver.observe(canvas.parentElement)
        } else {
          window.addEventListener('resize', resize)
        }

        frameId = requestAnimationFrame(tick)
      } catch (error) {
        const normalizedError = error instanceof Error ? error : new Error(String(error))
        console.error('[Banner3D] Falha ao iniciar DriftScene:', normalizedError)
        onError?.(normalizedError)
      }
    }

    boot()

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resize)

      if (smoke) {
        smoke.dispose()
      }
      if (tireMarks) {
        tireMarks.dispose()
      }
      if (carModel?.root) {
        disposeObject3D(carModel.root)
        scene?.remove(carModel.root)
      }

      disposeTrack(trackAssets, scene)

      if (environmentTarget) {
        environmentTarget.dispose?.()
      }
      roomEnvironment?.dispose?.()

      renderer?.renderLists?.dispose?.()
      renderer?.dispose?.()
    }
  }, [safeConfig, onError, replayToken])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Animacao 3D do carro realizando drift"
    />
  )
}
