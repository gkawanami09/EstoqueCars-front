import InputManager from '../InputManager'

function keyEvent(type, code) {
  return new KeyboardEvent(type, { code, bubbles: true, cancelable: true })
}

describe('InputManager', () => {
  test('lança erro com target inválido', () => {
    expect(() => new InputManager(null)).toThrow()
  })

  test('mapeia teclas permitidas para estado normalizado', () => {
    const input = new InputManager(window)
    input.enable()

    window.dispatchEvent(keyEvent('keydown', 'KeyW'))
    window.dispatchEvent(keyEvent('keydown', 'KeyA'))
    window.dispatchEvent(keyEvent('keydown', 'Space'))

    expect(input.getState()).toEqual({
      forward: true,
      backward: false,
      left: true,
      right: false,
      drift: true,
    })

    window.dispatchEvent(keyEvent('keyup', 'KeyW'))
    window.dispatchEvent(keyEvent('keyup', 'KeyA'))
    window.dispatchEvent(keyEvent('keyup', 'Space'))
    expect(input.getState().forward).toBe(false)
    expect(input.getState().left).toBe(false)
    expect(input.getState().drift).toBe(false)

    input.disable()
  })

  test('ignora teclas não permitidas e reseta no blur', () => {
    const input = new InputManager(window)
    input.enable()

    window.dispatchEvent(keyEvent('keydown', 'KeyQ'))
    expect(input.getState()).toEqual({
      forward: false,
      backward: false,
      left: false,
      right: false,
      drift: false,
    })

    window.dispatchEvent(keyEvent('keydown', 'KeyW'))
    window.dispatchEvent(new Event('blur'))
    expect(input.getState().forward).toBe(false)

    input.disable()
  })
})
