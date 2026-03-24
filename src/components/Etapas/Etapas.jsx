import CardEtapas from '../CardEtapas/CardEtapas'
import css from './Etapas.module.css'

function Etapas({subtitulo, titulo1, span, titulo2}) {
    return (
        <section className={css.section}>
            <div className={css.texto}>
                <h3>{subtitulo}</h3>
                <h2>{titulo1} <span>{span}</span> {titulo2} </h2>
            </div>
            <div>
                <CardEtapas titulo="Escolha o modelo ideal" conteudo="Modelos acessíveis, econômicos e prontos para o dia a dia." imagem="lupa" alt="lupa"/>
            </div>
        </section>
    )
}

export default Etapas