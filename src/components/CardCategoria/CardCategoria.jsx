import css from './CardCategoria.module.css'

function CardCategoria({ imgSrc, alt, categoria, quantidade }) {
    return (
        <div className={`${css.principal} ${css.container}`}>
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
