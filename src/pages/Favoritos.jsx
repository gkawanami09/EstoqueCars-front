import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Favoritos.module.css";
import {
    cabecalhoAutorizacao,
    extrairListaFavoritos,
    idCarroFavorito,
    idUsuarioLogado,
    lerFavoritosLocais,
    salvarFavoritosLocais
} from "../utils/favoritos";

function idCarro(carro) {
    return idCarroFavorito(carro);
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

function Favoritos({ API }) {
    const navigate = useNavigate();
    const idUsuario = useMemo(() => idUsuarioLogado(), []);

    const [favoritos, setFavoritos] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [removendoId, setRemovendoId] = useState("");

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
        const favoritosLocais = lerFavoritosLocais(idUsuario);

        const rotas = [
            `/listar_favoritos?id_usuario=${encodeURIComponent(idUsuario || "")}`,
            `/listar_favoritos_usuario?id_usuario=${encodeURIComponent(idUsuario || "")}`,
            `/favoritos?id_usuario=${encodeURIComponent(idUsuario || "")}`,
            `/meus_favoritos?id_usuario=${encodeURIComponent(idUsuario || "")}`,
            `/listar_carro?favoritos=1&id_usuario=${encodeURIComponent(idUsuario || "")}`
        ];

        for (const rota of rotas) {
            try {
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });

                if (!resposta.ok) {
                    continue;
                }

                const dados = await resposta.json();
                const lista = extrairListaFavoritos(dados);
                const favoritosMesclados = [...lista, ...favoritosLocais].reduce((resultado, carro) => {
                    const id = idCarro(carro);

                    if (!id || resultado.some((item) => String(idCarro(item)) === String(id))) {
                        return resultado;
                    }

                    return [...resultado, { ...carro, favorito: true }];
                }, []);

                setFavoritos(favoritosMesclados);
                salvarFavoritosLocais(favoritosMesclados, idUsuario);
                setCarregando(false);
                return;
            } catch {
                // Tenta a próxima rota conhecida.
            }
        }

        setFavoritos(favoritosLocais);
        setErro("");
        setCarregando(false);
    }, [API, idUsuario]);

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
        const listaAtualizada = favoritos.filter((item) => String(idCarro(item)) !== String(id));
        setFavoritos(listaAtualizada);
        salvarFavoritosLocais(listaAtualizada, idUsuario);

        try {
            const resposta = await fetch(`${API}/favoritar_carro/${id}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                setErro(dados.erro || dados.mensagem || "");
                return;
            }
        } catch {
            // A remoção local já foi feita para manter a tela funcionando sem a rota definitiva.
        } finally {
            setRemovendoId("");
        }
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <div>
                    <span>Área do cliente</span>
                    <h1>Favoritos</h1>
                </div>
                <button type="button" onClick={carregarFavoritos} disabled={carregando}>
                    {carregando ? "Atualizando..." : "Atualizar"}
                </button>
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
        </main>
    );
}

export default Favoritos;
