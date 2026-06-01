import { DRIFT_DEFAULTS, sanitizeDriftConfig, sanitizeText } from './config'

describe('config sanitization', () => {
  test('aplica fallback para valores inválidos', () => {
    const safe = sanitizeDriftConfig({
      duration: 'foo',
      maxSpeed: -200,
      minSpeed: 999,
      modelUrl: 'javascript:alert(1)',
      autoQuality: 'false',
    })

    expect(safe.duration).toBe(DRIFT_DEFAULTS.duration)
    expect(safe.maxSpeed).toBeGreaterThanOrEqual(DRIFT_DEFAULTS.minSpeed)
    expect(safe.minSpeed).toBeLessThanOrEqual(safe.maxSpeed)
    expect(safe.modelUrl).toBe(DRIFT_DEFAULTS.modelUrl)
    expect(safe.autoQuality).toBe(false)
  })

  test('limita números dentro de faixas seguras', () => {
    const safe = sanitizeDriftConfig({
      duration: 1000,
      smokeOpacity: -5,
      particleBudget: 9999,
      minFps: 5,
    })

    expect(safe.duration).toBeLessThanOrEqual(10)
    expect(safe.smokeOpacity).toBeGreaterThanOrEqual(0.1)
    expect(safe.particleBudget).toBeLessThanOrEqual(650)
    expect(safe.minFps).toBeGreaterThanOrEqual(24)
  })

  test('sanitizeText mantém string útil e aplica fallback se vazia', () => {
    expect(sanitizeText('  drift  ', 'fallback')).toBe('drift')
    expect(sanitizeText('   ', 'fallback')).toBe('fallback')
    expect(sanitizeText(null, 'fallback')).toBe('fallback')
  })

  test('aceita URL de modelo válida e flag booleana em string', () => {
    const safe = sanitizeDriftConfig({
      modelUrl: '/assets/custom.gltf',
      autoQuality: 'true',
    })

    expect(safe.modelUrl).toBe('/assets/custom.gltf')
    expect(safe.autoQuality).toBe(true)
  })

  test('usa fallback quando modelUrl chega vazio', () => {
    const safe = sanitizeDriftConfig({
      modelUrl: '   ',
    })

    expect(safe.modelUrl).toBe(DRIFT_DEFAULTS.modelUrl)
  })
})
