import * as THREE from 'three'
import CarController from '../CarController'
import CollisionManager from '../CollisionManager'
import ScoreManager from '../ScoreManager'
import { DEFAULT_CONFIG } from '../config/gameConfig'

describe('Game flow integration', () => {
  test('pontua drift válido e penaliza colisão', () => {
    const scene = new THREE.Scene()
    const car = new CarController(scene, {
      ...DEFAULT_CONFIG.car,
      driftMinSpeed: DEFAULT_CONFIG.driftMinSpeed,
      driftMinAngleDeg: DEFAULT_CONFIG.driftMinAngleDeg,
    })
    const scoreManager = new ScoreManager(DEFAULT_CONFIG)
    const collisionManager = new CollisionManager(DEFAULT_CONFIG)

    for (let i = 0; i < 80; i += 1) {
      car.update(
        { forward: true, backward: false, left: false, right: false, drift: false },
        1 / 60,
      )
    }

    // Force lateral slip to emulate sustained drift scenario.
    car.velocity.set(12, 9)
    car.update(
      { forward: true, backward: false, left: true, right: false, drift: true },
      1 / 60,
    )

    const carState = car.getState()
    const beforePenalty = scoreManager.update(0.3, carState).currentScore
    expect(beforePenalty).toBeGreaterThan(0)

    const carPosition = car.getPosition()
    const obstacle = [
      {
        shape: 'circle',
        position: { x: carPosition.x + 0.4, z: carPosition.z },
        radius: 1.2,
      },
    ]

    const collision = collisionManager.checkCollisions(car, obstacle, 4)
    expect(collision.collided).toBe(true)

    scoreManager.applyCollisionPenalty()
    const afterPenalty = scoreManager.getState().currentScore
    expect(afterPenalty).toBeLessThanOrEqual(beforePenalty)

    car.dispose()
  })
})
