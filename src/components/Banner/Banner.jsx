import { Link } from "react-router-dom"
import css from './Banner.module.css'
function Banner() {
    return(
        <section>
            <div className={css.banner}>
                <div className={css.texto}>
                    <h1>A <span>Maior Garagem</span> de Carros Usados do <span>Senai</span></h1>
                    <h2>Nossa equipe oferece uma ampla seleção de carros a pronta entrega.</h2>
                    <Link className={css.button} to="/carros">Ver Carros</Link>
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