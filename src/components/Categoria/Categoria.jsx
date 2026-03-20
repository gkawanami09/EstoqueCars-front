import css from './Categoria.module.css'
import CardCategoria from '../CardCategoria/CardCategoria'

function Categoria() {
    return(
        <section className={css.section}>
            <div className={css.titulo}>
                <h3>Escolha o seu estilo de carro</h3>
                <h2><span>Categorias</span> em Alta</h2>
            </div>
            <div className={css.carros}>
                <CardCategoria imgSrc="/sedan.png" alt="sedan" categoria="Sedan" quantidade="10" />
                <CardCategoria imgSrc="/eletrico.png" alt="elétrico" categoria="Elétrico" quantidade="10" />
                <CardCategoria imgSrc="/esportivo.png" alt="esportivo" categoria="Esportivo" quantidade="10" />
                <CardCategoria imgSrc="/caminhonete.png" alt="caminhonete" categoria="Caminhonete" quantidade="10" />
                <CardCategoria imgSrc="/suv.png" alt="suv" categoria="SUV" quantidade="10" />
            </div>
        </section>
    )
}   

export default Categoria
