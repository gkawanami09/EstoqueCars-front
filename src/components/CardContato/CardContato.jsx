import css from './CardContato.module.css'

function CardContato({grande=false, pequeno=false, titulo, rua, numero, bairro, cidade, mensagem, img, alt}) {
    return (
        <>
            {grande && (
                <div className={css.cardGrande}>
                    <div className={css.conteudo}>
                        <div>
                            <p className={css.titulo}>{titulo}</p>
                        </div>
                        <div>
                            <p>{rua}</p>
                            <p>{numero}</p>
                            <p>{bairro}</p>
                            <p>{cidade}</p>
                        </div>
                    </div>
                    <div>
                        <img src={`/ImgContato/${img}.png`} alt={alt} />
                    </div>
                </div>
            ) }
            {pequeno && (
                <div className={css.card}>
                    <div>
                        <p className={css.titulo}>{titulo}</p>
                        <p>{mensagem}</p>
                    </div>
                    <div>
                        <img src={`/ImgContato/${img}.png`} alt={alt} />
                    </div>
                </div>
            )}
        </>
    )
}

export default CardContato