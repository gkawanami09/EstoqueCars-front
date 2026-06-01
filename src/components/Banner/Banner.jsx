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
    const [isGameLoaded, setIsGameLoaded] = useState(false)

    const safeSpan1 = useMemo(() => sanitizeText(span1, 'Maior Garagem'), [span1])
    const safeTitulo = useMemo(() => sanitizeText(titulo, 'de Carros Usados do'), [titulo])
    const safeSpan2 = useMemo(() => sanitizeText(span2, 'Senai'), [span2])
    const safeSubtitulo = useMemo(
        () => sanitizeText(subtitulo, 'Nossa equipe oferece uma ampla selecao de carros a pronta entrega.'),
        [subtitulo],
    )
    const safeButtonTo = useMemo(() => sanitizeText(buttonTo, '/CarrosSedan'), [buttonTo])
    const safeButtonNome = useMemo(() => sanitizeText(buttonNome, 'ver carros'), [buttonNome])

    function carregarJogo() {
        setIsGameLoaded(true)
    }

    return (
        <section className={css.section}>
            <div className={css.banner}>
                <div className={css.texto}>
                    <h1>A <span>{safeSpan1}</span> {safeTitulo} <span>{safeSpan2}</span></h1>
                    <h2>{safeSubtitulo}</h2>
                    <div>
                        <ButtonLink buttonTo={safeButtonTo} buttonNome={safeButtonNome} />
                    </div>
                </div>
                <div className={css.carroWrapper}>
                    <div className={css.cenaDrift}>
                        <div className={css.canvasGlow} aria-hidden="true" />
                        {!isGameLoaded ? (
                            <button
                                type="button"
                                className={css.previewButton}
                                onClick={carregarJogo}
                                aria-label="Ativar banner interativo"
                            >
                                <img
                                    className={css.previewImage}
                                    src="/carro-banner.png"
                                    alt="Banner"
                                />
                            </button>
                        ) : (
                            <DriftGameBanner
                                className={css.canvas}
                                onError={(error) => {
                                    console.error('[BannerGame] Erro ao iniciar jogo no banner:', error)
                                    setIsGameLoaded(false)
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
            <img className={css.marcas} src="/marcas.png" alt="marcas banner" />
        </section>
    )
}

export default Banner
