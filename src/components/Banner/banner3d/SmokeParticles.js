import * as THREE from 'three'
import { clamp } from './math'
import { smokeFragmentShader, smokeVertexShader } from './shaders/smokeShader'

export class SmokeParticles {
  constructor(scene, { particleBudget, smokeOpacity }) {
    this.maxParticles = particleBudget
    this.opacity = smokeOpacity
    this.scene = scene
    this.cursor = 0

    this.positions = new Float32Array(this.maxParticles * 3)
    this.velocities = new Float32Array(this.maxParticles * 3)
    this.life = new Float32Array(this.maxParticles)
    this.size = new Float32Array(this.maxParticles)
    this.active = new Uint8Array(this.maxParticles)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('aLife', new THREE.BufferAttribute(this.life, 1))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1))

    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uOpacity: { value: this.opacity },
      },
      vertexShader: smokeVertexShader,
      fragmentShader: smokeFragmentShader,
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.scene.add(this.points)
  }

  setQuality(scale) {
    const clamped = clamp(scale, 0.35, 1)
    this.material.uniforms.uOpacity.value = this.opacity * clamped
  }

  emit(emitters, intensity, dt) {
    if (!Array.isArray(emitters) || emitters.length === 0) {
      return
    }

    const clampedIntensity = clamp(intensity, 0, 1)
    const emissionsPerFrame = Math.floor((4 + clampedIntensity * 10) * dt * 60)

    for (let i = 0; i < emissionsPerFrame; i += 1) {
      const source = emitters[i % emitters.length]
      if (!source) {
        continue
      }

      const index = this.cursor
      this.cursor = (this.cursor + 1) % this.maxParticles

      const baseIndex = index * 3
      this.positions[baseIndex] = source.x + (Math.random() - 0.5) * 0.14
      this.positions[baseIndex + 1] = Math.max(0.04, source.y + 0.02)
      this.positions[baseIndex + 2] = source.z + (Math.random() - 0.5) * 0.14

      this.velocities[baseIndex] = -0.2 + (Math.random() - 0.5) * 0.4
      this.velocities[baseIndex + 1] = 0.65 + Math.random() * 0.6
      this.velocities[baseIndex + 2] = -0.2 + (Math.random() - 0.5) * 0.4

      this.life[index] = 0.001
      this.size[index] = 26 + Math.random() * 22 + clampedIntensity * 12
      this.active[index] = 1
    }
  }

  update(deltaTime) {
    const dt = clamp(deltaTime, 1 / 240, 1 / 20)
    let hasChanges = false

    for (let i = 0; i < this.maxParticles; i += 1) {
      if (!this.active[i]) {
        continue
      }

      const baseIndex = i * 3
      const age = this.life[i] + dt * (0.72 + Math.random() * 0.08)
      this.life[i] = age

      if (age >= 1) {
        this.active[i] = 0
        this.size[i] = 0
        this.life[i] = 0
        continue
      }

      this.velocities[baseIndex] *= 0.985
      this.velocities[baseIndex + 2] *= 0.985
      this.velocities[baseIndex + 1] += 0.05 * dt

      this.positions[baseIndex] += this.velocities[baseIndex] * dt
      this.positions[baseIndex + 1] += this.velocities[baseIndex + 1] * dt
      this.positions[baseIndex + 2] += this.velocities[baseIndex + 2] * dt

      hasChanges = true
    }

    if (hasChanges) {
      this.geometry.attributes.position.needsUpdate = true
      this.geometry.attributes.aLife.needsUpdate = true
      this.geometry.attributes.aSize.needsUpdate = true
    }
  }

  dispose() {
    this.scene.remove(this.points)
    this.geometry.dispose()
    this.material.dispose()
  }
}
