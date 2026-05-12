import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

    const carregarCarros = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const params = new URLSearchParams({ categoria: categoriaAtual });
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao carregar veículos.");
                setCarros([]);
                return;
            }

            setCarros(dados.carros || []);
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
                    <article key={idCarro(carro) || nomeCarro(carro)} className={css.card_carro}>
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
                            <button type="button" className={css.botao_ver_mais_card} onClick={irParaContato}>
                                Ver Mais
                            </button>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}

export default CatalogoCarros;
