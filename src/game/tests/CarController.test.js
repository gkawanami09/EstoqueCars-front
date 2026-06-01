import * as THREE from 'three'
import CarController from '../CarController'
import { DEFAULT_CONFIG } from '../config/gameConfig'

function createController() {
  const scene = new THREE.Scene()
  return new CarController(scene, {
    ...DEFAULT_CONFIG.car,
    driftMinSpeed: DEFAULT_CONFIG.driftMinSpeed,
    driftMinAngleDeg: DEFAULT_CONFIG.driftMinAngleDeg,
  })
}

describe('CarController', () => {
  test('lança erro em update inválido', () => {
    const controller = createController()
    expect(() => controller.update(null, 1 / 60)).toThrow()
    expect(() => controller.update({ forward: true }, Number.NaN)).toThrow()
    controller.dispose()
  })

  test('move carro para frente com input W', () => {
    const controller = createController()
    const initialX = controller.getPosition().x

    for (let i = 0; i < 60; i += 1) {
      controller.update(
        { forward: true, backward: false, left: false, right: false, drift: false },
        1 / 60,
      )
    }

    const state = controller.getState()
    expect(controller.getPosition().x).toBeGreaterThan(initialX)
    expect(state.speed).toBeGreaterThan(0)
    controller.dispose()
  })

  test('ativa estado de drift ao esterçar com espaço pressionado', () => {
    const controller = createController()

    for (let i = 0; i < 90; i += 1) {
      controller.update(
        { forward: true, backward: false, left: false, right: false, drift: false },
        1 / 60,
      )
    }

    for (let i = 0; i < 90; i += 1) {
      controller.update(
        { forward: true, backward: false, left: true, right: false, drift: true },
        1 / 60,
      )
    }

    const state = controller.getState()
    expect(state.driftActive).toBe(true)
    expect(state.driftAngleDeg).toBeGreaterThan(0)
    controller.dispose()
  })

  test('responde a colisão com estado crashed', () => {
    const controller = createController()
    controller.applyCollision({ x: 1, y: 0 })

    const state = controller.getState()
    expect(state.crashed).toBe(true)
    expect(state.driftValid).toBe(false)
    controller.clearCrashState()
    expect(controller.getState().crashed).toBe(false)
    controller.dispose()
  })
})
