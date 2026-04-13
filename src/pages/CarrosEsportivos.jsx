import css from "./CarrosEsportivos.module.css";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";

function CarrosEsportivos() {

    return (
        <>
            <main className={css.container}>
                <section className={css.secao_destaque}>
                    <div className={css.cabecalho_destaque}>
                        <p className={css.subtitulo_destaque}>O mais vendido da categoria</p>
                        <h1 className={css.titulo_destaque}>PORSHE 911</h1>
                        <button
                            className={css.botao_ver_mais_destaque}
                        >
                            Ver Mais
                        </button>
                    </div>

                    <div className={css.area_imagem_destaque}>
                        <div className={css.circulo_preco}>
                            <span className={css.texto_a_partir}>A partir de</span>
                            <h2 className={css.valor_destaque}>R$ 860.000</h2>
                        </div>
                        <img
                            className={css.imagem_carro_destaque}
                            src="/CarPorshe911.png"
                            alt="Carro PORSHE 911"
                        />
                    </div>
                </section>

                <section className={css.secao_filtros}>
                    <h2 className={css.titulo_explore}>Explore todas as opções</h2>
                    <div className={css.grupo_botoes_filtro}>
                        <button className={`${css.botao_filtro} ${css.filtro_ativo}`}>Sedan</button>
                        <button className={css.botao_filtro}>Elétrico</button>
                        <button className={css.botao_filtro}>Esportivo</button>
                        <button className={css.botao_filtro}>Caminhonete</button>
                        <button className={css.botao_filtro}>SUV</button>
                    </div>
                </section>



                <section className={css.lista_carros}>
                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarPorsheCarrera.png" alt="Carro PORSHE 911 CARRERA" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>PORSHE 911 CARRERA</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2021</p>
                                <p><strong>Motor:</strong> Gasolina</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Jet Black</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 860.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>


                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarMustang.png" alt="Carro MUSTANG GT" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>MUSTANG GT</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2021</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Prata Iconic</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 320.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>



                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarBMW.png" alt="BMW M2" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>BYD DOLPHIN MINI</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2018 / 2019</p>
                                <p><strong>Motor:</strong> Gasolina</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Prata Hockenheim</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 410.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>



                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>

                            <img src="/CarHondaCivic.png" alt="Carro HONDA CIVIC TYPE R" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>HONDA CIVIC TYPE R</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2023</p>
                                <p><strong>Motor:</strong> Gasolina</p>
                                <p><strong>Câmbio:</strong> Manual</p>
                                <p><strong>Cor Disponível:</strong>Vermelho</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 429.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

export default CarrosEsportivos;