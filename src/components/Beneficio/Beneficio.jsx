import CardBeneficio from '../CardBeneficio/CardBeneficio'
import css from './Beneficio.module.css'

function Beneficio({titulo1, span1, titulo2, span2, subtitulo}){
    return(
        <section className={css.fundo}>
            <div>
                <img src="/ImgBeneficio/carro-beneficio.png" alt="carro beneficio" />
            </div>
            <div className={css.conteudo}>
                <div className={css.texto}>
                    <h3>{titulo1} <span>{span1}</span> {titulo2} <span>{span2}</span></h3>
                    <p>{subtitulo}</p>
                </div>
                <div className={css.cards}>
                    <CardBeneficio img="dinheiro-beneficio" alt="dinheiro beneficio" contexto="Financiamento facilitado"/>
                    <CardBeneficio img="engrenagem-beneficio" alt="engrenagem beneficio" contexto="Baixo custo de manutenção"/>
                    <CardBeneficio img="gas-beneficio" alt="gas beneficio" contexto="Econômico no dia a dia"/>
                </div>
            </div>
        </section>
    )
}

export default Beneficio