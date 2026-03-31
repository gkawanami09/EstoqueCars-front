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
                <CardEtapas titulo="Escolha o modelo ideal" conteudo="Modelos acessíveis, econômicos e prontos para o dia a dia." imagem="lupa" alt="lupa" direcao='direita'/>
                <CardEtapas titulo="Veja todas as informações" conteudo="Detalhes completos para você comparar com confiança." imagem="pasta" alt="pasta" />
                <CardEtapas titulo="Fale com nossa equipe" conteudo="Atendimento rápido para agendar, negociar e fechar negócio." imagem="calendario" alt="calendario" direcao='direita'/>
                <CardEtapas titulo="Escolha a melhor condição" conteudo="Pagamento facilitado e opções que fazem sentido para você." imagem="carteira" alt="carteira"/>
            </div>
        </section>
    )
}

export default Etapas