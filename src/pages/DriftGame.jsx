import { useEffect, useRef, useState } from 'react'
import createDriftGame from '../game/main'

function DriftGame() {
  const mountRef = useRef(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const mountElement = mountRef.current
    if (!mountElement) {
      return undefined
    }

    let gameHandle = null

    try {
      gameHandle = createDriftGame(mountElement, { env: import.meta.env })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Falha ao iniciar o jogo.')
    }

    return () => {
      gameHandle?.destroy?.()
    }
  }, [])

  if (errorMessage) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Erro ao carregar Drift Game</h1>
        <p>{errorMessage}</p>
      </main>
    )
  }

  return <main ref={mountRef} />
}

export default DriftGame
