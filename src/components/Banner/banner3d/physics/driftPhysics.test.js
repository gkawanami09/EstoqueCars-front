import { DRIFT_DEFAULTS } from '../config'
import { createControlInputs, createInitialDriftState, simulateDriftStep } from './driftPhysics'

const baseConfig = {
  ...DRIFT_DEFAULTS,
}

describe('driftPhysics', () => {
  test('cria estado inicial dentro dos limites de velocidade', () => {
    const state = createInitialDriftState(baseConfig)

    expect(state.time).toBe(0)
    expect(state.x).toBeLessThan(0)
    expect(state.vx).toBeGreaterThanOrEqual(baseConfig.minSpeed)
    expect(state.vx).toBeLessThanOrEqual(baseConfig.maxSpeed)
  })

  test('gera inputs de controle normalizados', () => {
    const inputAtStart = createControlInputs(0, baseConfig)
    const inputAtMiddle = createControlInputs(baseConfig.duration * 0.5, baseConfig)
    const inputAtEnd = createControlInputs(baseConfig.duration, baseConfig)

    expect(inputAtStart.normalizedTime).toBe(0)
    expect(inputAtMiddle.normalizedTime).toBeCloseTo(0.5, 1)
    expect(inputAtEnd.normalizedTime).toBe(1)

    expect(inputAtStart.throttle).toBeGreaterThan(0)
    expect(inputAtMiddle.steering).toBeGreaterThanOrEqual(-0.05)
    expect(inputAtEnd.brake).toBeGreaterThanOrEqual(0)
  })

  test('simula drift sem sair dos limites físicos configurados', () => {
    let state = createInitialDriftState(baseConfig)
    const dt = 1 / 60

    for (let i = 0; i < 240; i += 1) {
      const controls = createControlInputs(state.time, baseConfig)
      state = simulateDriftStep(state, baseConfig, dt, controls)
    }

    const speed = Math.hypot(state.vx, state.vz)
    expect(speed).toBeGreaterThanOrEqual(baseConfig.minSpeed)
    expect(speed).toBeLessThanOrEqual(baseConfig.maxSpeed)
    expect(Number.isFinite(state.yaw)).toBe(true)
    expect(Number.isFinite(state.driftAngle)).toBe(true)
  })

  test('marca ciclo concluído ao final da duração', () => {
    let state = createInitialDriftState(baseConfig)
    const dt = 1 / 60

    for (let i = 0; i < 720; i += 1) {
      const controls = createControlInputs(state.time, baseConfig)
      state = simulateDriftStep(state, baseConfig, dt, controls)

      if (state.completed) {
        break
      }
    }

    expect(state.completed).toBe(true)
  })

  test('trata vetor de velocidade nulo sem gerar NaN', () => {
    const zeroState = {
      ...createInitialDriftState(baseConfig),
      vx: 0,
      vz: 0,
    }

    const controls = createControlInputs(0.1, baseConfig)
    const next = simulateDriftStep(zeroState, baseConfig, 1 / 60, controls)

    expect(Number.isFinite(next.vx)).toBe(true)
    expect(Number.isFinite(next.vz)).toBe(true)
    expect(Math.hypot(next.vx, next.vz)).toBeGreaterThan(0)
  })

  test('executa branch de velocidade exatamente zero', () => {
    const neutralConfig = {
      ...baseConfig,
      minSpeed: 0,
      maxSpeed: 0,
      entrySpeed: 0,
      acceleration: 0,
      lateralGrip: 0,
      grip: 0,
      steeringStrength: 0,
    }

    const state = {
      ...createInitialDriftState(neutralConfig),
      vx: 0,
      vz: 0,
      yawRate: 0,
    }

    const next = simulateDriftStep(
      state,
      neutralConfig,
      1 / 60,
      { normalizedTime: 0.1, steering: 0, throttle: 0, brake: 0 },
    )

    expect(next.vx).toBe(0)
    expect(next.vz).toBe(0)
  })
})
