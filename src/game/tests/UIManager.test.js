import UIManager from '../UIManager'

describe('UIManager', () => {
  test('inicializa layout e atualiza HUD', () => {
    const mount = document.createElement('div')
    const ui = new UIManager(mount)
    ui.initialize()

    ui.updateHud({
      driftTime: 1.23,
      score: 150,
      bestScore: 300,
      isDrifting: true,
    })

    expect(mount.querySelector('[data-role="drift-time"]').textContent).toContain('1.23')
    expect(mount.querySelector('[data-role="score"]').textContent).toBe('150')
    expect(mount.querySelector('[data-role="best-score"]').textContent).toBe('300')
    expect(mount.querySelector('[data-role="drift-indicator"]').textContent).toContain('Ativo')

    ui.dispose()
  })

  test('executa callbacks de start e restart', () => {
    const mount = document.createElement('div')
    const ui = new UIManager(mount)
    ui.initialize()

    const onStart = jest.fn()
    const onRestart = jest.fn()
    ui.onStart(onStart)
    ui.onRestart(onRestart)

    mount.querySelector('[data-role="start-game"]').click()
    expect(onStart).toHaveBeenCalledTimes(1)

    ui.showGameOver({ score: 40, bestScore: 70 })
    mount.querySelector('[data-role="restart-game"]').click()
    expect(onRestart).toHaveBeenCalledTimes(1)

    ui.dispose()
  })
})
