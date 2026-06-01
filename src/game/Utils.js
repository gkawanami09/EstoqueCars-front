import * as THREE from 'three'

/**
 * Clamp number to [min, max].
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Linear interpolation.
 * @param {number} start
 * @param {number} end
 * @param {number} alpha
 * @returns {number}
 */
export function lerp(start, end, alpha) {
  return start + (end - start) * alpha
}

/**
 * Checks if value is finite number.
 * @param {unknown} value
 * @returns {value is number}
 */
export function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Gets random number in range.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomRange(min, max) {
  return Math.random() * (max - min) + min
}

/**
 * Returns 2D forward vector from yaw (x,z plane).
 * @param {number} yawRadians
 * @returns {THREE.Vector2}
 */
export function forwardFromYaw(yawRadians) {
  return new THREE.Vector2(Math.cos(yawRadians), Math.sin(yawRadians))
}

/**
 * Calculates signed slip angle in radians between forward and velocity vectors.
 * @param {THREE.Vector2} forwardVector
 * @param {THREE.Vector2} velocityVector
 * @returns {number}
 */
export function signedAngleBetween(forwardVector, velocityVector) {
  if (forwardVector.lengthSq() === 0 || velocityVector.lengthSq() === 0) {
    return 0
  }

  const f = forwardVector.clone().normalize()
  const v = velocityVector.clone().normalize()
  const cross = f.x * v.y - f.y * v.x
  const dot = clamp(f.dot(v), -1, 1)
  return Math.atan2(cross, dot)
}

/**
 * Formats seconds in fixed precision.
 * @param {number} seconds
 * @returns {string}
 */
export function formatSeconds(seconds) {
  const safe = isFiniteNumber(seconds) ? Math.max(0, seconds) : 0
  return safe.toFixed(2)
}

/**
 * Euclidean distance in xz plane.
 * @param {THREE.Vector3} a
 * @param {THREE.Vector3} b
 * @returns {number}
 */
export function distanceXZ(a, b) {
  const dx = a.x - b.x
  const dz = a.z - b.z
  return Math.hypot(dx, dz)
}

/**
 * Checks if circles overlap in xz plane.
 * @param {THREE.Vector3} aPos
 * @param {number} aRadius
 * @param {THREE.Vector3} bPos
 * @param {number} bRadius
 * @returns {boolean}
 */
export function circlesOverlapXZ(aPos, aRadius, bPos, bRadius) {
  return distanceXZ(aPos, bPos) <= aRadius + bRadius
}

/**
 * Creates deterministic pseudo random function from seed.
 * @param {number} seed
 * @returns {() => number}
 */
export function createSeededRandom(seed) {
  let value = Math.floor(seed) % 2147483647
  if (value <= 0) {
    value += 2147483646
  }

  return () => {
    value = (value * 16807) % 2147483647
    return (value - 1) / 2147483646
  }
}

/**
 * Safe localStorage get.
 * @param {string} key
 * @param {string | null} fallback
 * @returns {string | null}
 */
export function safeStorageGet(key, fallback = null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback
    }
    return window.localStorage.getItem(key)
  } catch {
    return fallback
  }
}

/**
 * Safe localStorage set.
 * @param {string} key
 * @param {string} value
 * @returns {boolean}
 */
export function safeStorageSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false
    }
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
