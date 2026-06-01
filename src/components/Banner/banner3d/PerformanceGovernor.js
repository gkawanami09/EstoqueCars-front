import { clamp } from './math'

const QUALITY_STEPS = [1, 0.82, 0.64, 0.48]

export class PerformanceGovernor {
  constructor({ minFps, autoQuality }) {
    this.minFps = minFps
    this.autoQuality = autoQuality
    this.currentLevel = 0
    this.accumulator = 0
    this.sampleFrames = 0
    this.recoveryWindows = 0
    this.lastFps = 60
  }

  get qualityScale() {
    return QUALITY_STEPS[this.currentLevel]
  }

  get pixelRatioScale() {
    return clamp(this.qualityScale + 0.2, 0.55, 1)
  }

  update(deltaTime) {
    const dt = clamp(deltaTime, 1 / 240, 1 / 15)
    this.accumulator += dt
    this.sampleFrames += 1

    if (this.accumulator < 0.9) {
      return false
    }

    this.lastFps = this.sampleFrames / this.accumulator
    this.sampleFrames = 0
    this.accumulator = 0

    if (!this.autoQuality) {
      return false
    }

    if (this.lastFps < this.minFps - 1 && this.currentLevel < QUALITY_STEPS.length - 1) {
      this.currentLevel += 1
      this.recoveryWindows = 0
      return true
    }

    if (this.lastFps > this.minFps + 10 && this.currentLevel > 0) {
      this.recoveryWindows += 1
      if (this.recoveryWindows >= 2) {
        this.currentLevel -= 1
        this.recoveryWindows = 0
        return true
      }
      return false
    }

    this.recoveryWindows = 0
    return false
  }
}
