import css from "./CarrosCaminhonetes.module.css";
import { useNavigate } from "react-router-dom";

function CarrosCaminhonetes() {
    const navigate = useNavigate();

    function irParaContato() {
        window.location.href = "/#Contato";
    }


    return (
        <>
            <main className={css.container}>
                <section className={css.secao_destaque}>
                    <div className={css.cabecalho_destaque}>
                        <p className={css.subtitulo_destaque}>O mais vendido da categoria</p>
                        <h1 className={css.titulo_destaque}>FIAT TORO</h1>
                        <button
                            type="button"
                            className={css.botao_ver_mais_destaque}
                            onClick={irParaContato}
                        >
                            Ver Mais
                        </button>
                    </div>

                    <div className={css.area_imagem_destaque}>
                        <div className={css.circulo_preco}>
                            <span className={css.texto_a_partir}>A partir de</span>
                            <h2 className={css.valor_destaque}>R$ 150.000</h2>
                        </div>
                        <img
                            className={css.imagem_carro_destaque}
                            src="/CarFiatToro.png"
                            alt="Carro FIAT TORO"
                        />
                    </div>
                </section>

                <section className={css.secao_filtros}>
                    <h2 className={css.titulo_explore}>Explore todas as opções</h2>
                    <div className={css.grupo_botoes_filtro}>
                        <button type="button" className={css.botao_filtro} onClick={() => navigate("/CarrosSedan")}>Sedan</button>
                        <button type="button" className={css.botao_filtro} onClick={() => navigate("/CarrosEletricos")}>Elétrico</button>
                        <button type="button" className={css.botao_filtro} onClick={() => navigate("/CarrosEsportivos")}>Esportivo</button>
                        <button type="button" className={`${css.botao_filtro} ${css.filtro_ativo}`} onClick={() => navigate("/CarrosCaminhonetes")}>Caminhonete</button>
                        <button type="button" className={css.botao_filtro} onClick={() => navigate("/CarrosSUV")}>SUV</button>
                    </div>
                </section>



                <section className={css.lista_carros}>
                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarFiat.png" alt="Carro FIAT TORO" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>HONDA HR-V</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2022</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Cinza Granite Crystal</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 150.000</h2>
                            <button
                                type="button"
                                className={css.botao_ver_mais_card}
                                onClick={irParaContato}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>


                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarToyotaHilux.png" alt="Carro TOYOTA HILUX" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>VOLVO C40</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2026</p>
                                <p><strong>Motor:</strong> Flex</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Preto Atitude</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 340.000</h2>
                            <button
                                type="button"
                                className={css.botao_ver_mais_card}
                                onClick={irParaContato}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>



                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>
                            <img src="/CarChevroletSilverado.png" alt="Carro CHEVROLET SILVERADO" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>BYD DOLPHIN MINI</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2025 / 2026</p>
                                <p><strong>Motor:</strong> Gasolina</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Branco</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 469.000</h2>
                            <button
                                type="button"
                                className={css.botao_ver_mais_card}
                                onClick={irParaContato}

                            >
                                Ver Mais
                            </button>
                        </div>
                    </div>



                    <div className={css.card_carro}>
                        <div className={css.area_imagem_card}>

                            <img src="/CarNissan.png" alt="Carro NISSAN FRONTIER" className={css.imagem_card} />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>GWM HAVAL H6</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> 2026</p>
                                <p><strong>Motor:</strong> Diesel</p>
                                <p><strong>Câmbio:</strong> Automático</p>
                                <p><strong>Cor Disponível:</strong> Azul Cayman</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>R$ 277.000</h2>
                            <button
                                type="button"
                                className={css.botao_ver_mais_card}
                                onClick={irParaContato}

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

export default CarrosCaminhonetes;
