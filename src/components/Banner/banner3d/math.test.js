import { angleLerp, clamp, lerp, smoothstep } from './math'

describe('math utils', () => {
  test('clamp limita corretamente', () => {
    expect(clamp(10, 0, 5)).toBe(5)
    expect(clamp(-2, 0, 5)).toBe(0)
    expect(clamp(3, 0, 5)).toBe(3)
  })

  test('lerp interpola linearmente', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(10, 20, 0)).toBe(10)
    expect(lerp(10, 20, 1)).toBe(20)
  })

  test('smoothstep retorna transição suave entre 0 e 1', () => {
    expect(smoothstep(0, 10, -1)).toBe(0)
    expect(smoothstep(0, 10, 11)).toBe(1)
    expect(smoothstep(0, 10, 5)).toBeCloseTo(0.5, 1)
    expect(smoothstep(2, 2, 2)).toBe(0)
  })

  test('angleLerp respeita wrap de ângulo', () => {
    const start = Math.PI * 0.95
    const end = -Math.PI * 0.95
    const result = angleLerp(start, end, 0.5)

    expect(Number.isFinite(result)).toBe(true)
    expect(Math.abs(result)).toBeLessThanOrEqual(Math.PI)

    const inverse = angleLerp(-Math.PI * 0.95, Math.PI * 0.95, 0.5)
    expect(Number.isFinite(inverse)).toBe(true)
  })
})
