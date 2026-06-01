const MODEL_URL_FALLBACK = '/assets/banner3d/models/drift-car.gltf'

export const DRIFT_DEFAULTS = Object.freeze({
  duration: 6.5,
  entrySpeed: 14,
  minSpeed: 8,
  maxSpeed: 28,
  acceleration: 16,
  grip: 7.4,
  lateralGrip: 8.6,
  steeringStrength: 1.35,
  maxDriftAngleDeg: 30,
  particleBudget: 300,
  tireMarkLife: 4.8,
  smokeOpacity: 0.72,
  minFps: 30,
  autoQuality: true,
  modelUrl: MODEL_URL_FALLBACK,
})

const NUMBER_LIMITS = Object.freeze({
  duration: [3.2, 10],
  entrySpeed: [6, 30],
  minSpeed: [4, 20],
  maxSpeed: [12, 46],
  acceleration: [4, 32],
  grip: [2, 20],
  lateralGrip: [2, 26],
  steeringStrength: [0.2, 2.8],
  maxDriftAngleDeg: [12, 55],
  particleBudget: [90, 650],
  tireMarkLife: [1.5, 12],
  smokeOpacity: [0.1, 1],
  minFps: [24, 60],
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeNumber(key, input, fallback) {
  const value = Number(input)
  if (!Number.isFinite(value)) {
    return fallback
  }

  const limits = NUMBER_LIMITS[key] || [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
  return clamp(value, limits[0], limits[1])
}

function sanitizeBoolean(input, fallback) {
  if (typeof input === 'boolean') {
    return input
  }

  if (input === 'true') {
    return true
  }

  if (input === 'false') {
    return false
  }

  return fallback
}

function sanitizeModelUrl(input, fallback) {
  if (typeof input !== 'string') {
    return fallback
  }

  const value = input.trim()
  if (!value) {
    return fallback
  }

  // Prevent javascript: and data: scheme injection.
  if (/^(javascript:|data:)/i.test(value)) {
    return fallback
  }

  return value
}

export function sanitizeDriftConfig(config = {}) {
  const safe = {}

  Object.keys(DRIFT_DEFAULTS).forEach((key) => {
    const fallback = DRIFT_DEFAULTS[key]
    const value = config[key]

    if (typeof fallback === 'number') {
      safe[key] = sanitizeNumber(key, value, fallback)
      return
    }

    if (typeof fallback === 'boolean') {
      safe[key] = sanitizeBoolean(value, fallback)
      return
    }

    safe[key] = sanitizeModelUrl(value, fallback)
  })

  if (safe.minSpeed > safe.maxSpeed) {
    safe.minSpeed = DRIFT_DEFAULTS.minSpeed
    safe.maxSpeed = DRIFT_DEFAULTS.maxSpeed
  }

  return safe
}

export function sanitizeText(value, fallback) {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim()
  return normalized ? normalized : fallback
}
