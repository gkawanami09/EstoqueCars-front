import CardEtapas from '../CardEtapas/CardEtapas'
import css from './Etapas.module.css'

function Etapas({subtitulo, titulo1, span, titulo2}) {
    return (
        <section className={css.section}>
            <div className={css.texto}>
                <h3>{subtitulo}</h3>
                <h2>{titulo1} <span>{span}</span> {titulo2} </h2>
            </div>
            <div className={css.cards}>
                <div className={css.timeline}>
                    <div className={css.itemLeft}>
                        <CardEtapas
                            titulo="Escolha o modelo ideal"
                            conteudo="Modelos acessíveis, econômicos e prontos para o dia a dia."
                            imagem="lupa"
                            alt="lupa"
                            direcao="esquerda"
                        />
                    </div>
                    <span className={css.dot} aria-hidden="true"></span>
                    <div className={css.spacer}></div>

                    <div className={css.spacer}></div>
                    <span className={css.dot} aria-hidden="true"></span>
                    <div className={css.itemRight}>
                        <CardEtapas
                            titulo="Veja todas as informações"
                            conteudo="Detalhes completos para você comparar com confiança."
                            imagem="pasta"
                            alt="pasta"
                            direcao="direita"
                        />
                    </div>

                    <div className={css.itemLeft}>
                        <CardEtapas
                            titulo="Fale com nossa equipe"
                            conteudo="Atendimento rápido para agendar, negociar e fechar negócio."
                            imagem="calendario"
                            alt="calendario"
                            direcao="esquerda"
                        />
                    </div>
                    <span className={css.dot} aria-hidden="true"></span>
                    <div className={css.spacer}></div>

                    <div className={css.spacer}></div>
                    <span className={css.dot} aria-hidden="true"></span>
                    <div className={css.itemRight}>
                        <CardEtapas
                            titulo="Escolha a melhor condição"
                            conteudo="Pagamento facilitado e opções que fazem sentido para você."
                            imagem="carteira"
                            alt="carteira"
                            direcao="direita"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Etapas
