import * as THREE from 'three'

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function createNoiseTexture(size, mode) {
  const width = size
  const height = size
  const data = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const seed = x * 0.131 + y * 0.177
      const noise = seededRandom(seed)
      const detail = seededRandom(seed * 3.7)

      if (mode === 'normal') {
        const nx = Math.floor(120 + noise * 14)
        const ny = Math.floor(120 + detail * 14)
        data[i] = nx
        data[i + 1] = ny
        data[i + 2] = 255
        data[i + 3] = 255
        continue
      }

      const base = mode === 'roughness' ? 180 : 54
      const spread = mode === 'roughness' ? 50 : 40
      const shade = Math.floor(base + (noise - 0.5) * spread + detail * 8)
      data[i] = shade
      data[i + 1] = shade
      data[i + 2] = shade + (mode === 'roughness' ? 0 : 6)
      data[i + 3] = 255
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
  if (mode === 'albedo') {
    texture.encoding = THREE.sRGBEncoding
  }
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(8, 8)
  texture.needsUpdate = true
  texture.anisotropy = 8
  return texture
}

export function createDriftTrack(scene) {
  const asphaltMap = createNoiseTexture(128, 'albedo')
  const roughnessMap = createNoiseTexture(128, 'roughness')
  const normalMap = createNoiseTexture(128, 'normal')

  const asphaltMaterial = new THREE.MeshStandardMaterial({
    color: '#3a3f47',
    map: asphaltMap,
    roughnessMap,
    normalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.9,
    metalness: 0.05,
    envMapIntensity: 0.45,
  })

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(64, 64, 1, 1), asphaltMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const laneMaterial = new THREE.MeshStandardMaterial({
    color: '#2d3239',
    roughness: 0.74,
    metalness: 0.08,
    transparent: true,
    opacity: 0.92,
  })

  const lane = new THREE.Mesh(new THREE.RingGeometry(5, 10.4, 64), laneMaterial)
  lane.rotation.x = -Math.PI / 2
  lane.position.y = 0.01
  lane.scale.set(1.7, 1.2, 1)
  scene.add(lane)

  const centerPatch = new THREE.Mesh(
    new THREE.CircleGeometry(4.4, 48),
    new THREE.MeshStandardMaterial({
      color: '#555e68',
      roughness: 0.96,
      metalness: 0.02,
    }),
  )
  centerPatch.rotation.x = -Math.PI / 2
  centerPatch.position.y = 0.015
  scene.add(centerPatch)

  const laneDivider = new THREE.Mesh(
    new THREE.TorusGeometry(11.1, 0.055, 12, 120),
    new THREE.MeshStandardMaterial({
      color: '#dad09f',
      roughness: 0.44,
      metalness: 0.12,
      emissive: '#564f2f',
      emissiveIntensity: 0.12,
    }),
  )
  laneDivider.rotation.x = Math.PI / 2
  laneDivider.scale.set(1.7, 1.2, 1)
  laneDivider.position.y = 0.035
  scene.add(laneDivider)

  return {
    meshes: [ground, lane, centerPatch, laneDivider],
    textures: [asphaltMap, roughnessMap, normalMap],
  }
}
