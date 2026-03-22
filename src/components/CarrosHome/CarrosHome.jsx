import css from "./CarrosHome.module.css"
import CardCarrosHome from "../CardCarrosHome/CardCarrosHome"

function CarrosHome({subtitulo, titulo, span}) {
    return (
        <section className={css.section}>
            <div className={css.titulo}>
                <h3>{subtitulo}</h3>
                <h2>{titulo}<span>{span}</span></h2>
            </div>
            <div>
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
                <CardCarrosHome />
            </div>
        </section>
    )
}

export default CarrosHome