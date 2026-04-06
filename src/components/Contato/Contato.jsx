import CardContato from "../CardContato/CardContato"
import css from './Contato.module.css'

function Contato() {
    return(
        <section id="Contato" className={css.secao}>
            <div className={css.texto}>
                <h3>Fale com a gente</h3>
                <h2>Entre em <span>contato</span></h2>
            </div>

            <div className={css.cards}>
                <div>
                    <CardContato grande={true} titulo='Estoque Cars' rua='Rua Diamante Negro,' numero='1903,' bairro='Vila Lobos' cidade='São Mauro' img='endereco'/>
                </div>
                <div className={css.pequeno}>
                    <div>
                        <CardContato pequeno={true} titulo='estoquecars@gmail.com' mensagem='Envie seu email' img='email'/>
                    </div>
                    <div>
                        <CardContato pequeno={true} titulo='(11)97427-5656' mensagem='Ligue para nós' img='celular'/>
                    </div>
                </div>

                <div className={css.mapa}>
                    <iframe
                        className={css.iframe}
                        src="https://www.google.com/maps?q=Vila+Lobos,+S%C3%A3o+Paulo&output=embed"
                    ></iframe>
                </div>
            </div>
        </section>
    )
}
export default Contato
