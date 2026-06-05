import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function usuarioPodeFavoritar() {
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado");

    if (!usuarioSalvo) {
        return false;
    }

    try {
        const usuario = JSON.parse(usuarioSalvo);
        const tipoUsuario = Number(usuario.tipo_usuario ?? usuario["tipo_usuário"]);
        return [0, 1, 2].includes(tipoUsuario);
    } catch {
        return false;
    }
}

function carroEstaFavoritado(carro) {
    const valor = carro?.favorito ?? carro?.FAVORITO ?? carro?.favoritado ?? carro?.FAVORITADO ?? carro?.is_favorito ?? carro?.IS_FAVORITO ?? carro?.id_favorito ?? carro?.ID_FAVORITO;
    return valor === true || valor === 1 || String(valor).toLowerCase() === "true";
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

const categorias = [
    { nome: "Sedan", rota: "/CarrosSedan" },
    { nome: "Elétrico", rota: "/CarrosEletricos" },
    { nome: "Esportivo", rota: "/CarrosEsportivos" },
    { nome: "Caminhonete", rota: "/CarrosCaminhonetes" },
    { nome: "SUV", rota: "/CarrosSUV" }
];

const destaquesFallback = {
    Sedan: { titulo: "HYUNDAI HB20", preco: 113000, imagem: "/CarHB20.png", alt: "Carro Hyundai HB20 Branco" },
    Elétrico: { titulo: "HONDA HR-V", preco: 180000, imagem: "/CarHonda.png", alt: "Carro HONDA HR-V" },
    Esportivo: { titulo: "PORSHE 911", preco: 860000, imagem: "/CarPorshe911.png", alt: "Carro PORSHE 911" },
    Caminhonete: { titulo: "FIAT TORO", preco: 150000, imagem: "/CarFiatToro.png", alt: "Carro FIAT TORO" },
    SUV: { titulo: "HYUNDAI HB20", preco: 113000, imagem: "/CarTiggo.png", alt: "Carro TIGGO 5X SPORT" }
};

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    });
}

function formatarCambio(valor) {
    const cambio = String(valor || "").toLowerCase();

    if (cambio === "1" || cambio.includes("auto")) {
        return "Automático";
    }

    if (cambio === "2" || cambio.includes("manual")) {
        return "Manual";
    }

    return valor || "-";
}

function formatarQuilometragem(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return valor || "-";
    }

    return `${numero.toLocaleString("pt-BR")} km`;
}

function idCarro(carro) {
    return carro?.id || carro?.id_carro || carro?.id_veiculo;
}

function statusVendaCarro(carro) {
    return String(carro?.status_venda ?? carro?.STATUS_VENDA ?? carro?.situacao_venda ?? carro?.SITUACAO_VENDA ?? "").trim().toUpperCase();
}

function statusEstoqueCarro(carro) {
    return String(carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.statusEstoque ?? carro?.status ?? "").trim().toLowerCase();
}

function tipoStatusEstoque(carro) {
    const statusVenda = statusVendaCarro(carro);

    if (statusVenda === "VENDIDO") {
        return "vendido";
    }

    if (statusVenda === "RESERVADO_PENDENTE_CONCLUSAO") {
        return "reservado";
    }

    if (statusVenda === "DISPONIVEL") {
        return "estoque";
    }

    const status = statusEstoqueCarro(carro);

    if (status === "2" || status === "3" || status.includes("vend")) {
        return "vendido";
    }

    if (status.includes("reserv") || status.includes("indispon")) {
        return "reservado";
    }

    if (status === "1" || status.includes("estoque") || (status.includes("dispon") && !status.includes("indispon"))) {
        return "estoque";
    }

    return "reservado";
}

function carroDisponivelCatalogo(carro) {
    return tipoStatusEstoque(carro) === "estoque";
}

function nomeCarro(carro) {
    const nomeCompleto = carro?.nome || [carro?.marca, carro?.modelo].filter(Boolean).join(" ");
    return nomeCompleto || "Veículo";
}

function montarUrlImagem(API, carro) {
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

function CatalogoCarros({ API, categoriaAtual, css }) {
    const navigate = useNavigate();
    const [carros, setCarros] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [favoritandoId, setFavoritandoId] = useState("");
    const mostrarFavorito = usuarioPodeFavoritar();

    const carregarCarros = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const params = new URLSearchParams({ categoria: categoriaAtual });
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao carregar veículos.");
                setCarros([]);
                return;
            }

            setCarros((dados.carros || []).filter(carroDisponivelCatalogo));
        } catch {
            setErro("Erro de conexão com o servidor.");
            setCarros([]);
        } finally {
            setCarregando(false);
        }
    }, [API, categoriaAtual]);

    useEffect(() => {
        carregarCarros();
    }, [carregarCarros]);

    const destaque = useMemo(() => {
        const fallback = destaquesFallback[categoriaAtual];
        const menorPreco = carros.reduce((menor, carro) => {
            if (!menor) {
                return carro;
            }

            return Number(carro.preco || 0) < Number(menor.preco || 0) ? carro : menor;
        }, null);

        return {
            ...fallback,
            preco: menorPreco?.preco || fallback.preco
        };
    }, [carros, categoriaAtual]);

    function irParaContato() {
        window.location.href = "/#Contato";
    }

    function abrirDetalhes(carro) {
        const id = idCarro(carro);

        if (!id) {
            return;
        }

        navigate(`/detalhesVeiculos/${id}`);
    }

    function abrirDetalhesPeloTeclado(event, carro) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            abrirDetalhes(carro);
        }
    }

    async function favoritarCarro(event, carro) {
        event.stopPropagation();

        const id = idCarro(carro);

        if (!id || favoritandoId) {
            return;
        }

        setFavoritandoId(String(id));
        setErro("");

        try {
            await alternarFavorito(API, id);
            setCarros((listaAtual) => listaAtual.map((item) => (
                String(idCarro(item)) === String(id) ? { ...item, favorito: !carroEstaFavoritado(item) } : item
            )));
        } catch (erroAtual) {
            setErro(erroAtual.message || "Não foi possível atualizar este favorito.");
        } finally {
            setFavoritandoId("");
        }
    }

    return (
        <main className={css.container}>
            <section className={css.secao_destaque}>
                <div className={css.cabecalho_destaque}>
                    <p className={css.subtitulo_destaque}>O mais acessível da categoria</p>
                    <h1 className={css.titulo_destaque}>{destaque.titulo}</h1>
                    <button type="button" className={css.botao_ver_mais_destaque} onClick={irParaContato}>
                        Ver Mais
                    </button>
                </div>

                <div className={css.area_imagem_destaque}>
                    <div className={css.circulo_preco}>
                        <span className={css.texto_a_partir}>A partir de</span>
                        <h2 className={css.valor_destaque}>{formatarPreco(destaque.preco)}</h2>
                    </div>
                    <img
                        className={css.imagem_carro_destaque}
                        src={destaque.imagem}
                        alt={destaque.alt}
                        onError={(e) => {
                            e.currentTarget.src = "/IconCar.png";
                        }}
                    />
                </div>
            </section>

            <section className={css.secao_filtros}>
                <h2 className={css.titulo_explore}>Explore todas as opções</h2>
                <div className={css.grupo_botoes_filtro}>
                    {categorias.map((categoria) => (
                        <button
                            key={categoria.nome}
                            type="button"
                            className={`${css.botao_filtro} ${categoriaAtual === categoria.nome ? css.filtro_ativo : ""}`}
                            onClick={() => navigate(categoria.rota)}
                        >
                            {categoria.nome}
                        </button>
                    ))}
                </div>
            </section>

            <section className={css.lista_carros}>
                {carregando && <div className={css.estado_lista}>Carregando veículos...</div>}
                {!carregando && erro && <div className={css.estado_lista}>{erro}</div>}
                {!carregando && !erro && carros.length === 0 && (
                    <div className={css.estado_lista}>Nenhum veículo encontrado nesta categoria.</div>
                )}

                {!carregando && !erro && carros.map((carro) => (
                    <article
                        key={idCarro(carro) || nomeCarro(carro)}
                        className={css.card_carro}
                        role="button"
                        tabIndex={0}
                        onClick={() => abrirDetalhes(carro)}
                        onKeyDown={(event) => abrirDetalhesPeloTeclado(event, carro)}
                    >
                        <div className={css.area_imagem_card}>
                            <img
                                src={montarUrlImagem(API, carro)}
                                alt={nomeCarro(carro)}
                                className={css.imagem_card}
                                onError={(e) => {
                                    e.currentTarget.src = "/IconCar.png";
                                }}
                            />
                        </div>

                        <div className={css.informacoes_card}>
                            <h3 className={css.nome_carro}>{nomeCarro(carro)}</h3>
                            <div className={css.grade_especificacoes}>
                                <p><strong>Modelo:</strong> {carro.ano_modelo || carro.ano_fabricacao || "-"}</p>
                                <p><strong>KM:</strong> {formatarQuilometragem(carro.quilometragem)}</p>
                                <p><strong>Câmbio:</strong> {formatarCambio(carro.cambio)}</p>
                                <p><strong>Cor Disponível:</strong> {carro.cor || "-"}</p>
                            </div>
                        </div>

                        <div className={css.area_preco_acao}>
                            <h2 className={css.preco_carro}>{formatarPreco(carro.preco)}</h2>
                            <div className={css.acoes_card}>
                                {mostrarFavorito && (
                                    <button
                                        type="button"
                                        className={`${css.botao_favorito} ${carroEstaFavoritado(carro) ? css.favorito_ativo : ""}`}
                                        onClick={(event) => favoritarCarro(event, carro)}
                                        disabled={favoritandoId === String(idCarro(carro))}
                                        aria-pressed={carroEstaFavoritado(carro)}
                                        aria-label={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        title={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                        <span aria-hidden="true">{carroEstaFavoritado(carro) ? "♥" : "♡"}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={css.botao_ver_mais_card}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        abrirDetalhes(carro);
                                    }}
                                >
                                    Ver Mais
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}

export default CatalogoCarros;
