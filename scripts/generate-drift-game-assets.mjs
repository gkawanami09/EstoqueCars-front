import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

class NodeFileReader {
  constructor() {
    this.result = null
    this.onloadend = null
    this.onerror = null
  }

  async readAsArrayBuffer(blob) {
    try {
      this.result = await blob.arrayBuffer()
      this.onloadend?.()
    } catch (error) {
      this.onerror?.(error)
    }
  }

  async readAsDataURL(blob) {
    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`
      this.onloadend?.()
    } catch (error) {
      this.onerror?.(error)
    }
  }
}

globalThis.FileReader = NodeFileReader

function createCarModel() {
  const car = new THREE.Group()
  car.name = 'SportsCar'

  const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#f6423a', metalness: 0.58, roughness: 0.24 })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#161a21', metalness: 0.2, roughness: 0.66 })

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.8, 2.2), bodyMaterial)
  body.position.set(0, 1.02, 0)
  body.name = 'Body'
  car.add(body)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.36, 2.1), bodyMaterial)
  hood.position.set(1.35, 1.36, 0)
  hood.name = 'Hood'
  car.add(hood)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.68, 1.72), darkMaterial)
  roof.position.set(0.18, 1.7, 0)
  roof.name = 'Roof'
  car.add(roof)

  const wheelPositions = [
    ['WheelFL', [1.5, 0.5, 1.05]],
    ['WheelFR', [1.5, 0.5, -1.05]],
    ['WheelRL', [-1.5, 0.5, 1.05]],
    ['WheelRR', [-1.5, 0.5, -1.05]],
  ]

  wheelPositions.forEach(([name, values]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.25, 18),
      darkMaterial,
    )
    wheel.rotation.z = Math.PI / 2
    wheel.position.set(values[0], values[1], values[2])
    wheel.name = String(name)
    car.add(wheel)
  })

  return car
}

function writeWavBuffer({ frequency, seconds, sampleRate = 44100, volume = 0.45 }) {
  const sampleCount = Math.floor(seconds * sampleRate)
  const channelCount = 1
  const bitsPerSample = 16
  const blockAlign = (channelCount * bitsPerSample) / 8
  const byteRate = sampleRate * blockAlign
  const dataSize = sampleCount * blockAlign
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(channelCount, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(byteRate, 28)
  buffer.writeUInt16LE(blockAlign, 32)
  buffer.writeUInt16LE(bitsPerSample, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / sampleRate
    const fade = Math.min(1, t / 0.04) * Math.min(1, (seconds - t) / 0.08)
    const wave = Math.sin(2 * Math.PI * frequency * t)
    const harmonic = Math.sin(2 * Math.PI * frequency * 2.1 * t) * 0.25
    const sample = Math.max(-1, Math.min(1, (wave + harmonic) * volume * fade))
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2)
  }

  return buffer
}

function createAsphaltSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#3f444b"/>
  <g opacity="0.22" fill="#656d77">
    <circle cx="12" cy="14" r="3"/>
    <circle cx="62" cy="24" r="2"/>
    <circle cx="102" cy="18" r="3"/>
    <circle cx="36" cy="56" r="2"/>
    <circle cx="76" cy="60" r="3"/>
    <circle cx="112" cy="68" r="2"/>
    <circle cx="18" cy="92" r="3"/>
    <circle cx="58" cy="100" r="2"/>
    <circle cx="100" cy="108" r="3"/>
  </g>
</svg>`.trim()
}

async function exportGltf(model, outputPath) {
  const exporter = new GLTFExporter()
  const gltf = await new Promise((resolve, reject) => {
    exporter.parse(model, resolve, reject, { binary: false })
  })

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(gltf, null, 2), 'utf-8')
}

async function main() {
  const root = process.cwd()
  const baseDir = path.join(root, 'public', 'assets', 'drift-game')
  const soundsDir = path.join(baseDir, 'sounds')
  const texturesDir = path.join(baseDir, 'textures')
  const modelsDir = path.join(baseDir, 'models')

  await fs.mkdir(soundsDir, { recursive: true })
  await fs.mkdir(texturesDir, { recursive: true })
  await fs.mkdir(modelsDir, { recursive: true })

  await fs.writeFile(path.join(texturesDir, 'asphalt.svg'), createAsphaltSvg(), 'utf-8')

  await fs.writeFile(
    path.join(soundsDir, 'engine-loop.wav'),
    writeWavBuffer({ frequency: 90, seconds: 1.4, volume: 0.42 }),
  )
  await fs.writeFile(
    path.join(soundsDir, 'drift-loop.wav'),
    writeWavBuffer({ frequency: 220, seconds: 0.9, volume: 0.33 }),
  )
  await fs.writeFile(
    path.join(soundsDir, 'collision.wav'),
    writeWavBuffer({ frequency: 54, seconds: 0.42, volume: 0.68 }),
  )

  await exportGltf(createCarModel(), path.join(modelsDir, 'sports-car.gltf'))

  const manifest = {
    generatedAt: new Date().toISOString(),
    assets: [
      '/assets/drift-game/textures/asphalt.svg',
      '/assets/drift-game/sounds/engine-loop.wav',
      '/assets/drift-game/sounds/drift-loop.wav',
      '/assets/drift-game/sounds/collision.wav',
      '/assets/drift-game/models/sports-car.gltf',
    ],
  }

  await fs.writeFile(path.join(baseDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')
  console.log('Assets do Drift Game gerados com sucesso.')
}

main().catch((error) => {
  console.error('Erro na geracao de assets do Drift Game:', error)
  process.exitCode = 1
})
