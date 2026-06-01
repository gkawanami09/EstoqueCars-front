const ALLOWED_KEY_CODES = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'])

/**
 * Input state for gameplay.
 * @typedef {Object} InputState
 * @property {boolean} forward
 * @property {boolean} backward
 * @property {boolean} left
 * @property {boolean} right
 * @property {boolean} drift
 */

/**
 * Handles and normalizes keyboard inputs.
 */
export default class InputManager {
  /**
   * @param {Window | Document} [target]
   */
  constructor(target = window) {
    if (!target || typeof target.addEventListener !== 'function') {
      throw new Error('InputManager precisa de alvo valido para eventos de teclado.')
    }

    this.target = target
    this.enabled = false
    this.state = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false,
    }

    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleKeyUp = this.handleKeyUp.bind(this)
    this.handleWindowBlur = this.handleWindowBlur.bind(this)
  }

  /**
   * Enables keyboard listeners.
   */
  enable() {
    if (this.enabled) {
      return
    }

    this.target.addEventListener('keydown', this.handleKeyDown)
    this.target.addEventListener('keyup', this.handleKeyUp)
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this.handleWindowBlur)
    }
    this.enabled = true
  }

  /**
   * Disables keyboard listeners and clears state.
   */
  disable() {
    if (!this.enabled) {
      return
    }

    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target.removeEventListener('keyup', this.handleKeyUp)
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this.handleWindowBlur)
    }
    this.enabled = false
    this.reset()
  }

  /**
   * Resets state.
   */
  reset() {
    this.state.forward = false
    this.state.backward = false
    this.state.left = false
    this.state.right = false
    this.state.drift = false
  }

  /**
   * @returns {InputState}
   */
  getState() {
    return { ...this.state }
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    this.processKey(event, true)
  }

  /**
   * @param {KeyboardEvent} event
   */
  handleKeyUp(event) {
    this.processKey(event, false)
  }

  /**
   * @private
   */
  handleWindowBlur() {
    this.reset()
  }

  /**
   * @private
   * @param {KeyboardEvent} event
   * @param {boolean} pressed
   */
  processKey(event, pressed) {
    if (!event || !ALLOWED_KEY_CODES.has(event.code)) {
      return
    }

    event.preventDefault()

    switch (event.code) {
      case 'KeyW':
        this.state.forward = pressed
        break
      case 'KeyS':
        this.state.backward = pressed
        break
      case 'KeyA':
        this.state.left = pressed
        break
      case 'KeyD':
        this.state.right = pressed
        break
      case 'Space':
        this.state.drift = pressed
        break
      default:
        break
    }
  }
}

export { ALLOWED_KEY_CODES }
