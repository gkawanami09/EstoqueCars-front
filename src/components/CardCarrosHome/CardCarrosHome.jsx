import ButtonLink from "../ButtonLink/ButtonLink"
import css from "./CardCarrosHome.module.css"

function CardCarrosHome() {
    return (
        <div className={css.card}>
            <div>
                <img src="/ImgTiggo/CarroTiggo.png" alt="Tiggo" />
            </div>
            <div className={css.carro}>
                <div className={css.marca}>
                    <img src="/ImgTiggo/MarcaTiggo.png" alt="" />
                </div>
                <div>
                    <h3>Tiggo 5x Sport</h3>
                    <p>Automatico SUV</p>
                </div>
            </div>
            <div className={css.preco}>
                <div className={css.valor}>
                    <p>A partir</p>
                    <h3>R$120.000</h3>
                </div>
                <div>
                    <ButtonLink buttonTo="/carros" buttonNome="ver mais"/>
                </div>
            </div>
        </div>
    )
}

export default CardCarrosHome