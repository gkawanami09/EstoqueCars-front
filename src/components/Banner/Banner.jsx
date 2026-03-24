import css from './Banner.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'
function Banner({ span1, titulo, span2, subtitulo, buttonTo, buttonNome }) {
    return(
        <section className={css.section}>
            <div className={css.banner}>
                <div className={css.texto}>
                    <h1>A <span>{span1}</span> {titulo} <span>{span2}</span></h1>
                    <h2>{subtitulo}</h2>
                    <div>
                        <ButtonLink buttonTo={buttonTo} buttonNome={buttonNome} />
                    </div>
                </div>
                <div>
                    <img src="/carro-banner.png" alt="Banner" />
                </div>
            </div>
            <img src="/marcas.png" alt="marcas banner" />
        </section>
    )
}

export default Banner