import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";
import css from "./Favoritos.module.css";

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function idCarro(carro) {
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO;
}

function nomeCarro(carro) {
    return carro?.nome || [carro?.marca, carro?.modelo].filter(Boolean).join(" ") || "Veículo";
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function listarFavoritos(API) {
    const resposta = await fetch(`${API}/listar_favoritos`, {
        method: "GET",
        headers: cabecalhoAutorizacao(),
        credentials: "include"
    });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "Não foi possível carregar seus favoritos.");
    }

    return Array.isArray(dados) ? dados : dados.favoritos || [];
}

async function alternarFavorito(API, idVeiculo) {
    const resposta = await fetch(`${API}/favoritar_carro/${idVeiculo}`, {
        method: "POST",
        headers: cabecalhoAutorizacao(),
        credentials: "include"
    });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "Não foi possível atualizar este favorito.");
    }
}

async function limparFavoritosApi(API) {
    const resposta = await fetch(`${API}/limpar_favoritos`, {
        method: "DELETE",
        headers: cabecalhoAutorizacao(),
        credentials: "include"
    });
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "Não foi possível limpar seus favoritos.");
    }
}

function Favoritos({ API }) {
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [removendoId, setRemovendoId] = useState("");
    const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
    const [limpandoFavoritos, setLimpandoFavoritos] = useState(false);

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

    const carregarFavoritos = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const lista = await listarFavoritos(API);
            setFavoritos(lista.map((carro) => ({ ...carro, favorito: true })));
        } catch (erroAtual) {
            setFavoritos([]);
            setErro(erroAtual.message || "Não foi possível carregar seus favoritos.");
        } finally {
            setCarregando(false);
        }
    }, [API]);

    useEffect(() => {
        carregarFavoritos();
    }, [carregarFavoritos]);

    const favoritosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return favoritos;
        }

        return favoritos.filter((carro) => {
            const marca = String(carro?.marca || carro?.MARCA || "").toLowerCase();
            const modelo = String(carro?.modelo || carro?.MODELO || "").toLowerCase();
            return marca.includes(termo) || modelo.includes(termo);
        });
    }, [busca, favoritos]);

    async function removerFavorito(carro) {
        const id = idCarro(carro);

        if (!id || removendoId) {
            return;
        }

        setRemovendoId(String(id));
        setErro("");

        try {
            await alternarFavorito(API, id);
            setFavoritos((listaAtual) => listaAtual.filter((item) => String(idCarro(item)) !== String(id)));
        } catch (erroAtual) {
            setErro(erroAtual.message || "Não foi possível remover este favorito.");
        } finally {
            setRemovendoId("");
        }
    }

    async function limparFavoritos() {
        if (limpandoFavoritos || favoritos.length === 0) {
            return;
        }

        setLimpandoFavoritos(true);
        setErro("");

        try {
            await limparFavoritosApi(API);
            setFavoritos([]);
            setConfirmarLimpeza(false);
        } catch (erroAtual) {
            setErro(erroAtual.message || "Não foi possível limpar seus favoritos.");
        } finally {
            setLimpandoFavoritos(false);
        }
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <div>
                    <span>Área do cliente</span>
                    <h1>Favoritos</h1>
                </div>
                <div className={css.acoes_cabecalho}>
                    <button type="button" onClick={carregarFavoritos} disabled={carregando || limpandoFavoritos}>
                        {carregando ? "Atualizando..." : "Atualizar"}
                    </button>
                    <button
                        type="button"
                        className={css.limpar_favoritos}
                        onClick={() => setConfirmarLimpeza(true)}
                        disabled={carregando || limpandoFavoritos || favoritos.length === 0}
                    >
                        {limpandoFavoritos ? "Limpando..." : "Limpar favoritos"}
                    </button>
                </div>
            </header>

            <div className={css.area_busca}>
                <img src="/IconBusca.png" alt="Buscar" className={css.icone_busca} />
                <input
                    type="text"
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar favorito por marca ou modelo"
                />
            </div>

            {erro && <p className={css.mensagem_erro}>{erro}</p>}

            {carregando && <div className={css.estado}>Carregando favoritos...</div>}

            {!carregando && !erro && favoritos.length === 0 && (
                <div className={css.estado}>
                    <strong>Nenhum favorito encontrado.</strong>
                    <span>Quando você favoritar um veículo, ele aparecerá aqui.</span>
                </div>
            )}

            {!carregando && !erro && favoritos.length > 0 && favoritosFiltrados.length === 0 && (
                <div className={css.estado}>
                    <strong>Nenhum favorito encontrado para essa busca.</strong>
                    <span>Tente pesquisar por outra marca ou modelo.</span>
                </div>
            )}

            {!carregando && !erro && favoritosFiltrados.length > 0 && (
                <section className={css.lista}>
                    {favoritosFiltrados.map((carro) => {
                        const id = idCarro(carro);

                        return (
                            <article key={id || nomeCarro(carro)} className={css.card}>
                                <div className={css.imagem_area}>
                                    <img
                                        src={imagemCarro(carro)}
                                        alt={nomeCarro(carro)}
                                        onError={(evento) => {
                                            evento.currentTarget.src = "/IconCar.png";
                                        }}
                                    />
                                </div>

                                <div className={css.info}>
                                    <span>Favorito</span>
                                    <h2>{nomeCarro(carro)}</h2>
                                    <div className={css.grade}>
                                        <p><strong>Marca:</strong> {carro.marca || carro.MARCA || "-"}</p>
                                        <p><strong>Modelo:</strong> {carro.modelo || carro.MODELO || "-"}</p>
                                        <p><strong>Ano:</strong> {carro.ano_fabricacao || carro.ANO_FABRICACAO || "-"} / {carro.ano_modelo || carro.ANO_MODELO || "-"}</p>
                                        <p><strong>Preço:</strong> {formatarMoeda(carro.preco ?? carro.PRECO)}</p>
                                    </div>
                                </div>

                                <div className={css.acoes}>
                                    {id && (
                                        <button type="button" onClick={() => navigate(`/detalhesVeiculos/${id}`)}>
                                            Ver detalhes
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={css.remover}
                                        onClick={() => removerFavorito(carro)}
                                        disabled={!id || removendoId === String(id)}
                                    >
                                        {removendoId === String(id) ? "Removendo..." : "Remover"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            <ModalConfirmacao
                aberto={confirmarLimpeza}
                titulo="Limpar favoritos"
                texto="Deseja remover todos os veículos da sua lista de favoritos?"
                destaque={`${favoritos.length} favorito${favoritos.length === 1 ? "" : "s"}`}
                textoConfirmar="Limpar favoritos"
                carregando={limpandoFavoritos}
                onCancelar={() => setConfirmarLimpeza(false)}
                onConfirmar={limparFavoritos}
            />
        </main>
    );
}

export default Favoritos;
