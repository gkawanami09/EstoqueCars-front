import css from './Categoria.module.css'

function Categoria() {
    return(
        <section className={css.section}>
            <div>
                <h3>Escolha o seu estilo de carro</h3>
                <h2><span>Categorias</span> em Alta</h2>
            </div>
            <div>
                <div className={css.principal}>
                    <div>

                    </div>
                </div>
            </div>
        </section>
    )
}   

export default Categoria