import { clamp, isFiniteNumber } from '../Utils'

const DEFAULT_CONFIG = Object.freeze({
  worldSize: 500,
  obstacleCount: 64,
  obstacleMinDistanceToCar: 35,
  obstacleMinGap: 9,
  maxObstaclesRetry: 2400,
  driftMinAngleDeg: 30,
  driftMinSpeed: 10,
  collisionPenaltyScore: 150,
  collisionSlowdownFactor: 0.52,
  maxDeltaTime: 1 / 20,
  minDeltaTime: 1 / 240,
  debug: false,
  car: Object.freeze({
    maxForwardSpeed: 52,
    maxReverseSpeed: 18,
    acceleration: 42,
    reverseAcceleration: 28,
    brakeDeceleration: 45,
    drag: 6.8,
    turnSpeed: 2.1,
    tractionGrip: 8.2,
    driftGrip: 2.7,
    driftYawBoost: 1.55,
    wheelBase: 2.6,
  }),
})

/**
 * @typedef {typeof DEFAULT_CONFIG} GameConfig
 */

function parseNumber(value, fallback, min, max) {
  const numeric = Number(value)
  if (!isFiniteNumber(numeric)) {
    return fallback
  }

  return clamp(numeric, min, max)
}

function parseBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value
  }
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return fallback
}

/**
 * Creates runtime game config from environment.
 * @param {Record<string, string | undefined>} env
 * @returns {GameConfig}
 */
export function createGameConfig(env = {}) {
  const config = {
    ...DEFAULT_CONFIG,
    car: { ...DEFAULT_CONFIG.car },
  }

  config.worldSize = parseNumber(env.VITE_DRIFT_WORLD_SIZE, config.worldSize, 180, 1000)
  config.obstacleCount = Math.round(parseNumber(env.VITE_DRIFT_OBSTACLE_COUNT, config.obstacleCount, 8, 400))
  config.driftMinAngleDeg = parseNumber(env.VITE_DRIFT_MIN_ANGLE_DEG, config.driftMinAngleDeg, 15, 75)
  config.driftMinSpeed = parseNumber(env.VITE_DRIFT_MIN_SPEED, config.driftMinSpeed, 4, 45)
  config.debug = parseBoolean(env.VITE_DRIFT_DEBUG, config.debug)

  config.car.maxForwardSpeed = parseNumber(env.VITE_DRIFT_MAX_SPEED, config.car.maxForwardSpeed, 20, 120)
  config.car.maxReverseSpeed = parseNumber(env.VITE_DRIFT_MAX_REVERSE, config.car.maxReverseSpeed, 8, 40)
  config.car.acceleration = parseNumber(env.VITE_DRIFT_ACCELERATION, config.car.acceleration, 8, 90)
  config.car.reverseAcceleration = parseNumber(env.VITE_DRIFT_REVERSE_ACCELERATION, config.car.reverseAcceleration, 8, 70)
  config.car.turnSpeed = parseNumber(env.VITE_DRIFT_TURN_SPEED, config.car.turnSpeed, 0.8, 3.5)
  config.car.tractionGrip = parseNumber(env.VITE_DRIFT_TRACTION_GRIP, config.car.tractionGrip, 2, 20)
  config.car.driftGrip = parseNumber(env.VITE_DRIFT_DRIFT_GRIP, config.car.driftGrip, 0.6, 10)

  return config
}

export { DEFAULT_CONFIG }
