import React, { useState } from 'react'
import css from "./CardFaq.module.css"

function CardFaq({conteudo, resposta}) {
    const [ver, setVer] = useState(false)
    return (
        <div className={css.resposta}>
            <div className={css.cards}>
                <div>
                    <p>{conteudo}</p>
                </div>
                <div>
                    {!ver && (<img onClick={() => setVer(true)} src="/ImgFaq/seta.png" alt="seta" />) }
                    {ver && (<img onClick={() => setVer(false)} src="/ImgFaq/setaF.png" alt="seta" />) }
                </div>
            </div>
            <div>
            {ver && (
                <p>{resposta}</p>
            )}
            </div>
        </div>
    )
}

export default CardFaq