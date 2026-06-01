import { createGameConfig, DEFAULT_CONFIG } from '../config/gameConfig'

describe('gameConfig', () => {
  test('mantém defaults quando env inválido', () => {
    const config = createGameConfig({
      VITE_DRIFT_WORLD_SIZE: 'abc',
      VITE_DRIFT_MAX_SPEED: 'foo',
      VITE_DRIFT_DEBUG: 'invalid',
    })

    expect(config.worldSize).toBe(DEFAULT_CONFIG.worldSize)
    expect(config.car.maxForwardSpeed).toBe(DEFAULT_CONFIG.car.maxForwardSpeed)
    expect(config.debug).toBe(DEFAULT_CONFIG.debug)
  })

  test('aplica env com clamp seguro', () => {
    const config = createGameConfig({
      VITE_DRIFT_WORLD_SIZE: '900',
      VITE_DRIFT_OBSTACLE_COUNT: '120',
      VITE_DRIFT_DEBUG: 'true',
      VITE_DRIFT_MAX_SPEED: '99',
    })

    expect(config.worldSize).toBe(900)
    expect(config.obstacleCount).toBe(120)
    expect(config.debug).toBe(true)
    expect(config.car.maxForwardSpeed).toBe(99)
  })
})
