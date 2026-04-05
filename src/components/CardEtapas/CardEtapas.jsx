import css from './CardEtapas.module.css'

function CardEtapas({titulo, conteudo, imagem, alt, direcao="esquerda"}) {
    const isDireita = direcao === "direita"

    return (
        <div className={`${css.fundo} ${isDireita ? css.fundoDireita : css.fundoEsquerda}`}>
            {isDireita ? (
                <>
                    <div className={css.icone}>
                        <img src={"/ImgEtapas/" + imagem + ".png"} alt={alt} />
                    </div>
                    <div className={css.conteudoDireita}>
                        <h4>{titulo}</h4>
                        <p>{conteudo}</p>
                    </div>
                </>
            ) : (
                <>
                    <div className={css.conteudoEsquerda}>
                        <h4>{titulo}</h4>
                        <p>{conteudo}</p>
                    </div>
                    <div className={css.icone}>
                        <img src={"/ImgEtapas/" + imagem + ".png"} alt={alt} />
                    </div>
                </>
            )}
        </div>
    )
}

export default CardEtapas
