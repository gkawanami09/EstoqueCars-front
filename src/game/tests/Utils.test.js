import { clamp, createSeededRandom, formatSeconds, signedAngleBetween } from '../Utils'
import * as THREE from 'three'

describe('Utils', () => {
  test('clamp limita valores', () => {
    expect(clamp(12, 0, 10)).toBe(10)
    expect(clamp(-2, 0, 10)).toBe(0)
    expect(clamp(5, 0, 10)).toBe(5)
  })

  test('seeded random gera sequência determinística', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    expect(a()).toBeCloseTo(b(), 10)
    expect(a()).toBeCloseTo(b(), 10)
  })

  test('formata segundos com 2 casas', () => {
    expect(formatSeconds(3.456)).toBe('3.46')
    expect(formatSeconds(-1)).toBe('0.00')
  })

  test('signedAngleBetween calcula angulo esperado', () => {
    const forward = new THREE.Vector2(1, 0)
    const velocity = new THREE.Vector2(0, 1)
    const angle = signedAngleBetween(forward, velocity)
    expect(angle).toBeCloseTo(Math.PI / 2, 5)
  })
})
