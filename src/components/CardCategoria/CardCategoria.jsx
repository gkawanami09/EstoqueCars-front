import css from './CardCategoria.module.css'
import { useNavigate } from 'react-router-dom'

function CardCategoria({ imgSrc, alt, categoria, quantidade, rota }) {
    const navigate = useNavigate()

    function abrirCategoria() {
        if (rota) {
            navigate(rota)
        }
    }

    function abrirCategoriaPeloTeclado(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            abrirCategoria()
        }
    }

    return (
        <div
            className={`${css.principal} ${css.container}`}
            role="button"
            tabIndex={0}
            onClick={abrirCategoria}
            onKeyDown={abrirCategoriaPeloTeclado}
        >
                    <div>
                        <img src={imgSrc} alt={alt} />
                        <div>
                            <h3>{categoria}</h3>
                            <p className={css.quantidade}>{quantidade}</p>
                        </div>
                    </div>
                </div>
    )
}

export default CardCategoria
