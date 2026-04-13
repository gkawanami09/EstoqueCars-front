import css from "./CarrosEletricos.module.css";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";

function CarrosEletricos() {


    return (
        <>
            <main className={css.container}>
                <section className={css.secao_destaque}>
                    <div className={css.cabecalho_destaque}>
                        <p className={css.subtitulo_destaque}>O mais vendido da categoria</p>
                        <h1 className={css.titulo_destaque}>HONDA HR-V</h1>
                        <button
                            className={css.botao_ver_mais_destaque}
                        >
                            Ver Mais
                        </button>
                    </div>

                    <div className={css.area_imagem_destaque}>
                        <div className={css.circulo_preco}>
                            <span className={css.texto_a_partir}>A partir de</span>
                            <h2 className={css.valor_destaque}>R$ 180.000</h2>
                        </div>
                        <img
                            className={css.imagem_carro_destaque}
                            src="/CarHonda.png"
                            alt="Carro HONDA HR-V"
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
                            <img src="/CarHondaHrv.png" alt="Carro HONDA HR-V" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>HONDA HR-V</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2025</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Preto</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 180.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>


                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarVolvo.png" alt="Carro VOLVO C40" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>VOLVO C40</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2022 / 2023</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Fjord Blue</p>
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
                            <img src="/CarBYDDolphin.png" alt="Carro BYD DOLPHIN MINI" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>BYD DOLPHIN MINI</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2024 / 2025</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Rosa</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 110.000</h2>
                            <button
                                className={css.botao_ver_mais_card}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>



                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>

                            <img src="/CarGWM.png" alt="Carro GWM HAVAL H6" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>GWM HAVAL H6</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2026</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Chumbo</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 210.000</h2>
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

export default CarrosEletricos;