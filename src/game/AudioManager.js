/**
 * Handles game audio playback.
 */
export default class AudioManager {
  constructor() {
    this.enabled = true
    this.loaded = false
    this.engineAudio = null
    this.driftLoopAudio = null
    this.collisionAudio = null
  }

  /**
   * Initializes and preloads audio resources.
   */
  initialize() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      this.enabled = false
      return
    }

    try {
      this.engineAudio = new Audio('/assets/drift-game/sounds/engine-loop.wav')
      this.engineAudio.loop = true
      this.engineAudio.volume = 0

      this.driftLoopAudio = new Audio('/assets/drift-game/sounds/drift-loop.wav')
      this.driftLoopAudio.loop = true
      this.driftLoopAudio.volume = 0

      this.collisionAudio = new Audio('/assets/drift-game/sounds/collision.wav')
      this.collisionAudio.volume = 0.6

      this.loaded = true
    } catch (error) {
      console.warn('[DriftGame] Falha ao inicializar audio:', error)
      this.enabled = false
    }
  }

  /**
   * Starts looping audios after user interaction.
   */
  start() {
    if (!this.enabled || !this.loaded) {
      return
    }

    const startLoop = async (audio) => {
      try {
        if (audio.paused) {
          await audio.play()
        }
      } catch {
        // Ignore autoplay restrictions; next interaction will retry.
      }
    }

    startLoop(this.engineAudio)
    startLoop(this.driftLoopAudio)
  }

  /**
   * @param {number} speed
   * @param {number} maxSpeed
   * @param {boolean} drifting
   */
  update(speed, maxSpeed, drifting) {
    if (!this.enabled || !this.loaded) {
      return
    }

    const normalizedSpeed = Math.max(0, Math.min(1, speed / Math.max(1, maxSpeed)))

    if (this.engineAudio) {
      this.engineAudio.volume = 0.08 + normalizedSpeed * 0.22
      this.engineAudio.playbackRate = 0.8 + normalizedSpeed * 0.55
    }

    if (this.driftLoopAudio) {
      const target = drifting ? 0.34 : 0
      this.driftLoopAudio.volume += (target - this.driftLoopAudio.volume) * 0.2
      this.driftLoopAudio.playbackRate = 0.95 + normalizedSpeed * 0.35
    }
  }

  playCollision() {
    if (!this.enabled || !this.loaded || !this.collisionAudio) {
      return
    }

    try {
      this.collisionAudio.currentTime = 0
      this.collisionAudio.play()
    } catch {
      // ignore
    }
  }

  stopAll() {
    if (!this.loaded) {
      return
    }

    const audios = [this.engineAudio, this.driftLoopAudio, this.collisionAudio]
    audios.forEach((audio) => {
      if (!audio) {
        return
      }
      audio.pause()
      audio.currentTime = 0
    })
  }

  dispose() {
    this.stopAll()
    this.engineAudio = null
    this.driftLoopAudio = null
    this.collisionAudio = null
    this.loaded = false
  }
}
