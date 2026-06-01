import { clamp, lerp, smoothstep } from '../math'

const DEG_TO_RAD = Math.PI / 180

export function createInitialDriftState(config) {
  const startSpeed = clamp(config.entrySpeed, config.minSpeed, config.maxSpeed)
  return {
    time: 0,
    x: -15,
    z: 1.8,
    yaw: 0,
    vx: startSpeed,
    vz: 0,
    yawRate: 0,
    wheelSpin: 0,
    driftAngle: 0,
    completed: false,
  }
}

export function createControlInputs(elapsedTime, config) {
  const t = clamp(elapsedTime / config.duration, 0, 1)
  const driftWindow = smoothstep(0.12, 0.24, t) * (1 - smoothstep(0.63, 0.81, t))

  const steering = lerp(-0.05, 0.95, driftWindow)
  const throttle = lerp(0.85, 0.65, smoothstep(0.55, 1, t))
  const brake = smoothstep(0.7, 0.88, t) * 0.36

  return {
    normalizedTime: t,
    steering,
    throttle,
    brake,
  }
}

export function simulateDriftStep(previousState, config, deltaTime, inputs) {
  const state = { ...previousState }
  const dt = clamp(deltaTime, 1 / 240, 1 / 20)

  const forwardX = Math.cos(state.yaw)
  const forwardZ = Math.sin(state.yaw)
  const rightX = -forwardZ
  const rightZ = forwardX

  const forwardSpeed = state.vx * forwardX + state.vz * forwardZ
  const lateralSpeed = state.vx * rightX + state.vz * rightZ
  const speed = Math.hypot(state.vx, state.vz)

  const targetSpeed = clamp(
    config.entrySpeed + inputs.throttle * (config.maxSpeed - config.entrySpeed),
    config.minSpeed,
    config.maxSpeed,
  )

  const speedError = targetSpeed - speed
  const tractionForce = speedError * config.acceleration * 0.42
  const brakingForce = inputs.brake * config.acceleration * 2.2
  const longitudinalForce = tractionForce - brakingForce

  const maxDriftAngle = config.maxDriftAngleDeg * DEG_TO_RAD
  const rawSlipAngle = Math.atan2(lateralSpeed, Math.max(1, Math.abs(forwardSpeed)))
  const slipAngle = clamp(rawSlipAngle, -maxDriftAngle, maxDriftAngle)

  const lateralDamping = config.lateralGrip * (1.1 + Math.abs(slipAngle) * 2.4)
  const lateralForce = -lateralSpeed * lateralDamping

  const steerTorque = inputs.steering * config.steeringStrength
  const aligningTorque = -slipAngle * config.grip * 0.66
  const dampingTorque = -state.yawRate * 5.4
  const yawAcceleration = steerTorque + aligningTorque + dampingTorque

  state.yawRate += yawAcceleration * dt
  state.yaw += state.yawRate * dt

  const worldForceX = forwardX * longitudinalForce + rightX * lateralForce
  const worldForceZ = forwardZ * longitudinalForce + rightZ * lateralForce

  state.vx += worldForceX * dt
  state.vz += worldForceZ * dt

  const boundedSpeed = clamp(Math.hypot(state.vx, state.vz), config.minSpeed, config.maxSpeed)
  const velocityLength = Math.hypot(state.vx, state.vz) || 1
  const speedScale = boundedSpeed / velocityLength
  state.vx *= speedScale
  state.vz *= speedScale

  state.x += state.vx * dt
  state.z += state.vz * dt

  state.wheelSpin += boundedSpeed * dt * 1.85
  state.driftAngle = slipAngle
  state.time += dt
  state.completed = inputs.normalizedTime >= 1

  return state
}
