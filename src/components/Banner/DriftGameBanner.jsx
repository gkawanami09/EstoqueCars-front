import { useEffect, useRef } from 'react'
import createDriftGame from '../../game/main'

function DriftGameBanner({ className, onError }) {
    const mountRef = useRef(null)

    useEffect(() => {
        const mountElement = mountRef.current
        if (!mountElement) {
            return undefined
        }

        let gameHandle = null

        try {
            gameHandle = createDriftGame(mountElement, {
                env: import.meta.env,
                embedded: true,
                autoStart: true,
                showGameOver: false,
            })
        } catch (error) {
            const normalizedError = error instanceof Error ? error : new Error(String(error))
            onError?.(normalizedError)
        }

        return () => {
            gameHandle?.destroy?.()
        }
    }, [onError])

    return (
        <div
            ref={mountRef}
            className={className}
            role="img"
            aria-label="Jogo de drift 3D no banner"
        />
    )
}

export default DriftGameBanner
