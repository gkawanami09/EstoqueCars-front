import { useMemo, useState } from 'react'
import css from './Banner.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'
import DriftGameBanner from './DriftGameBanner'
import { sanitizeText } from './banner3d/config'

function Banner({
    span1,
    titulo,
    span2,
    subtitulo,
    buttonTo,
    buttonNome,
}) {
    const [replayToken, setReplayToken] = useState(0)
    const [gameError, setGameError] = useState('')

    const safeSpan1 = useMemo(() => sanitizeText(span1, 'Maior Garagem'), [span1])
    const safeTitulo = useMemo(() => sanitizeText(titulo, 'de Carros Usados do'), [titulo])
    const safeSpan2 = useMemo(() => sanitizeText(span2, 'Senai'), [span2])
    const safeSubtitulo = useMemo(
        () => sanitizeText(subtitulo, 'Nossa equipe oferece uma ampla selecao de carros a pronta entrega.'),
        [subtitulo],
    )
    const safeButtonTo = useMemo(() => sanitizeText(buttonTo, '/CarrosSedan'), [buttonTo])
    const safeButtonNome = useMemo(() => sanitizeText(buttonNome, 'ver carros'), [buttonNome])

    return (
        <section className={css.section}>
            <div className={css.banner}>
                <div className={css.texto}>
                    <h1>A <span>{safeSpan1}</span> {safeTitulo} <span>{safeSpan2}</span></h1>
                    <h2>{safeSubtitulo}</h2>
                    <div className={css.actions}>
                        <ButtonLink buttonTo={safeButtonTo} buttonNome={safeButtonNome} />
                        <button
                            type="button"
                            className={css.restartButton}
                            onClick={() => {
                                setGameError('')
                                setReplayToken((previousToken) => previousToken + 1)
                            }}
                            aria-label="Reiniciar jogo de drift"
                        >
                            reiniciar jogo
                        </button>
                    </div>
                </div>
                <div className={css.carroWrapper}>
                    <div className={css.cenaDrift}>
                        <div className={css.canvasGlow} aria-hidden="true" />
                        {gameError ? (
                            <div className={css.fallback} role="status" aria-live="polite">
                                <strong>Drift Game indisponivel</strong>
                                <p>
                                    Falha ao iniciar o jogo 3D no banner. Tente reiniciar ou atualizar a pagina.
                                </p>
                            </div>
                        ) : (
                            <DriftGameBanner
                                key={replayToken}
                                className={css.canvas}
                                onError={(error) => {
                                    console.error('[BannerGame] Erro ao iniciar jogo no banner:', error)
                                    setGameError(error?.message || 'Erro no jogo')
                                }}
                            />
                        )}
                        <div className={css.performanceTag}>Drift Game 3D</div>
                    </div>
                </div>
            </div>
            <img className={css.marcas} src="/marcas.png" alt="marcas banner" />
        </section>
    )
}

export default Banner
