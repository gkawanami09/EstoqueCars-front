import css from './CardEtapas.module.css'

function CardEtapas({titulo, conteudo, imagem, alt, direcao="esquerda"}) {

    if (direcao == "direita") {
        return (
            <div className={css.fundo}>
                <div>
                    <img src={"/ImgEtapas/" + imagem + ".png"} alt={alt} />
                </div>
                <div className={css.conteudoDireita
                }>
                    <h4>{titulo}</h4>
                    <p>{conteudo}</p>
                </div>
            </div>
        )
    } else if (direcao == "esquerda") {
        return (
            <div className={css.fundo}>
                <div className={css.conteudoEsquerda}>
                    <h4>{titulo}</h4>
                    <p>{conteudo}</p>
                </div>
                <div>
                    <img src={"/ImgEtapas/" + imagem + ".png"} alt={alt} />
                </div>
            </div>
        )
    }

}

export default CardEtapas