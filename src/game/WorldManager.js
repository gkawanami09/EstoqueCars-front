import * as THREE from 'three'
import { circlesOverlapXZ, createSeededRandom } from './Utils'

/**
 * Creates and manages open world geometry and static obstacles.
 */
export default class WorldManager {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./config/gameConfig').DEFAULT_CONFIG} config
   */
  constructor(scene, config) {
    if (!scene || typeof scene.add !== 'function') {
      throw new Error('WorldManager precisa de cena valida.')
    }
    if (!config || typeof config.worldSize !== 'number') {
      throw new Error('WorldManager precisa de configuracao valida.')
    }

    this.scene = scene
    this.config = config
    this.group = new THREE.Group()
    this.scene.add(this.group)
    this.obstacles = []
    this.boundsHalf = this.config.worldSize * 0.5
    this.spawnPosition = new THREE.Vector3(0, 0, 0)
    this.asphaltTexture = null
  }

  /**
   * Builds the world mesh and procedural obstacles.
   */
  build() {
    this.buildGround()
    this.buildBoundaries()
    this.generateObstacles()
  }

  buildGround() {
    const geometry = new THREE.PlaneGeometry(this.config.worldSize, this.config.worldSize, 2, 2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3f444b,
      roughness: 0.92,
      metalness: 0.05,
    })

    try {
      const loader = new THREE.TextureLoader()
      this.asphaltTexture = loader.load('/assets/drift-game/textures/asphalt.svg')
      this.asphaltTexture.wrapS = THREE.RepeatWrapping
      this.asphaltTexture.wrapT = THREE.RepeatWrapping
      this.asphaltTexture.repeat.set(80, 80)
      this.asphaltTexture.anisotropy = 8
      material.map = this.asphaltTexture
    } catch (error) {
      console.warn('[DriftGame] Falha ao carregar textura do solo:', error)
    }

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    mesh.name = 'Ground'
    this.group.add(mesh)
  }

  buildBoundaries() {
    const wallHeight = 4
    const thickness = 1.2
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x596372,
      roughness: 0.64,
      metalness: 0.18,
    })

    const horizontal = new THREE.BoxGeometry(this.config.worldSize, wallHeight, thickness)
    const vertical = new THREE.BoxGeometry(thickness, wallHeight, this.config.worldSize)

    const north = new THREE.Mesh(horizontal, wallMaterial)
    north.position.set(0, wallHeight / 2, -this.boundsHalf)
    north.receiveShadow = true
    north.castShadow = true

    const south = new THREE.Mesh(horizontal, wallMaterial)
    south.position.set(0, wallHeight / 2, this.boundsHalf)
    south.receiveShadow = true
    south.castShadow = true

    const east = new THREE.Mesh(vertical, wallMaterial)
    east.position.set(this.boundsHalf, wallHeight / 2, 0)
    east.receiveShadow = true
    east.castShadow = true

    const west = new THREE.Mesh(vertical, wallMaterial)
    west.position.set(-this.boundsHalf, wallHeight / 2, 0)
    west.receiveShadow = true
    west.castShadow = true

    this.group.add(north, south, east, west)

    const boundsRadius = this.boundsHalf
    this.obstacles.push(
      { mesh: north, shape: 'wall', minX: -boundsRadius, maxX: boundsRadius, minZ: -this.boundsHalf - thickness, maxZ: -this.boundsHalf + thickness },
      { mesh: south, shape: 'wall', minX: -boundsRadius, maxX: boundsRadius, minZ: this.boundsHalf - thickness, maxZ: this.boundsHalf + thickness },
      { mesh: east, shape: 'wall', minX: this.boundsHalf - thickness, maxX: this.boundsHalf + thickness, minZ: -boundsRadius, maxZ: boundsRadius },
      { mesh: west, shape: 'wall', minX: -this.boundsHalf - thickness, maxX: -this.boundsHalf + thickness, minZ: -boundsRadius, maxZ: boundsRadius },
    )
  }

  generateObstacles() {
    const random = createSeededRandom(Date.now())
    const rnd = (min, max) => random() * (max - min) + min
    let retries = 0
    let created = 0

    while (created < this.config.obstacleCount && retries < this.config.maxObstaclesRetry) {
      retries += 1

      const x = rnd(-this.boundsHalf + 14, this.boundsHalf - 14)
      const z = rnd(-this.boundsHalf + 14, this.boundsHalf - 14)
      const radius = random() > 0.58 ? rnd(2.1, 4.2) : rnd(1.2, 2.2)
      const candidatePosition = new THREE.Vector3(x, 0, z)

      if (circlesOverlapXZ(candidatePosition, radius + this.config.obstacleMinDistanceToCar, this.spawnPosition, 0)) {
        continue
      }

      const overlapsExisting = this.obstacles.some((obstacle) => {
        if (obstacle.shape === 'wall') {
          return false
        }
        const currentRadius = obstacle.radius || 3
        return circlesOverlapXZ(candidatePosition, radius + this.config.obstacleMinGap, obstacle.position, currentRadius)
      })

      if (overlapsExisting) {
        continue
      }

      const obstacle = this.createObstacle(candidatePosition, radius, rnd, random)
      if (!obstacle) {
        continue
      }

      this.obstacles.push(obstacle)
      created += 1
    }
  }

  /**
   * @private
   * @param {THREE.Vector3} position
   * @param {number} radius
   * @param {(min:number,max:number)=>number} rnd
   * @param {() => number} random
   * @returns {{mesh:THREE.Mesh,shape:'circle'|'box',position:THREE.Vector3,radius?:number,minX?:number,maxX?:number,minZ?:number,maxZ?:number}|null}
   */
  createObstacle(position, radius, rnd, random) {
    const type = random() > 0.48 ? 'box' : 'cone'

    if (type === 'box') {
      const width = radius * rnd(1.2, 2)
      const depth = radius * rnd(1.2, 2)
      const height = rnd(2.4, 5.4)

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshStandardMaterial({
          color: 0x8594a9,
          roughness: 0.68,
          metalness: 0.1,
        }),
      )
      mesh.position.set(position.x, height / 2, position.z)
      mesh.rotation.y = rnd(-Math.PI, Math.PI)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.group.add(mesh)

      return {
        mesh,
        shape: 'box',
        position: position.clone(),
        minX: mesh.position.x - width / 2,
        maxX: mesh.position.x + width / 2,
        minZ: mesh.position.z - depth / 2,
        maxZ: mesh.position.z + depth / 2,
      }
    }

    const height = rnd(1.8, 3.2)
    const mesh = new THREE.Mesh(
      new THREE.ConeGeometry(radius * 0.72, height, 20),
      new THREE.MeshStandardMaterial({
        color: 0xff7b24,
        roughness: 0.6,
        metalness: 0.08,
      }),
    )
    mesh.position.set(position.x, height / 2, position.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    this.group.add(mesh)

    return {
      mesh,
      shape: 'circle',
      position: position.clone(),
      radius,
    }
  }

  /**
   * @returns {Array}
   */
  getObstacles() {
    return this.obstacles
  }

  /**
   * @returns {number}
   */
  getWorldHalfSize() {
    return this.boundsHalf
  }

  dispose() {
    this.scene.remove(this.group)
    this.group.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose()
      }
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose())
      } else if (node.material) {
        node.material.dispose()
      }
    })

    if (this.asphaltTexture) {
      this.asphaltTexture.dispose()
    }

    this.obstacles = []
  }
}
