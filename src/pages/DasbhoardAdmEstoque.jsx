import { useEffect, useMemo, useState } from "react";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";
import css from "./DasbhoardAdmEstoque.module.css";

const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
const filtrosTipo = ["Tipo", "Entrada", "Saída"];

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

async function lerJson(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {};
    }
}

function extrairListaCarros(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    return dados?.carros || dados?.veiculos || dados?.veiculo || [];
}

function extrairListaUsuarios(dados) {
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) === 0);

    return clientes.length > 0 ? clientes : lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) !== 2);
}

function idUsuario(usuario) {
    return usuario?.id_usuario || usuario?.ID_USUARIO || usuario?.id || usuario?.ID;
}

function nomeUsuario(usuario) {
    return usuario?.nome || usuario?.NOME || usuario?.email || usuario?.EMAIL || `Cliente ${idUsuario(usuario) || "-"}`;
}

function idVeiculo(carro) {
    return carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO || carro?.id || carro?.ID;
}

function estaEmEstoque(carro) {
    const status = String(carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.status ?? "").toLowerCase();
    const statusVenda = String(carro?.status_venda ?? carro?.STATUS_VENDA ?? "").trim().toLowerCase();

    if (statusVenda) {
        return statusVenda === "disponivel" || statusVenda.includes("dispon");
    }

    if (status === "2" || status.includes("vend")) {
        return false;
    }

    if (status === "3" || status.includes("reserv") || status.includes("indispon")) {
        return false;
    }

    return true;
}

function nomeVeiculo(carro) {
    const marca = carro?.marca || carro?.MARCA || carro?.nome_marca || carro?.NOME_MARCA || "";
    const modelo = carro?.modelo || carro?.MODELO || carro?.nome || carro?.NOME || "";
    const nomeCompleto = [marca, modelo].filter(Boolean).join(" ").trim();

    return nomeCompleto || carro?.veiculo || carro?.VEICULO || `Veículo ${idVeiculo(carro) || "-"}`;
}

function nomeVeiculoVenda(venda) {
    return (
        venda?.veiculo ||
        venda?.VEICULO ||
        venda?.nome_veiculo ||
        venda?.NOME_VEICULO ||
        venda?.modelo ||
        venda?.MODELO ||
        `Veículo ${venda?.id_veiculo || venda?.ID_VEICULO || "-"}`
    );
}

function dataMovimentacaoCarro(carro) {
    return (
        carro?.data_cadastro ||
        carro?.DATA_CADASTRO ||
        carro?.criado_em ||
        carro?.CRIADO_EM ||
        carro?.created_at ||
        carro?.CREATED_AT ||
        carro?.data_entrada ||
        carro?.DATA_ENTRADA ||
        carro?.data ||
        carro?.DATA
    );
}

function dataMovimentacaoVenda(venda) {
    return venda?.data_venda || venda?.DATA_VENDA || venda?.data || venda?.DATA || venda?.created_at || venda?.CREATED_AT;
}

function dataParaOrdenacao(valor) {
    if (!valor) {
        return 0;
    }

    const texto = String(valor).trim();
    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

    if (dataBr) {
        const [, dia, mes, ano, hora = "00", minuto = "00"] = dataBr;
        return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)).getTime();
    }

    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

    if (dataIso) {
        const [, ano, mes, dia, hora = "00", minuto = "00"] = dataIso;
        return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)).getTime();
    }

    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

function formatarData(valor) {
    const tempo = dataParaOrdenacao(valor);

    if (!tempo) {
        return "-";
    }

    return new Date(tempo).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function diasDoPeriodo(periodo) {
    const numero = Number(String(periodo).match(/\d+/)?.[0] || 30);
    return Number.isFinite(numero) ? numero : 30;
}

function estaDentroDoPeriodo(movimentacao, periodo) {
    if (!movimentacao.tempo) {
        return false;
    }

    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - diasDoPeriodo(periodo));

    return movimentacao.tempo >= limite.getTime();
}

function montarEntrada(carro) {
    const dataOriginal = dataMovimentacaoCarro(carro);

    return {
        id: `entrada-${idVeiculo(carro) || nomeVeiculo(carro)}`,
        data: formatarData(dataOriginal),
        tempo: dataParaOrdenacao(dataOriginal),
        veiculo: nomeVeiculo(carro),
        tipo: "Entrada",
        origem: "Cadastro de veículo"
    };
}

function montarSaida(venda) {
    const dataOriginal = dataMovimentacaoVenda(venda);
    const idVenda = venda.id_venda || venda.ID_VENDA || venda.id || venda.ID;

    return {
        id: `saida-${idVenda || venda.id_veiculo || venda.ID_VEICULO || nomeVeiculoVenda(venda)}`,
        data: formatarData(dataOriginal),
        tempo: dataParaOrdenacao(dataOriginal),
        veiculo: nomeVeiculoVenda(venda),
        tipo: "Saída",
        origem: "Venda",
        cliente: venda.nome_cliente
    };
}

export default function DashboardAdmEstoque({ API }) {
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    const [tipo, setTipo] = useState(filtrosTipo[0]);
    const [totalEstoque, setTotalEstoque] = useState(0);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [movimentacaoDetalhe, setMovimentacaoDetalhe] = useState(null);

    useEffect(() => {
        async function carregarEstoque() {
            if (!API) {
                return;
            }

            setCarregando(true);
            setErro("");

            try {
                const headers = cabecalhoAutorizacao();
                const respostaCarros = await fetch(`${API}/listar_carro`, {
                    method: "GET",
                    headers,
                    credentials: "include"
                });
                const dadosCarros = await lerJson(respostaCarros);

                if (!respostaCarros.ok) {
                    setErro(dadosCarros.erro || dadosCarros.mensagem || "Não foi possível carregar o estoque.");
                    setMovimentacoes([]);
                    return;
                }

                const carros = extrairListaCarros(dadosCarros);
                const entradas = carros.map(montarEntrada);
                let saidas = [];

                try {
                    const respostaUsuarios = await fetch(`${API}/listar_usuario`, {
                        method: "GET",
                        headers,
                        credentials: "include"
                    });
                    const dadosUsuarios = await lerJson(respostaUsuarios);

                    if (respostaUsuarios.ok) {
                        const usuarios = extrairListaUsuarios(dadosUsuarios);
                        const vendasPorUsuario = await Promise.all(usuarios.map(async (usuario) => {
                            const id = idUsuario(usuario);

                            if (!id) {
                                return [];
                            }

                            const respostaVendas = await fetch(`${API}/listar_vendas_usuario?id_usuario=${encodeURIComponent(id)}`, {
                                method: "GET",
                                headers,
                                credentials: "include"
                            });
                            const dadosVendas = await lerJson(respostaVendas);

                            if (!respostaVendas.ok) {
                                return [];
                            }

                            const vendas = Array.isArray(dadosVendas) ? dadosVendas : dadosVendas.vendas || dadosVendas.compras || [];

                            return vendas.map((venda) => ({
                                ...venda,
                                nome_cliente: nomeUsuario(usuario)
                            }));
                        }));

                        saidas = vendasPorUsuario.flat().map(montarSaida);
                    }
                } catch {
                    setErro("Estoque carregado, mas não foi possível carregar as saídas de vendas.");
                }

                setTotalEstoque(carros.filter(estaEmEstoque).length);
                setMovimentacoes([...entradas, ...saidas].sort((a, b) => b.tempo - a.tempo));
            } catch {
                setErro("Erro de conexão com o servidor.");
                setMovimentacoes([]);
            } finally {
                setCarregando(false);
            }
        }

        carregarEstoque();
    }, [API]);

    const movimentacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return movimentacoes.filter((movimentacao) => {
            const passaBusca =
                !termo ||
                [movimentacao.data, movimentacao.veiculo, movimentacao.tipo, movimentacao.origem, movimentacao.cliente]
                    .some((campo) => String(campo || "").toLowerCase().includes(termo));
            const passaTipo = tipo === "Tipo" || movimentacao.tipo === tipo;
            const passaPeriodo = estaDentroDoPeriodo(movimentacao, periodo);

            return passaBusca && passaTipo && passaPeriodo;
        });
    }, [busca, movimentacoes, periodo, tipo]);

    const totalPaginas = Math.max(1, Math.ceil(movimentacoesFiltradas.length / ITENS_POR_PAGINA));

    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, periodo, tipo]);

    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    const movimentacoesPaginadas = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return movimentacoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [movimentacoesFiltradas, paginaAtual]);

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <h1>Estoque</h1>
            </header>

            <section className={css.cardResumo} aria-label="Resumo do estoque">
                <img src="/Estoque.png" alt="veículo vermelho" />
                <div className={css.resumoTexto}>
                    <strong>{carregando ? "..." : totalEstoque}</strong>
                    <span>Veículos em Estoque</span>
                </div>
            </section>

            <label className={css.busca}>
                <img src="/IconBusca.png" alt="" />
                <input
                    type="text"
                    placeholder="Buscar veículos"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </label>

            <section className={css.cardTabela}>
                {erro && <p className={css.erro}>{erro}</p>}

                <div className={css.filtros}>
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        aria-label="Período"
                    >
                        {filtrosPeriodo.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        aria-label="Tipo de movimentação"
                    >
                        {filtrosTipo.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>
                </div>

                <div className={css.tabelaWrapper}>
                    <table className={css.tabela}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Veículo</th>
                                <th>Movimentação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {carregando && (
                                <tr>
                                    <td colSpan="4" className={css.vazio}>
                                        Carregando movimentações...
                                    </td>
                                </tr>
                            )}

                            {!carregando && movimentacoesPaginadas.map((movimentacao) => (
                                <tr key={movimentacao.id}>
                                    <td data-label="Data">{movimentacao.data}</td>
                                    <td data-label="Veículo">{movimentacao.veiculo}</td>
                                    <td data-label="Movimentação">
                                        <span className={movimentacao.tipo === "Entrada" ? css.entrada : css.saida}>
                                            {movimentacao.tipo}
                                        </span>
                                    </td>
                                    <td data-label="Ações">
                                        <button
                                            type="button"
                                            className={css.botaoDetalhe}
                                            onClick={() => setMovimentacaoDetalhe(movimentacao)}
                                        >
                                            Ver Detalhe
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!carregando && movimentacoesFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="4" className={css.vazio}>
                                        Nenhuma movimentação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.cardsMobile}>
                    {carregando && <div className={css.cardEstado}>Carregando movimentações...</div>}

                    {!carregando && movimentacoesPaginadas.map((movimentacao) => (
                        <article key={`mobile-${movimentacao.id}`} className={css.cardMovimentacao}>
                            <div className={css.cardMovimentacaoTopo}>
                                <div>
                                    <span>Data</span>
                                    <strong>{movimentacao.data}</strong>
                                </div>
                                <span className={movimentacao.tipo === "Entrada" ? css.entrada : css.saida}>
                                    {movimentacao.tipo}
                                </span>
                            </div>
                            <div>
                                <span>Veículo</span>
                                <strong>{movimentacao.veiculo}</strong>
                            </div>
                            <button type="button" onClick={() => setMovimentacaoDetalhe(movimentacao)}>
                                Ver Detalhe
                            </button>
                        </article>
                    ))}

                    {!carregando && movimentacoesFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma movimentação encontrada.</div>
                    )}
                </div>

                {!carregando && movimentacoesFiltradas.length > 0 && (
                    <div className={css.paginacaoArea}>
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={movimentacoesFiltradas.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </section>

            {movimentacaoDetalhe && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheEstoque">
                    <div className={css.modalDetalhe}>
                        <div className={css.modalTopo}>
                            <div>
                                <span>Movimentação</span>
                                <h2 id="tituloDetalheEstoque">{movimentacaoDetalhe.veiculo}</h2>
                            </div>
                            <button type="button" onClick={() => setMovimentacaoDetalhe(null)} aria-label="Fechar detalhe">
                                x
                            </button>
                        </div>

                        <div className={css.detalheGrade}>
                            <div>
                                <span>Data</span>
                                <strong>{movimentacaoDetalhe.data}</strong>
                            </div>
                            <div>
                                <span>Veículo</span>
                                <strong>{movimentacaoDetalhe.veiculo}</strong>
                            </div>
                            <div>
                                <span>Movimentação</span>
                                <strong className={movimentacaoDetalhe.tipo === "Entrada" ? css.entrada : css.saida}>
                                    {movimentacaoDetalhe.tipo}
                                </strong>
                            </div>
                            <div>
                                <span>Origem</span>
                                <strong>{movimentacaoDetalhe.origem || "-"}</strong>
                            </div>
                            <div>
                                <span>Cliente</span>
                                <strong>{movimentacaoDetalhe.cliente || "-"}</strong>
                            </div>
                        </div>

                        <div className={css.modalAcoes}>
                            <button type="button" className={css.botaoDetalhe} onClick={() => setMovimentacaoDetalhe(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
