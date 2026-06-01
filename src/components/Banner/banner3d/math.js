export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function lerp(start, end, alpha) {
  return start + (end - start) * alpha
}

export function smoothstep(min, max, value) {
  if (min === max) {
    return 0
  }

  const x = clamp((value - min) / (max - min), 0, 1)
  return x * x * (3 - 2 * x)
}

export function angleLerp(start, end, alpha) {
  let delta = end - start
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return start + delta * alpha
}
