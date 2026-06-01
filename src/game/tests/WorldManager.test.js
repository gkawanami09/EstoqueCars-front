import * as THREE from 'three'
import WorldManager from '../WorldManager'
import { DEFAULT_CONFIG } from '../config/gameConfig'

describe('WorldManager', () => {
  test('cria mundo e obstáculos procedurais', () => {
    const scene = new THREE.Scene()
    const manager = new WorldManager(scene, {
      ...DEFAULT_CONFIG,
      obstacleCount: 20,
      worldSize: 300,
      maxObstaclesRetry: 800,
    })

    manager.build()
    const obstacles = manager.getObstacles()

    expect(obstacles.length).toBeGreaterThanOrEqual(4)
    expect(obstacles.length).toBeLessThanOrEqual(24)

    const nonWall = obstacles.filter((obstacle) => obstacle.shape !== 'wall')
    const tooCloseToSpawn = nonWall.some((obstacle) => {
      const dx = obstacle.position.x
      const dz = obstacle.position.z
      return Math.hypot(dx, dz) < DEFAULT_CONFIG.obstacleMinDistanceToCar
    })

    expect(tooCloseToSpawn).toBe(false)
    manager.dispose()
  })

  test('remove recursos no dispose', () => {
    const scene = new THREE.Scene()
    const manager = new WorldManager(scene, {
      ...DEFAULT_CONFIG,
      obstacleCount: 8,
      worldSize: 220,
      maxObstaclesRetry: 400,
    })
    manager.build()
    manager.dispose()

    expect(manager.getObstacles()).toHaveLength(0)
  })
})
