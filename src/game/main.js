import * as THREE from 'three'
import AudioManager from './AudioManager'
import CarController from './CarController'
import CollisionManager from './CollisionManager'
import { createGameConfig } from './config/gameConfig'
import InputManager from './InputManager'
import ScoreManager from './ScoreManager'
import UIManager from './UIManager'
import WorldManager from './WorldManager'
import './styles/game-ui.css'

const DEFAULT_SESSION_DURATION_SECONDS = 180

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
    return Boolean(context)
  } catch {
    return false
  }
}

/**
 * Creates and bootstraps the drift game.
 * @param {HTMLElement} mountElement
 * @param {{env?: Record<string, string | undefined>, embedded?: boolean, autoStart?: boolean, showGameOver?: boolean, sessionDurationSeconds?: number}} [options]
 * @returns {{destroy: () => void}}
 */
export function createDriftGame(mountElement, options = {}) {
  if (!(mountElement instanceof HTMLElement)) {
    throw new Error('createDriftGame precisa de um elemento de montagem valido.')
  }

  if (!canUseWebGL()) {
    mountElement.innerHTML = '<p style="padding:16px;color:#fff;background:#111;border-radius:8px;">WebGL indisponivel. Atualize seu navegador ou habilite aceleracao de hardware.</p>'
    return {
      destroy() {},
    }
  }

  const config = createGameConfig(options.env || {})
  const embedded = Boolean(options.embedded)
  const autoStart = Boolean(options.autoStart)
  const showGameOver = options.showGameOver !== false
  const sessionDuration = Number.isFinite(options.sessionDurationSeconds)
    ? Math.max(10, Number(options.sessionDurationSeconds))
    : DEFAULT_SESSION_DURATION_SECONDS

  const uiManager = new UIManager(mountElement)
  uiManager.initialize({ embedded })

  const canvasHost = uiManager.getCanvasHost()
  if (!(canvasHost instanceof HTMLElement)) {
    throw new Error('Falha ao criar host do canvas do jogo.')
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x8192a3)
  scene.fog = new THREE.Fog(0x8192a3, 80, config.worldSize * 0.85)

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1600)
  camera.position.set(-7, 8, 13)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(canvasHost.clientWidth || 1, canvasHost.clientHeight || 1)
  canvasHost.appendChild(renderer.domElement)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
  keyLight.position.set(13, 28, 14)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(2048, 2048)
  keyLight.shadow.camera.near = 1
  keyLight.shadow.camera.far = 120
  keyLight.shadow.camera.left = -80
  keyLight.shadow.camera.right = 80
  keyLight.shadow.camera.top = 80
  keyLight.shadow.camera.bottom = -80

  const fillLight = new THREE.HemisphereLight(0xcce2ff, 0x29313c, 0.9)
  scene.add(keyLight, fillLight)

  const worldManager = new WorldManager(scene, config)
  worldManager.build()

  const carController = new CarController(scene, {
    ...config.car,
    driftMinSpeed: config.driftMinSpeed,
    driftMinAngleDeg: config.driftMinAngleDeg,
  })

  const scoreManager = new ScoreManager(config)
  const collisionManager = new CollisionManager(config)
  const inputManager = new InputManager(window)
  const audioManager = new AudioManager()
  audioManager.initialize()

  let animationFrameId = 0
  let running = false
  let destroyed = false
  let lastTime = performance.now()
  let elapsedGameTime = 0

  function resetSession() {
    carController.reset(new THREE.Vector3(0, 0, 0))
    scoreManager.resetSession()
    elapsedGameTime = 0
    lastTime = performance.now()
  }

  function startSession() {
    if (destroyed) {
      return
    }
    uiManager.hideOverlay()
    uiManager.hideGameOver()
    resetSession()
    running = true
    inputManager.enable()
    audioManager.start()
  }

  function endSession() {
    running = false
    inputManager.disable()
    const summary = scoreManager.getState()
    if (showGameOver) {
      uiManager.showGameOver({
        score: summary.currentScore,
        bestScore: summary.bestScore,
      })
      return
    }

    startSession()
  }

  uiManager.onStart(startSession)
  uiManager.onRestart(startSession)
  if (autoStart) {
    startSession()
  }

  function updateCamera(deltaTime) {
    const carPosition = carController.getPosition()
    const carState = carController.getState()
    const yaw = carState.yaw

    const targetX = carPosition.x - Math.cos(yaw) * 9.5 + Math.sin(yaw) * 2.2
    const targetZ = carPosition.z - Math.sin(yaw) * 9.5 - Math.cos(yaw) * 2.2
    const targetY = 6.4

    camera.position.lerp(
      new THREE.Vector3(targetX, targetY, targetZ),
      Math.min(1, deltaTime * 3.5),
    )

    const lookAt = new THREE.Vector3(
      carPosition.x + Math.cos(yaw) * 4.8,
      1.2,
      carPosition.z + Math.sin(yaw) * 4.8,
    )
    camera.lookAt(lookAt)
  }

  function tick(currentTime) {
    if (destroyed) {
      return
    }
    animationFrameId = requestAnimationFrame(tick)

    const dtRaw = (currentTime - lastTime) / 1000
    lastTime = currentTime
    const deltaTime = Math.min(config.maxDeltaTime, Math.max(config.minDeltaTime, dtRaw))

    if (running) {
      elapsedGameTime += deltaTime
      carController.clearCrashState()
      carController.update(inputManager.getState(), deltaTime)

      const collisionResult = collisionManager.checkCollisions(
        carController,
        worldManager.getObstacles(),
        elapsedGameTime,
      )

      if (collisionResult.collided) {
        scoreManager.applyCollisionPenalty()
        uiManager.flashCollision()
        audioManager.playCollision()
      }

      const carState = carController.getState()
      const scoreState = scoreManager.update(deltaTime, carState)

      uiManager.updateHud({
        driftTime: scoreState.driftTime,
        score: scoreState.currentScore,
        bestScore: scoreState.bestScore,
        isDrifting: scoreState.driftActive,
      })

      audioManager.update(
        carState.speed,
        config.car.maxForwardSpeed,
        scoreState.driftActive,
      )

      if (elapsedGameTime >= sessionDuration) {
        endSession()
      }
    }

    updateCamera(deltaTime)
    renderer.render(scene, camera)
  }

  function resize() {
    if (destroyed) {
      return
    }

    const width = Math.max(canvasHost.clientWidth, 1)
    const height = Math.max(canvasHost.clientHeight, 1)

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function bindResize() {
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resize)
      observer.observe(canvasHost)
      return observer
    }

    window.addEventListener('resize', resize)
    return null
  }

  const resizeObserver = bindResize()
  resize()
  animationFrameId = requestAnimationFrame(tick)

  return {
    destroy() {
      if (destroyed) {
        return
      }

      destroyed = true
      running = false
      cancelAnimationFrame(animationFrameId)
      inputManager.disable()
      audioManager.dispose()
      worldManager.dispose()
      carController.dispose()
      renderer.dispose()
      resizeObserver?.disconnect?.()
      window.removeEventListener('resize', resize)
      uiManager.dispose()
    },
  }
}

export default createDriftGame
