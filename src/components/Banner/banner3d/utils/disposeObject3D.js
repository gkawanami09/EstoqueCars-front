import * as THREE from 'three'

function disposeMaterial(material) {
  if (!material) {
    return
  }

  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose()
    }
  })

  material.dispose?.()
}

export function disposeObject3D(object) {
  if (!object) {
    return
  }

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose()
    }

    if (Array.isArray(child.material)) {
      child.material.forEach(disposeMaterial)
      return
    }

    disposeMaterial(child.material)
  })
}
