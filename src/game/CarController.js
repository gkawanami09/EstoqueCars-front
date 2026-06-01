import * as THREE from 'three'
import { clamp, forwardFromYaw, isFiniteNumber, lerp, signedAngleBetween } from './Utils'

const RAD_TO_DEG = 180 / Math.PI

function createWheel() {
  const material = new THREE.MeshStandardMaterial({
    color: 0x1b1b1b,
    roughness: 0.78,
    metalness: 0.12,
  })
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 18), material)
  wheel.rotation.z = Math.PI / 2
  wheel.castShadow = true
  wheel.receiveShadow = true
  return wheel
}

function createSportsCarMesh() {
  const car = new THREE.Group()

  const paint = new THREE.MeshPhysicalMaterial({
    color: '#f9423a',
    metalness: 0.6,
    roughness: 0.22,
    clearcoat: 0.84,
    clearcoatRoughness: 0.2,
  })

  const dark = new THREE.MeshStandardMaterial({
    color: '#151821',
    metalness: 0.3,
    roughness: 0.54,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 2.15), paint)
  body.position.y = 1.02
  body.castShadow = true
  body.receiveShadow = true
  car.add(body)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.38, 2.04), paint)
  hood.position.set(1.38, 1.36, 0)
  hood.castShadow = true
  car.add(hood)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.65, 1.68), dark)
  roof.position.set(0.18, 1.68, 0)
  roof.castShadow = true
  car.add(roof)

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 1.6), dark)
  spoiler.position.set(-2.08, 1.45, 0)
  spoiler.castShadow = true
  car.add(spoiler)

  const wheels = [
    { x: 1.5, y: 0.5, z: 1.05 },
    { x: 1.5, y: 0.5, z: -1.05 },
    { x: -1.5, y: 0.5, z: 1.05 },
    { x: -1.5, y: 0.5, z: -1.05 },
  ].map((position, index) => {
    const wheel = createWheel()
    wheel.position.set(position.x, position.y, position.z)
    wheel.name = `Wheel-${index}`
    car.add(wheel)
    return wheel
  })

  car.userData.wheels = wheels
  return car
}

/**
 * Controls car movement and simplified drift physics.
 */
export default class CarController {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./config/gameConfig').DEFAULT_CONFIG['car'] & {driftMinSpeed: number, driftMinAngleDeg: number}} config
   */
  constructor(scene, config) {
    if (!scene || typeof scene.add !== 'function') {
      throw new Error('CarController precisa de uma cena Three.js valida.')
    }
    if (!config || typeof config !== 'object') {
      throw new Error('CarController precisa de configuracao valida.')
    }

    this.scene = scene
    this.config = config
    this.mesh = createSportsCarMesh()
    this.mesh.position.set(0, 0, 0)
    this.mesh.castShadow = true
    this.scene.add(this.mesh)

    this.state = {
      yaw: 0,
      speed: 0,
      driftActive: false,
      driftValid: false,
      driftAngleDeg: 0,
      steeringInput: 0,
      crashed: false,
    }

    this.velocity = new THREE.Vector2(0, 0)
    this.boundingRadius = 1.55
  }

  /**
   * Update physics from input.
   * @param {{forward: boolean, backward: boolean, left: boolean, right: boolean, drift: boolean}} input
   * @param {number} deltaTime
   */
  update(input, deltaTime) {
    if (!input || typeof input !== 'object') {
      throw new Error('Input invalido em CarController.update.')
    }
    if (!isFiniteNumber(deltaTime)) {
      throw new Error('Delta time invalido em CarController.update.')
    }

    const dt = clamp(deltaTime, 1 / 240, 1 / 20)
    const steerAxis = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const throttleAxis = (input.forward ? 1 : 0) - (input.backward ? 1 : 0)

    const currentForward = forwardFromYaw(this.state.yaw)
    const currentRight = new THREE.Vector2(-currentForward.y, currentForward.x)
    const forwardSpeed = this.velocity.dot(currentForward)
    const lateralSpeed = this.velocity.dot(currentRight)
    const speedAbs = this.velocity.length()

    const turnFactor = clamp(speedAbs / this.config.maxForwardSpeed, 0, 1)
    const turnSpeed = this.config.turnSpeed * lerp(0.32, 1, turnFactor)

    const wantsDrift = Boolean(
      input.drift && Math.abs(steerAxis) > 0.1 && speedAbs >= this.config.driftMinSpeed,
    )
    this.state.driftActive = wantsDrift
    this.state.steeringInput = steerAxis

    let nextForwardSpeed = forwardSpeed

    if (throttleAxis > 0) {
      nextForwardSpeed += this.config.acceleration * throttleAxis * dt
    } else if (throttleAxis < 0) {
      nextForwardSpeed += this.config.reverseAcceleration * throttleAxis * dt
    }

    if (throttleAxis === 0) {
      const decay = clamp(this.config.drag * dt, 0, 1)
      nextForwardSpeed = lerp(nextForwardSpeed, 0, decay)
    }

    if (throttleAxis > 0 && forwardSpeed < 0) {
      nextForwardSpeed += this.config.brakeDeceleration * dt
    }
    if (throttleAxis < 0 && forwardSpeed > 0) {
      nextForwardSpeed -= this.config.brakeDeceleration * dt
    }

    nextForwardSpeed = clamp(nextForwardSpeed, -this.config.maxReverseSpeed, this.config.maxForwardSpeed)
    const yawMultiplier = wantsDrift ? this.config.driftYawBoost : 1
    this.state.yaw += steerAxis * turnSpeed * yawMultiplier * dt

    const nextForward = forwardFromYaw(this.state.yaw)
    const nextRight = new THREE.Vector2(-nextForward.y, nextForward.x)
    const grip = wantsDrift ? this.config.driftGrip : this.config.tractionGrip
    const lateralDecay = clamp(grip * dt, 0, 1)
    const dampedLateral = lerp(lateralSpeed, 0, lateralDecay)

    this.velocity.copy(nextForward.multiplyScalar(nextForwardSpeed))
    this.velocity.add(nextRight.multiplyScalar(dampedLateral))

    const maxVelocity = this.config.maxForwardSpeed * 1.06
    if (this.velocity.length() > maxVelocity) {
      this.velocity.setLength(maxVelocity)
    }

    this.mesh.position.x += this.velocity.x * dt
    this.mesh.position.z += this.velocity.y * dt
    this.mesh.rotation.y = -this.state.yaw

    this.state.speed = this.velocity.length()
    const slipRadians = signedAngleBetween(
      forwardFromYaw(this.state.yaw),
      this.velocity.clone(),
    )
    this.state.driftAngleDeg = Math.abs(slipRadians * RAD_TO_DEG)
    this.state.driftValid = Boolean(
      this.state.driftActive
        && this.state.speed >= this.config.driftMinSpeed
        && this.state.driftAngleDeg >= this.config.driftMinAngleDeg,
    )

    this.updateWheelVisual(dt, steerAxis)
  }

  /**
   * @param {number} dt
   * @param {number} steerAxis
   */
  updateWheelVisual(dt, steerAxis) {
    const wheels = this.mesh.userData.wheels
    if (!Array.isArray(wheels)) {
      return
    }

    const roll = this.state.speed * dt * 1.2
    wheels.forEach((wheel, index) => {
      wheel.rotation.x += roll
      if (index < 2) {
        wheel.rotation.y = steerAxis * 0.42
      }
    })

    const bodyLean = this.state.driftActive ? 0.05 : 0.02
    this.mesh.rotation.z = -clamp(this.state.steeringInput * bodyLean, -0.08, 0.08)
  }

  /**
   * Applies collision response and marks car as crashed in current frame.
   * @param {THREE.Vector2} collisionNormal
   */
  applyCollision(collisionNormal, slowdownFactor = 0.25) {
    if (
      !collisionNormal
      || !isFiniteNumber(collisionNormal.x)
      || !isFiniteNumber(collisionNormal.y)
    ) {
      return
    }

    const normal = new THREE.Vector2(collisionNormal.x, collisionNormal.y)
    if (normal.lengthSq() === 0) {
      return
    }
    normal.normalize()

    const dot = this.velocity.dot(normal)
    const reflected = this.velocity
      .clone()
      .sub(normal.clone().multiplyScalar(2 * dot))
      .multiplyScalar(clamp(slowdownFactor, 0.05, 0.9))
    this.velocity.copy(reflected)
    this.state.crashed = true
    this.state.driftActive = false
    this.state.driftValid = false
  }

  /**
   * Resets crash flag for next frame.
   */
  clearCrashState() {
    this.state.crashed = false
  }

  /**
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.mesh.position
  }

  /**
   * @returns {THREE.Vector2}
   */
  getVelocity() {
    return this.velocity.clone()
  }

  /**
   * @returns {number}
   */
  getBoundingRadius() {
    return this.boundingRadius
  }

  /**
   * @returns {{yaw:number,speed:number,driftActive:boolean,driftValid:boolean,driftAngleDeg:number,steeringInput:number,crashed:boolean}}
   */
  getState() {
    return { ...this.state }
  }

  /**
   * @param {THREE.Vector3} [position]
   */
  reset(position = new THREE.Vector3(0, 0, 0)) {
    this.mesh.position.copy(position)
    this.mesh.position.y = 0
    this.mesh.rotation.set(0, 0, 0)
    this.velocity.set(0, 0)
    this.state.yaw = 0
    this.state.speed = 0
    this.state.driftActive = false
    this.state.driftValid = false
    this.state.driftAngleDeg = 0
    this.state.steeringInput = 0
    this.state.crashed = false
  }

  /**
   * Cleans GPU resources.
   */
  dispose() {
    this.scene.remove(this.mesh)
    this.mesh.traverse((node) => {
      if (node.geometry) {
        node.geometry.dispose()
      }
      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose())
      } else if (node.material) {
        node.material.dispose()
      }
    })
  }
}
