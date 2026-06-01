import * as THREE from 'three'
import { clamp } from './math'

const SEGMENT_MIN_DISTANCE = 0.12

export class TireMarks {
  constructor(scene, { tireMarkLife }) {
    this.scene = scene
    this.lifeSeconds = tireMarkLife
    this.maxMarks = 220
    this.marks = []
    this.previousLeft = null
    this.previousRight = null
    this.baseMaterial = new THREE.MeshStandardMaterial({
      color: '#0f1014',
      roughness: 0.9,
      metalness: 0.06,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  }

  reset() {
    this.marks.forEach(({ mesh }) => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    })

    this.marks.length = 0
    this.previousLeft = null
    this.previousRight = null
  }

  createSegment(start, end, intensity, time) {
    const dx = end.x - start.x
    const dz = end.z - start.z
    const distance = Math.hypot(dx, dz)

    if (distance < SEGMENT_MIN_DISTANCE) {
      return null
    }

    const width = 0.12 + intensity * 0.08
    const geometry = new THREE.PlaneGeometry(distance, width)
    const material = this.baseMaterial.clone()
    material.opacity = clamp(0.18 + intensity * 0.36, 0.12, 0.48)

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.rotation.z = Math.atan2(dz, dx)
    mesh.position.set((start.x + end.x) * 0.5, 0.03, (start.z + end.z) * 0.5)
    mesh.receiveShadow = true

    this.scene.add(mesh)

    return {
      mesh,
      bornAt: time,
      baseOpacity: material.opacity,
    }
  }

  addFromRearWheels(rearLeft, rearRight, intensity, time) {
    if (!rearLeft || !rearRight) {
      return
    }

    const clampedIntensity = clamp(intensity, 0, 1)
    if (clampedIntensity < 0.15) {
      this.previousLeft = rearLeft.clone()
      this.previousRight = rearRight.clone()
      return
    }

    if (!this.previousLeft || !this.previousRight) {
      this.previousLeft = rearLeft.clone()
      this.previousRight = rearRight.clone()
      return
    }

    const leftSegment = this.createSegment(this.previousLeft, rearLeft, clampedIntensity, time)
    const rightSegment = this.createSegment(this.previousRight, rearRight, clampedIntensity, time)

    if (leftSegment) {
      this.marks.push(leftSegment)
    }
    if (rightSegment) {
      this.marks.push(rightSegment)
    }

    this.previousLeft.copy(rearLeft)
    this.previousRight.copy(rearRight)

    while (this.marks.length > this.maxMarks) {
      const oldest = this.marks.shift()
      this.scene.remove(oldest.mesh)
      oldest.mesh.geometry.dispose()
      oldest.mesh.material.dispose()
    }
  }

  update(time) {
    for (let i = this.marks.length - 1; i >= 0; i -= 1) {
      const mark = this.marks[i]
      const age = time - mark.bornAt
      const fade = 1 - clamp(age / this.lifeSeconds, 0, 1)
      mark.mesh.material.opacity = mark.baseOpacity * fade

      if (fade <= 0) {
        this.scene.remove(mark.mesh)
        mark.mesh.geometry.dispose()
        mark.mesh.material.dispose()
        this.marks.splice(i, 1)
      }
    }
  }

  dispose() {
    this.reset()
    this.baseMaterial.dispose()
  }
}
