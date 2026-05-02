import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Dashboard.module.css";

const categorias = ["Sedan", "Eletrico", "Esportivo", "Caminhonete", "SUV"];

function Dashboard({ API }) {
    const [carros, setCarros] = useState([]);
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();
    let usuario = {};

    try {
        usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch {
        usuario = {};
    }

    const nomeUsuario = usuario.nome || "Usuario";

    // Busca os carros da API para montar a vitrine do usuario.
    const carregarCarros = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const params = new URLSearchParams();
            if (categoria) {
                params.append("categoria", categoria);
            }

            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao carregar veiculos.");
                setCarros([]);
                return;
            }

            setCarros(dados.carros || []);
        } catch {
            setErro("Erro de conexao com o servidor.");
            setCarros([]);
        } finally {
            setCarregando(false);
        }
    }, [API, categoria]);

    useEffect(() => {
        carregarCarros();
    }, [carregarCarros]);

    // Aplica a busca digitada sem fazer nova chamada para a API.
    const carrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return carros;
        }

        return carros.filter((carro) => {
            const campos = [
                carro.nome,
                carro.modelo,
                carro.marca,
                carro.placa,
                carro.cor,
                carro.ano_fabricacao,
                carro.ano_modelo,
                carro.categoria,
                carro.nome_categoria
            ];

            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, carros]);

    function formatarPreco(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarCambio(valor) {
        const cambio = String(valor || "").toLowerCase();

        if (cambio === "1" || cambio.includes("auto")) {
            return "Automatico";
        }

        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        return valor || "-";
    }

    function idCarro(carro) {
        return carro?.id || carro?.id_carro || carro?.id_veiculo;
    }

    // Monta a URL da imagem salva no backend ou usa um icone padrao.
    function imagemCarro(carro) {
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        if (!imagem) {
            return "/IconCar.png";
        }

        if (String(imagem).startsWith("http")) {
            return imagem;
        }

        if (String(imagem).startsWith("/")) {
            return `${API}${imagem}`;
        }

        return `${API}/${imagem}`;
    }

    return (
        <div className={css.layout_dashboard}>

            <main className={css.conteudo_principal}>

                <header className={css.cabecalho}>
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>{nomeUsuario}</span>
                    </h1>
                    <div className={css.area_usuario}>
                        <div className={css.perfil_usuario}>

                        </div>
                    </div>
                </header>

                <div className={css.area_busca}>
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    <input
                        type="text"
                        placeholder="Buscar veiculos"
                        className={css.input_busca}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                <section className={css.secao_filtros}>
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>
                    {categorias.map((nomeCategoria) => (
                        <button
                            key={nomeCategoria}
                            type="button"
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            onClick={() => setCategoria(nomeCategoria)}
                        >
                            {nomeCategoria}
                        </button>
                    ))}
                </section>

                {erro && <p className={css.mensagem_erro}>{erro}</p>}

                <section className={css.lista_carros}>
                    {carregando && <div className={css.estado_lista}>Carregando veiculos...</div>}

                    {!carregando && !erro && carrosFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum veiculo encontrado.</div>
                    )}

                    {!carregando && carrosFiltrados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            <div className={css.area_imagem_card}>
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veiculo"}
                                    onError={(e) => {
                                        e.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                            </div>

                            <div className={css.info_carro}>
                                <h2>{carro.modelo || carro.nome || "Veiculo"}</h2>
                                <div className={css.grade_info}>
                                    <p><strong>Marca:</strong> {carro.marca || "-"}</p>
                                    <p><strong>Ano:</strong> {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                                    <p><strong>Cambio:</strong> {formatarCambio(carro.cambio)}</p>
                                    <p><strong>Cor:</strong> {carro.cor || "-"}</p>
                                </div>
                            </div>

                            <div className={css.area_preco}>
                                <strong>{formatarPreco(carro.preco)}</strong>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/detalhesVeiculos/${idCarro(carro)}`)}
                                >
                                    Ver detalhes
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Dashboard;
