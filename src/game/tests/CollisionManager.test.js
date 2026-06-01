import CollisionManager from '../CollisionManager'
import { DEFAULT_CONFIG } from '../config/gameConfig'

function createMockCar() {
  const position = { x: 0, z: 0 }
  return {
    position,
    getPosition: () => position,
    getBoundingRadius: () => 1.5,
    applyCollision: jest.fn(),
  }
}

describe('CollisionManager', () => {
  test('detecta colisão circular e chama resposta no carro', () => {
    const manager = new CollisionManager(DEFAULT_CONFIG)
    const car = createMockCar()
    const obstacles = [
      {
        shape: 'circle',
        position: { x: 1, z: 0 },
        radius: 1.2,
      },
    ]

    const result = manager.checkCollisions(car, obstacles, 1)
    expect(result.collided).toBe(true)
    expect(car.applyCollision).toHaveBeenCalled()
  })

  test('detecta colisão com obstáculo box', () => {
    const manager = new CollisionManager(DEFAULT_CONFIG)
    const car = createMockCar()
    const obstacles = [
      {
        shape: 'box',
        minX: -1,
        maxX: 1,
        minZ: -1,
        maxZ: 1,
      },
    ]

    const result = manager.checkCollisions(car, obstacles, 1.2)
    expect(result.collided).toBe(true)
  })

  test('retorna sem colisão quando fora de alcance', () => {
    const manager = new CollisionManager(DEFAULT_CONFIG)
    const car = createMockCar()
    car.position.x = 20
    car.position.z = 20

    const obstacles = [{ shape: 'circle', position: { x: 0, z: 0 }, radius: 1 }]
    const result = manager.checkCollisions(car, obstacles, 2)

    expect(result.collided).toBe(false)
    expect(car.applyCollision).not.toHaveBeenCalled()
  })

  test('aplica cooldown de colisão para evitar spam no mesmo frame', () => {
    const manager = new CollisionManager(DEFAULT_CONFIG)
    const car = createMockCar()
    const obstacles = [{ shape: 'circle', position: { x: 0.8, z: 0 }, radius: 1 }]

    const first = manager.checkCollisions(car, obstacles, 3)
    const second = manager.checkCollisions(car, obstacles, 3.02)
    expect(first.collided).toBe(true)
    expect(second.collided).toBe(false)
  })
})
