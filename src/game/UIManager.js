import { formatSeconds } from './Utils'

/**
 * Manages non-canvas HUD and menu screens.
 */
export default class UIManager {
  /**
   * @param {HTMLElement} mountElement
   */
  constructor(mountElement) {
    if (!(mountElement instanceof HTMLElement)) {
      throw new Error('UIManager precisa de elemento HTML valido para montagem.')
    }

    this.mountElement = mountElement
    this.startCallback = null
    this.restartCallback = null
    this.active = false
    this.nodes = {}
  }

  /**
   * Creates all UI nodes.
   * @param {{embedded?: boolean}} [options]
   */
  initialize(options = {}) {
    const embedded = Boolean(options.embedded)

    this.mountElement.innerHTML = ''
    this.mountElement.classList.add('drift-game-shell')
    this.mountElement.classList.toggle('drift-game-shell--embedded', embedded)

    const canvasHost = document.createElement('div')
    canvasHost.className = 'drift-game-canvas-host'
    if (embedded) {
      canvasHost.classList.add('drift-game-canvas-host--embedded')
    }

    const hud = document.createElement('div')
    hud.className = 'drift-game-hud'
    hud.innerHTML = `
      <div class="hud-block">
        <span class="hud-label">Drift Atual</span>
        <strong data-role="drift-time">0.00s</strong>
      </div>
      <div class="hud-block">
        <span class="hud-label">Pontuacao</span>
        <strong data-role="score">0</strong>
      </div>
      <div class="hud-block">
        <span class="hud-label">Melhor</span>
        <strong data-role="best-score">0</strong>
      </div>
      <div class="hud-drift-state" data-role="drift-indicator">Drift Inativo</div>
    `

    const overlay = document.createElement('div')
    overlay.className = 'drift-game-overlay'
    overlay.innerHTML = `
      <div class="overlay-card">
        <h1>Drift Open World</h1>
        <p>
          Controles: W/S acelera e re, A/D esterco, ESPACO ativa drift.
          Drift pontua quando o angulo de deslize passa 30 graus.
        </p>
        <button type="button" data-role="start-game">Iniciar Jogo</button>
      </div>
    `

    const gameOver = document.createElement('div')
    gameOver.className = 'drift-game-gameover hidden'
    gameOver.innerHTML = `
      <div class="overlay-card">
        <h2>Corrida Encerrada</h2>
        <p>Pontuacao Final: <strong data-role="final-score">0</strong></p>
        <p>Melhor da Sessao: <strong data-role="final-best-score">0</strong></p>
        <button type="button" data-role="restart-game">Reiniciar</button>
      </div>
    `

    this.mountElement.append(canvasHost, hud, overlay, gameOver)

    this.nodes = {
      canvasHost,
      hud,
      overlay,
      gameOver,
      driftTime: hud.querySelector('[data-role="drift-time"]'),
      score: hud.querySelector('[data-role="score"]'),
      bestScore: hud.querySelector('[data-role="best-score"]'),
      driftIndicator: hud.querySelector('[data-role="drift-indicator"]'),
      startButton: overlay.querySelector('[data-role="start-game"]'),
      restartButton: gameOver.querySelector('[data-role="restart-game"]'),
      finalScore: gameOver.querySelector('[data-role="final-score"]'),
      finalBestScore: gameOver.querySelector('[data-role="final-best-score"]'),
    }

    this.nodes.startButton?.addEventListener('click', () => {
      this.active = true
      this.hideOverlay()
      this.startCallback?.()
    })

    this.nodes.restartButton?.addEventListener('click', () => {
      this.hideGameOver()
      this.active = true
      this.restartCallback?.()
    })

  }

  /**
   * @param {() => void} callback
   */
  onStart(callback) {
    this.startCallback = callback
  }

  /**
   * @param {() => void} callback
   */
  onRestart(callback) {
    this.restartCallback = callback
  }

  hideOverlay() {
    this.nodes.overlay?.classList.add('hidden')
  }

  showOverlay() {
    this.nodes.overlay?.classList.remove('hidden')
    this.active = false
  }

  hideGameOver() {
    this.nodes.gameOver?.classList.add('hidden')
  }

  /**
   * @param {{score:number,bestScore:number}} summary
   */
  showGameOver(summary) {
    if (!summary) {
      return
    }
    this.active = false
    this.nodes.finalScore.textContent = String(summary.score)
    this.nodes.finalBestScore.textContent = String(summary.bestScore)
    this.nodes.gameOver?.classList.remove('hidden')
  }

  /**
   * Updates HUD values.
   * @param {{driftTime:number,score:number,bestScore:number,isDrifting:boolean}} values
   */
  updateHud(values) {
    if (!values) {
      return
    }

    this.nodes.driftTime.textContent = `${formatSeconds(values.driftTime)}s`
    this.nodes.score.textContent = String(values.score)
    this.nodes.bestScore.textContent = String(values.bestScore)
    this.nodes.driftIndicator.textContent = values.isDrifting ? 'Drift Ativo' : 'Drift Inativo'
    this.nodes.driftIndicator.classList.toggle('drift-on', values.isDrifting)
  }

  flashCollision() {
    this.mountElement.classList.remove('collision-hit')
    // Force layout for CSS animation restart.
    const _layout = this.mountElement.offsetHeight
    void _layout
    this.mountElement.classList.add('collision-hit')
  }

  /**
   * @returns {HTMLElement}
   */
  getCanvasHost() {
    return this.nodes.canvasHost
  }

  dispose() {
    this.mountElement.classList.remove('drift-game-shell', 'drift-game-shell--embedded', 'collision-hit')
    this.mountElement.innerHTML = ''
    this.nodes = {}
  }
}
