import CardFaq from "../CardFaq/CardFaq"
import css from "./Faq.module.css"

function Faq({ span, titulo, subtitulo }) {
    return (
        <section className={css.section}>
            <div className={css.texto}>
                <h3>{subtitulo}</h3>
                <h2><span>{span}</span> {titulo}</h2>
            </div>
            <div className={css.cards}>
                <CardFaq conteudo="Os veículos são revisados antes da venda?" resposta="Sim. Todos os veículos passam por revisão e verificação antes da venda, garantindo mais segurança, qualidade e confiabilidade para o cliente." />
                <CardFaq conteudo="A documentação do carro está em dia?" resposta="Sim. A documentação do veículo é verificada e mantida em dia antes da venda, garantindo mais segurança e tranquilidade para o cliente."/>
                <CardFaq conteudo="Vocês aceitam financiamento?" resposta="Sim. Trabalhamos com financiamento e oferecemos suporte durante todo o processo para facilitar a compra do seu veículo." />
                <CardFaq conteudo="Como posso agendar uma visita?" resposta="Você pode agendar uma visita entrando em contato conosco pelo nosso canal de atendimento. Assim, combinamos o melhor dia e horário para receber você." />
                <CardFaq conteudo="É possível dar meu carro na troca?" resposta="No momento, não trabalhamos com troca de veículos. Atendemos apenas com a venda direta." />
            </div>
        </section>
    )
}

export default Faq