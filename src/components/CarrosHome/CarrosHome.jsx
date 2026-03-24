import css from "./CarrosHome.module.css"
import CardCarrosHome from "../CardCarrosHome/CardCarrosHome"
import ButtonLink from "../ButtonLink/ButtonLink"

function CarrosHome({subtitulo, titulo, span}) {
    return (
        <section className={css.section}>
            <div className={css.titulo}>
                <h3>{subtitulo}</h3>
                <h2>{titulo}<span>{span}</span></h2>
            </div>
            <div className={css.cards}>
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
            </div>
            <ButtonLink buttonTo="/carros" buttonNome="Explorar Carros"/>
        </section>
    )
}

export default CarrosHome