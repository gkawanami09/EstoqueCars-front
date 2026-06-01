import { clamp, isFiniteNumber } from './Utils'

function computeAabbCollision(carPosition, carRadius, obstacle) {
  const closestX = clamp(carPosition.x, obstacle.minX, obstacle.maxX)
  const closestZ = clamp(carPosition.z, obstacle.minZ, obstacle.maxZ)
  const dx = carPosition.x - closestX
  const dz = carPosition.z - closestZ
  const distanceSq = dx * dx + dz * dz

  if (distanceSq > carRadius * carRadius) {
    return null
  }

  const distance = Math.sqrt(Math.max(distanceSq, 0.0001))
  return {
    normalX: dx / distance,
    normalZ: dz / distance,
    penetration: carRadius - distance,
  }
}

function computeCircleCollision(carPosition, carRadius, obstacle) {
  const dx = carPosition.x - obstacle.position.x
  const dz = carPosition.z - obstacle.position.z
  const minDistance = carRadius + obstacle.radius
  const distanceSq = dx * dx + dz * dz

  if (distanceSq > minDistance * minDistance) {
    return null
  }

  const distance = Math.sqrt(Math.max(distanceSq, 0.0001))
  return {
    normalX: dx / distance,
    normalZ: dz / distance,
    penetration: minDistance - distance,
  }
}

/**
 * Responsible for collision detection and collision resolution.
 */
export default class CollisionManager {
  /**
   * @param {import('./config/gameConfig').DEFAULT_CONFIG} config
   */
  constructor(config) {
    if (!config) {
      throw new Error('CollisionManager precisa de configuracao valida.')
    }
    this.config = config
    this.lastCollisionTime = 0
    this.collisionCooldown = 0.08
  }

  /**
   * Checks collisions between car and world obstacles.
   * @param {import('./CarController').default} carController
   * @param {Array} obstacles
   * @param {number} currentTime
   * @returns {{collided:boolean, normalX:number, normalZ:number, penetration:number}}
   */
  checkCollisions(carController, obstacles, currentTime) {
    if (!carController || typeof carController.getPosition !== 'function') {
      throw new Error('CollisionManager.checkCollisions recebeu carController invalido.')
    }
    if (!Array.isArray(obstacles)) {
      throw new Error('CollisionManager.checkCollisions recebeu obstaculos invalidos.')
    }
    if (!isFiniteNumber(currentTime)) {
      throw new Error('CollisionManager.checkCollisions recebeu currentTime invalido.')
    }

    if (currentTime - this.lastCollisionTime < this.collisionCooldown) {
      return { collided: false, normalX: 0, normalZ: 0, penetration: 0 }
    }

    const carPosition = carController.getPosition()
    const carRadius = carController.getBoundingRadius()
    let hitNormalX = 0
    let hitNormalZ = 0
    let hitPenetration = 0
    let collisions = 0

    obstacles.forEach((obstacle) => {
      if (!obstacle || !obstacle.shape) {
        return
      }

      let result = null
      if (obstacle.shape === 'box' || obstacle.shape === 'wall') {
        result = computeAabbCollision(carPosition, carRadius, obstacle)
      } else if (obstacle.shape === 'circle') {
        result = computeCircleCollision(carPosition, carRadius, obstacle)
      }

      if (!result) {
        return
      }

      collisions += 1
      hitNormalX += result.normalX
      hitNormalZ += result.normalZ
      hitPenetration = Math.max(hitPenetration, result.penetration)
    })

    if (!collisions) {
      return { collided: false, normalX: 0, normalZ: 0, penetration: 0 }
    }

    const normalLength = Math.hypot(hitNormalX, hitNormalZ) || 1
    const normalX = hitNormalX / normalLength
    const normalZ = hitNormalZ / normalLength

    carPosition.x += normalX * hitPenetration
    carPosition.z += normalZ * hitPenetration
    carController.applyCollision({ x: normalX, y: normalZ }, this.config.collisionSlowdownFactor)

    this.lastCollisionTime = currentTime
    return {
      collided: true,
      normalX,
      normalZ,
      penetration: hitPenetration,
    }
  }
}
