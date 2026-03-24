function CardEtapas({titulo, conteudo, imagem, alt}) {
    return (
        <div>
            <div>
                <h4>{titulo}</h4>
                <p>{conteudo}</p>
            </div>
            <div>
                <img src={"/ImgEtapas/" + imagem + ".png"} alt={alt} />
            </div>
        </div>
    )
}

export default CardEtapas