import css from "./CarrosSedan.module.css";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";

function CarrosSedan() {
    const navigate = useNavigate();

    return (
        <>
            <main className={css.container}>
                <section className={css.secao_destaque}>
                    <div className={css.cabecalho_destaque}>
                        <p className={css.subtitulo_destaque}>O mais vendido da categoria</p>
                        <h1 className={css.titulo_destaque}>HYUNDAI HB20</h1>
                        <button
                            className={css.botao_ver_mais_destaque}
                        >
                            Ver Mais
                        </button>
                    </div>

                    <div className={css.area_imagem_destaque}>
                        <div className={css.circulo_preco}>
                            <span className={css.texto_a_partir}>A partir de</span>
                            <h2 className={css.valor_destaque}>R$ 113.000</h2>
                        </div>
                        <img
                            className={css.imagem_carro_destaque}
                            src="/CarHB20.png"
                            alt="Carro Hyundai HB20 Branco"
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
                            <img src="/CarHyundaiHb20.png" alt="Carro HYUNDAI HB20" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>HYUNDAI HB20</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2025</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Azul Sapphire</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 113.000</h2>
                            <button
                                className={css.botao_ver_mais_card}
                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>

                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarChevrolet.png" alt="Carro CHEVROLET ONIX" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>CHEVROLET ONIX</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2024 / 2025</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Preto</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 100.000</h2>
                            <button
                                className={css.botao_ver_mais_card}
                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>

                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarFiatCronos.png" alt="Carro FIAT CRONOS" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>FIAT CRONOS</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2023 / 2024</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Manual</p>
                                <p><strong>Cor Disponível:</strong> Prata</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 82.000</h2>
                            <button
                                className={css.botao_ver_mais_card}
                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>

                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>

                            <img src="/CarFiatSiena.png" alt="Carro FIAT SIENA" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>FIAT SIENA</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2016</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Manual</p>
                                <p><strong>Cor Disponível:</strong> Prata</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 48.000</h2>
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

export default CarrosSedan;