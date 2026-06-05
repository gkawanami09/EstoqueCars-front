import { useMemo } from 'react'
import css from './Banner.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'

function sanitizeText(value, fallback) {
    const text = String(value ?? '').trim()
    return text || fallback
}

function Banner({
    span1,
    titulo,
    span2,
    subtitulo,
    buttonTo,
    buttonNome,
}) {
    const safeSpan1 = useMemo(() => sanitizeText(span1, 'Maior Garagem'), [span1])
    const safeTitulo = useMemo(() => sanitizeText(titulo, 'de Carros Usados do'), [titulo])
    const safeSpan2 = useMemo(() => sanitizeText(span2, 'Senai'), [span2])
    const safeSubtitulo = useMemo(
        () => sanitizeText(subtitulo, 'Nossa equipe oferece uma ampla selecao de carros a pronta entrega.'),
        [subtitulo],
    )
    const safeButtonTo = useMemo(() => sanitizeText(buttonTo, '/CarrosSedan'), [buttonTo])
    const safeButtonNome = useMemo(() => sanitizeText(buttonNome, 'Ver carros'), [buttonNome])

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
                        <img
                            className={css.previewImage}
                            src="/carro-banner.png"
                            alt="Banner"
                        />
                    </div>
                </div>
            </div>
            <img className={css.marcas} src="/marcas.png" alt="marcas banner" />
        </section>
    )
}

export default Banner
