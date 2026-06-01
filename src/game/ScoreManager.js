import { clamp, isFiniteNumber, safeStorageGet, safeStorageSet } from './Utils'

const BEST_SCORE_KEY = 'drift_game_best_score'

/**
 * Manages drift timing and scoring.
 */
export default class ScoreManager {
  /**
   * @param {import('./config/gameConfig').DEFAULT_CONFIG} config
   */
  constructor(config) {
    if (!config) {
      throw new Error('ScoreManager precisa de configuracao valida.')
    }

    this.config = config
    this.currentScore = 0
    this.currentDriftTime = 0
    this.bestScore = this.loadBestScore()
    this.wasDrifting = false
    this.lastDriftScore = 0
  }

  /**
   * @returns {number}
   */
  loadBestScore() {
    const raw = safeStorageGet(BEST_SCORE_KEY, '0')
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
  }

  persistBestScore() {
    safeStorageSet(BEST_SCORE_KEY, String(this.bestScore))
  }

  /**
   * Updates score based on drift state.
   * @param {number} deltaTime
   * @param {{driftValid:boolean,driftActive:boolean,driftAngleDeg:number,speed:number}} carState
   * @returns {{driftStarted:boolean,driftEnded:boolean,driftActive:boolean,driftTime:number,currentScore:number,bestScore:number,lastDriftScore:number}}
   */
  update(deltaTime, carState) {
    if (!isFiniteNumber(deltaTime)) {
      throw new Error('ScoreManager.update recebeu deltaTime invalido.')
    }
    if (!carState || typeof carState !== 'object') {
      throw new Error('ScoreManager.update recebeu estado do carro invalido.')
    }

    const dt = clamp(deltaTime, this.config.minDeltaTime, this.config.maxDeltaTime)
    const driftActive = Boolean(carState.driftValid)
    const driftStarted = driftActive && !this.wasDrifting
    const driftEnded = !driftActive && this.wasDrifting

    if (driftActive) {
      this.currentDriftTime += dt
      const angleFactor = clamp(carState.driftAngleDeg / 70, 0.6, 1.9)
      const speedFactor = clamp(carState.speed / this.config.car.maxForwardSpeed, 0.3, 1.3)
      const increment = dt * 120 * angleFactor * speedFactor
      this.currentScore += increment
      this.lastDriftScore += increment
    }

    if (driftEnded) {
      this.lastDriftScore = 0
    }

    this.wasDrifting = driftActive
    this.currentScore = Math.max(0, this.currentScore)

    if (this.currentScore > this.bestScore) {
      this.bestScore = Math.floor(this.currentScore)
      this.persistBestScore()
    }

    return {
      driftStarted,
      driftEnded,
      driftActive,
      driftTime: this.currentDriftTime,
      currentScore: Math.floor(this.currentScore),
      bestScore: this.bestScore,
      lastDriftScore: Math.floor(this.lastDriftScore),
    }
  }

  /**
   * Applies collision penalty and stops current drift combo.
   */
  applyCollisionPenalty() {
    this.currentScore = Math.max(0, this.currentScore - this.config.collisionPenaltyScore)
    this.wasDrifting = false
    this.lastDriftScore = 0
  }

  /**
   * Resets current session score while keeping best score.
   */
  resetSession() {
    this.currentScore = 0
    this.currentDriftTime = 0
    this.wasDrifting = false
    this.lastDriftScore = 0
  }

  /**
   * @returns {{currentScore:number,currentDriftTime:number,bestScore:number,wasDrifting:boolean}}
   */
  getState() {
    return {
      currentScore: Math.floor(this.currentScore),
      currentDriftTime: this.currentDriftTime,
      bestScore: this.bestScore,
      wasDrifting: this.wasDrifting,
    }
  }
}

export { BEST_SCORE_KEY }
