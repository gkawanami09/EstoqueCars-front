import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

function createWheel(material) {
  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.44, 0.28, 20),
    material,
  )
  wheel.rotation.z = Math.PI / 2
  wheel.castShadow = true
  wheel.receiveShadow = true
  return wheel
}

function createProceduralCar() {
  const car = new THREE.Group()

  const paintMaterial = new THREE.MeshPhysicalMaterial({
    color: '#b3161b',
    metalness: 0.62,
    roughness: 0.2,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
  })

  const blackMaterial = new THREE.MeshStandardMaterial({
    color: '#111319',
    metalness: 0.35,
    roughness: 0.46,
  })

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#4f6f8e',
    metalness: 0.05,
    roughness: 0.12,
    transmission: 0.6,
    transparent: true,
    opacity: 0.75,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.85, 2.15), paintMaterial)
  body.position.y = 1.05
  body.castShadow = true
  body.receiveShadow = true
  car.add(body)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 2.05), paintMaterial)
  hood.position.set(1.4, 1.45, 0)
  hood.castShadow = true
  car.add(hood)

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 1.75), glassMaterial)
  cabin.position.set(0.2, 1.78, 0)
  cabin.castShadow = true
  car.add(cabin)

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 2.06), blackMaterial)
  splitter.position.set(2.38, 0.78, 0)
  splitter.castShadow = true
  car.add(splitter)

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 1.8), blackMaterial)
  diffuser.position.set(-2.36, 0.78, 0)
  diffuser.castShadow = true
  car.add(diffuser)

  const headLightMaterial = new THREE.MeshStandardMaterial({
    color: '#f7f2d3',
    emissive: '#f7f2d3',
    emissiveIntensity: 0.72,
    roughness: 0.25,
    metalness: 0.15,
  })

  const headlights = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.55), headLightMaterial)
  headlights.position.set(2.45, 1.05, 0)
  car.add(headlights)

  const tailLightMaterial = new THREE.MeshStandardMaterial({
    color: '#610f11',
    emissive: '#f24444',
    emissiveIntensity: 0.8,
    roughness: 0.35,
    metalness: 0.1,
  })

  const tailLights = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.48), tailLightMaterial)
  tailLights.position.set(-2.42, 1, 0)
  car.add(tailLights)

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: '#151515',
    metalness: 0.18,
    roughness: 0.8,
  })

  const wheelPositions = [
    [1.56, 0.55, 1.06],
    [1.56, 0.55, -1.06],
    [-1.56, 0.55, 1.06],
    [-1.56, 0.55, -1.06],
  ]

  const wheels = wheelPositions.map(([x, y, z]) => {
    const wheel = createWheel(wheelMaterial)
    wheel.position.set(x, y, z)
    car.add(wheel)
    return wheel
  })

  car.userData.wheels = wheels
  return car
}

function normalizeModel(carRoot) {
  const box = new THREE.Box3().setFromObject(carRoot)
  const size = new THREE.Vector3()
  box.getSize(size)

  if (size.x === 0 || size.y === 0 || size.z === 0) {
    throw new Error('Modelo GLTF invalido: dimensoes vazias')
  }

  const desiredLength = 4.8
  const scale = desiredLength / size.x
  carRoot.scale.setScalar(scale)

  const center = new THREE.Vector3()
  box.getCenter(center)
  carRoot.position.sub(center.multiplyScalar(scale))

  const scaledBox = new THREE.Box3().setFromObject(carRoot)
  const minY = scaledBox.min.y
  carRoot.position.y -= minY
}

function extractWheels(root) {
  const namedWheels = []
  root.traverse((node) => {
    if (!node.isMesh) {
      return
    }

    const name = (node.name || '').toLowerCase()
    if (name.includes('wheel') || name.includes('tyre') || name.includes('tire')) {
      namedWheels.push(node)
    }
  })

  if (namedWheels.length >= 4) {
    return namedWheels.slice(0, 4)
  }

  if (Array.isArray(root.userData.wheels) && root.userData.wheels.length >= 4) {
    return root.userData.wheels.slice(0, 4)
  }

  return []
}

function createFallbackWheelAnchors(carRoot) {
  const offsets = [
    [1.56, 0.55, 1.06],
    [1.56, 0.55, -1.06],
    [-1.56, 0.55, 1.06],
    [-1.56, 0.55, -1.06],
  ]

  return offsets.map(([x, y, z]) => {
    const anchor = new THREE.Object3D()
    anchor.position.set(x, y, z)
    carRoot.add(anchor)
    return anchor
  })
}

export async function loadCarModel({ modelUrl, loadingManager, onWarning }) {
  const carRig = new THREE.Group()
  carRig.position.set(0, 0, 0)

  let modelRoot

  try {
    const loader = new GLTFLoader(loadingManager)
    const gltf = await loader.loadAsync(modelUrl)
    modelRoot = gltf.scene
    normalizeModel(modelRoot)
    carRig.add(modelRoot)
  } catch (error) {
    onWarning?.(error)
    modelRoot = createProceduralCar()
    carRig.add(modelRoot)
  }

  let wheels = extractWheels(modelRoot)
  if (wheels.length < 4) {
    wheels = createFallbackWheelAnchors(modelRoot)
  }

  return {
    root: carRig,
    wheels,
  }
}
