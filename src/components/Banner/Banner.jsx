import { useEffect, useRef, useState } from 'react'
import css from './Banner.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'

function Banner({ span1, titulo, span2, subtitulo, buttonTo, buttonNome }) {
    const sectionRef = useRef(null)
    const [entrou, setEntrou] = useState(false)
    const [saindo, setSaindo] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setEntrou(true), 100)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setSaindo(!entry.isIntersecting),
            { threshold: 0.15 }
        )
        if (sectionRef.current) observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [])

    const carroClasses = [
        css.carroWrapper,
        entrou ? css.carroEntrou : '',
        saindo ? css.carroSaindo : '',
    ].filter(Boolean).join(' ')

    return (
        <section className={css.section} ref={sectionRef}>
            <div className={css.banner}>
                <div className={css.texto}>
                    <h1>A <span>{span1}</span> {titulo} <span>{span2}</span></h1>
                    <h2>{subtitulo}</h2>
                    <div>
                        <ButtonLink buttonTo={buttonTo} buttonNome={buttonNome} />
                    </div>
                </div>
                <div className={carroClasses}>
                    <img src="/carro-banner.png" alt="Banner" />
                </div>
            </div>
            <img src="/marcas.png" alt="marcas banner" />
        </section>
    )
}

export default Banner