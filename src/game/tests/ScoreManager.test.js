import ScoreManager, { BEST_SCORE_KEY } from '../ScoreManager'
import { DEFAULT_CONFIG } from '../config/gameConfig'

describe('ScoreManager', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('incrementa score durante drift válido', () => {
    const manager = new ScoreManager(DEFAULT_CONFIG)
    const state = manager.update(1 / 30, {
      driftValid: true,
      driftActive: true,
      driftAngleDeg: 40,
      speed: 30,
    })

    expect(state.currentScore).toBeGreaterThan(0)
    expect(state.driftTime).toBeGreaterThan(0)
    expect(state.driftActive).toBe(true)
  })

  test('aplica penalidade de colisão e mantém score não negativo', () => {
    const manager = new ScoreManager(DEFAULT_CONFIG)
    manager.update(1, {
      driftValid: true,
      driftActive: true,
      driftAngleDeg: 50,
      speed: 35,
    })

    manager.applyCollisionPenalty()
    const summary = manager.getState()
    expect(summary.currentScore).toBeGreaterThanOrEqual(0)
    expect(summary.wasDrifting).toBe(false)
  })

  test('persiste melhor score no localStorage', () => {
    const manager = new ScoreManager(DEFAULT_CONFIG)
    manager.update(2, {
      driftValid: true,
      driftActive: true,
      driftAngleDeg: 55,
      speed: 44,
    })

    const persisted = window.localStorage.getItem(BEST_SCORE_KEY)
    expect(Number(persisted)).toBeGreaterThan(0)
  })

  test('reseta sessão sem apagar melhor score', () => {
    const manager = new ScoreManager(DEFAULT_CONFIG)
    manager.update(1, {
      driftValid: true,
      driftActive: true,
      driftAngleDeg: 45,
      speed: 35,
    })
    const bestBefore = manager.getState().bestScore
    manager.resetSession()

    const summary = manager.getState()
    expect(summary.currentScore).toBe(0)
    expect(summary.currentDriftTime).toBe(0)
    expect(summary.bestScore).toBe(bestBefore)
  })
})
