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

function createWheel(material) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.29, 24), material)
  wheel.rotation.z = Math.PI / 2
  return wheel
}

function createDriftCar() {
  const car = new THREE.Group()
  car.name = 'DriftCar'

  const paint = new THREE.MeshStandardMaterial({
    color: '#c1181c',
    metalness: 0.58,
    roughness: 0.25,
  })

  const dark = new THREE.MeshStandardMaterial({
    color: '#17191f',
    metalness: 0.18,
    roughness: 0.7,
  })

  const glass = new THREE.MeshPhysicalMaterial({
    color: '#5d7a92',
    roughness: 0.12,
    transmission: 0.55,
    transparent: true,
    opacity: 0.72,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 2.2), paint)
  body.position.set(0, 1.04, 0)
  body.name = 'Body'
  car.add(body)

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 1.76), glass)
  roof.position.set(0.22, 1.78, 0)
  roof.name = 'Cabin'
  car.add(roof)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.39, 2.08), paint)
  hood.position.set(1.45, 1.44, 0)
  hood.name = 'Hood'
  car.add(hood)

  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 2.08), dark)
  splitter.position.set(2.37, 0.79, 0)
  splitter.name = 'Splitter'
  car.add(splitter)

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 1.86), dark)
  diffuser.position.set(-2.36, 0.79, 0)
  diffuser.name = 'Diffuser'
  car.add(diffuser)

  const wheels = [
    { name: 'WheelFL', position: [1.57, 0.55, 1.08] },
    { name: 'WheelFR', position: [1.57, 0.55, -1.08] },
    { name: 'WheelRL', position: [-1.57, 0.55, 1.08] },
    { name: 'WheelRR', position: [-1.57, 0.55, -1.08] },
  ]

  wheels.forEach(({ name, position }) => {
    const wheel = createWheel(dark)
    wheel.name = name
    wheel.position.set(position[0], position[1], position[2])
    car.add(wheel)
  })

  return car
}

async function exportModelToGltf(model, outputPath) {
  const exporter = new GLTFExporter()

  const gltf = await new Promise((resolve, reject) => {
    exporter.parse(
      model,
      (result) => resolve(result),
      (error) => reject(error),
      { binary: false },
    )
  })

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(gltf, null, 2), 'utf-8')
}

async function writeAssetManifest(manifestPath) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/generate-banner-assets.mjs',
    assets: [
      {
        type: 'model/gltf+json',
        name: 'drift-car.gltf',
        path: '/assets/banner3d/models/drift-car.gltf',
      },
    ],
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
}

async function run() {
  try {
    const root = process.cwd()
    const model = createDriftCar()
    const modelOutput = path.join(root, 'public', 'assets', 'banner3d', 'models', 'drift-car.gltf')
    const manifestOutput = path.join(root, 'public', 'assets', 'banner3d', 'manifest.json')

    await exportModelToGltf(model, modelOutput)
    await writeAssetManifest(manifestOutput)

    console.log(`Modelo gerado com sucesso em: ${modelOutput}`)
  } catch (error) {
    console.error('Falha ao gerar assets do banner 3D:', error)
    process.exitCode = 1
  }
}

run()
