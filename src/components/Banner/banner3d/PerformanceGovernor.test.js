import { PerformanceGovernor } from './PerformanceGovernor'

describe('PerformanceGovernor', () => {
  test('mantém qualidade máxima com FPS alto', () => {
    const governor = new PerformanceGovernor({ minFps: 30, autoQuality: true })

    for (let i = 0; i < 120; i += 1) {
      governor.update(1 / 60)
    }

    expect(governor.qualityScale).toBe(1)
    expect(governor.lastFps).toBeGreaterThan(30)
    expect(governor.pixelRatioScale).toBeGreaterThan(0.5)
  })

  test('reduz qualidade quando FPS fica abaixo do mínimo', () => {
    const governor = new PerformanceGovernor({ minFps: 30, autoQuality: true })
    let changed = false

    for (let i = 0; i < 150; i += 1) {
      changed = governor.update(1 / 20) || changed
    }

    expect(changed).toBe(true)
    expect(governor.qualityScale).toBeLessThan(1)
  })

  test('não altera qualidade quando autoQuality está desligado', () => {
    const governor = new PerformanceGovernor({ minFps: 30, autoQuality: false })
    let changed = false

    for (let i = 0; i < 200; i += 1) {
      changed = governor.update(1 / 20) || changed
    }

    expect(changed).toBe(false)
    expect(governor.qualityScale).toBe(1)
  })

  test('recupera qualidade após janelas estáveis de FPS alto', () => {
    const governor = new PerformanceGovernor({ minFps: 30, autoQuality: true })

    for (let i = 0; i < 150; i += 1) {
      governor.update(1 / 20)
    }

    const degradedScale = governor.qualityScale
    expect(degradedScale).toBeLessThan(1)

    for (let i = 0; i < 240; i += 1) {
      governor.update(1 / 90)
    }

    expect(governor.qualityScale).toBeGreaterThanOrEqual(degradedScale)
  })
})
