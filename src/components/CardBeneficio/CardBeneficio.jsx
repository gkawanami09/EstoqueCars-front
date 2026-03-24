import css from './CardBeneficio.module.css'

function CardBeneficio({img, alt, contexto}) {
    return (
        <div className={css.fundo}>
            <div>
                <img src={"/ImgBeneficio/" + img + ".png"} alt={alt} />
            </div>
            <div>
                <p className={css.contexto}>
                    {contexto}
                </p>
            </div>
        </div>
    )
}

export default CardBeneficio