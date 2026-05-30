import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Dashboard.module.css";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";
import {
    alternarFavoritoLocal,
    aplicarFavoritosLocais,
    cabecalhoAutorizacao,
    carroEstaFavoritado,
    idUsuarioLogado,
    usuarioPodeFavoritar
} from "../utils/favoritos";

const categorias = ["Sedan", "Elétrico", "Esportivo", "Caminhonete", "SUV"];

function Dashboard({ API }) {
    const navigate = useNavigate();
    const [carros, setCarros] = useState([]);
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [favoritandoId, setFavoritandoId] = useState("");
    const mostrarFavorito = usuarioPodeFavoritar();

    let usuario = {};

    try {
        usuario = JSON.parse(localStorage.getItem("usuario_logado") || localStorage.getItem("usuario_logado")) || {};
    } catch {
        usuario = {};
    }

    const nomeUsuario = usuario.nome || "Usuario";

    function statusEstoqueCarro(carro) {
        return carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.statusEstoque ?? carro?.status ?? "";
    }

    function tipoStatusEstoque(carro) {
        const status = String(statusEstoqueCarro(carro) || "").trim().toLowerCase();

        if (status === "1" || status.includes("estoque") || (status.includes("dispon") && !status.includes("indispon"))) {
            return "estoque";
        }

        if (status === "2" || status.includes("vend")) {
            return "vendido";
        }

        if (status === "3" || status.includes("indispon")) {
            return "indisponivel";
        }

        return "indisponivel";
    }

    function textoStatusEstoque(carro) {
        const status = tipoStatusEstoque(carro);

        if (status === "vendido") {
            return "Vendido";
        }

        if (status === "indisponivel") {
            return "Indisponivel";
        }

        return "Em estoque";
    }

    function classeStatusEstoque(carro) {
        const status = tipoStatusEstoque(carro);
        return status === "estoque" ? css.status_estoque : status === "vendido" ? css.status_vendido : css.status_indisponivel;
    }

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

            setCarros(aplicarFavoritosLocais(dados.carros || [], idUsuarioLogado()));
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

    const carrosDisponiveis = carros.filter((carro) => tipoStatusEstoque(carro) === "estoque");
    const termoBusca = busca.trim().toLowerCase();

    const carrosFiltrados = termoBusca
        ? carrosDisponiveis.filter((carro) => {
            const campos = [
                carro.nome,
                carro.modelo,
                carro.marca,
                carro.placa,
                carro.cor,
                carro.ano_fabricacao,
                carro.ano_modelo,
                `${carro.ano_fabricacao || ""}/${carro.ano_modelo || ""}`,
                carro.categoria,
                carro.nome_categoria,
                carro.quilometragem
            ];

            return campos.some((campo) => String(campo || "").toLowerCase().includes(termoBusca));
        })
        : carrosDisponiveis;

    const totalPaginas = Math.max(1, Math.ceil(carrosFiltrados.length / ITENS_POR_PAGINA));

    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, categoria]);

    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    const carrosPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return carrosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [carrosFiltrados, paginaAtual]);

    const mensagemListaVazia = carros.length === 0
        ? {
            titulo: "Nenhum veiculo cadastrado no momento.",
            texto: "Assim que novos veiculos forem adicionados, eles aparecerao aqui."
        }
        : carrosDisponiveis.length === 0
            ? {
                titulo: "Nenhum veiculo disponivel em estoque.",
                texto: "Os veiculos vendidos ou indisponiveis ficam escondidos da vitrine do cliente."
            }
            : {
                titulo: "Nenhum veiculo disponivel encontrado.",
                texto: "Tente buscar por outra marca, modelo, cor, categoria ou ano."
            };

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
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
    }

    async function favoritarCarro(carro) {
        const id = idCarro(carro);

        if (!id || favoritandoId) {
            return;
        }

        setFavoritandoId(String(id));
        setErro("");

        const favoritoAtual = carroEstaFavoritado(carro);
        alternarFavoritoLocal({ ...carro, favorito: favoritoAtual }, idUsuarioLogado());
        setCarros((listaAtual) => listaAtual.map((item) => (
            String(idCarro(item)) === String(id) ? { ...item, favorito: !favoritoAtual } : item
        )));

        try {
            const resposta = await fetch(`${API}/favoritar_carro/${id}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });

            if (!resposta.ok) {
                const dados = await resposta.json().catch(() => ({}));
                throw new Error(dados.erro || dados.mensagem || "Nao foi possivel atualizar este favorito.");
            }
        } catch {
            // O favorito fica salvo localmente caso a API de favoritos ainda nao esteja disponivel.
        } finally {
            setFavoritandoId("");
        }
    }

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
                        <div className={css.perfil_usuario} />
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
                        placeholder="Buscar por marca, modelo, cor, categoria ou ano"
                        className={css.input_busca}
                        value={busca}
                        onChange={(evento) => setBusca(evento.target.value)}
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
                        <div className={css.estado_lista}>
                            <strong>{mensagemListaVazia.titulo}</strong>
                            <span>{mensagemListaVazia.texto}</span>
                        </div>
                    )}

                    {!carregando && carrosPaginados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            <div className={css.area_imagem_card}>
                                {mostrarFavorito && (
                                    <button
                                        type="button"
                                        className={`${css.botao_favorito} ${carroEstaFavoritado(carro) ? css.favorito_ativo : ""}`}
                                        onClick={(evento) => {
                                            evento.stopPropagation();
                                            favoritarCarro(carro);
                                        }}
                                        disabled={favoritandoId === String(idCarro(carro))}
                                        aria-pressed={carroEstaFavoritado(carro)}
                                        aria-label={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        title={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                        <span aria-hidden="true">{carroEstaFavoritado(carro) ? "♥" : "♡"}</span>
                                    </button>
                                )}
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veiculo"}
                                    onError={(evento) => {
                                        evento.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                            </div>

                            <div className={css.info_carro}>
                                <div className={css.titulo_status}>
                                    <h2>{carro.modelo || carro.nome || "Veiculo"}</h2>
                                    <span className={`${css.status_veiculo} ${classeStatusEstoque(carro)}`}>
                                        {textoStatusEstoque(carro)}
                                    </span>
                                </div>
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

                {!carregando && !erro && carrosFiltrados.length > 0 && (
                    <div className={css.paginacao_area}>
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={carrosFiltrados.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
