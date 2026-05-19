import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./DasbhoardAdmVendas.module.css";

const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
const filtrosStatus = ["Status", "Pago", "Pendente"];
const filtrosPagamento = ["Forma de Pagamento", "Pix", "Parcelado", "Cartão de débito", "Boleto", "Dinheiro"];

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function idUsuario(usuario) {
    return usuario?.id_usuario || usuario?.ID_USUARIO || usuario?.id || usuario?.ID;
}

function nomeUsuario(usuario) {
    return usuario?.nome || usuario?.NOME || usuario?.email || usuario?.EMAIL || `Cliente ${idUsuario(usuario) || "-"}`;
}

function extrairListaUsuarios(dados) {
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) === 0);

    return clientes.length > 0 ? clientes : lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) !== 2);
}

function textoFormaPagamento(valor) {
    const forma = String(valor ?? "").trim().toLowerCase();

    if (forma === "0" || forma.includes("pix")) {
        return "Pix";
    }

    if (forma === "1" || forma.includes("parcel")) {
        return "Parcelado";
    }

    return valor || "Não informado";
}

function textoStatusPagamento(valor) {
    const status = String(valor ?? "").trim().toLowerCase();

    if (status === "0" || status.includes("pago")) {
        return "Pago";
    }

    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        return "Pendente";
    }

    return valor || "Não informado";
}

function formatarData(valor) {
    if (!valor) {
        return "-";
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return String(valor);
    }

    return data.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function normalizarVenda(venda) {
    return {
        id: venda.id_venda || venda.ID_VENDA,
        data: formatarData(venda.data_venda || venda.DATA_VENDA),
        cliente: venda.cliente || venda.nome_cliente || venda.nome_usuario || `Cliente ${venda.id_usuario || venda.ID_USUARIO || "-"}`,
        veiculo: venda.veiculo || venda.nome_veiculo || venda.modelo || `Veículo ${venda.id_veiculo || venda.ID_VEICULO || "-"}`,
        pagamento: venda.forma_pagamento_texto || venda.forma_pagamento || venda.FORMA_PAGAMENTO || "Não informado",
        status: venda.status_pagamento_texto || venda.status_pagamento || venda.STATUS_PAGAMENTO || "Não informado",
        valorVenda: venda.valor_venda ?? venda.VALOR_VENDA ?? 0,
        valorRecebido: venda.valor_recebido ?? venda.VALOR_RECEBIDO ?? 0,
        desconto: venda.desconto ?? venda.DESCONTOS ?? 0,
        parcelas: venda.quantidade_parcelas || venda.QUANTIDADE_PARCELAS || "",
        comentarios: venda.comentarios || venda.COMENTARIOS || ""
    };
}

function textoMinusculo(valor) {
    return String(valor || "").toLowerCase();
}

function normalizarVendaUsuario(venda) {
    return {
        id: venda.id_venda || venda.ID_VENDA,
        data: formatarData(venda.data_venda || venda.DATA_VENDA),
        cliente: venda.nome_cliente || venda.cliente || venda.nome_usuario || `Cliente ${venda.id_usuario || venda.ID_USUARIO || "-"}`,
        veiculo: venda.veiculo || venda.nome_veiculo || venda.modelo || `Veículo ${venda.id_veiculo || venda.ID_VEICULO || "-"}`,
        pagamento: textoFormaPagamento(venda.forma_pagamento_texto || venda.forma_pagamento || venda.FORMA_PAGAMENTO),
        status: textoStatusPagamento(venda.status_pagamento_texto || venda.status_pagamento || venda.STATUS_PAGAMENTO),
        valorVenda: venda.valor_venda ?? venda.VALOR_VENDA ?? 0,
        valorRecebido: venda.valor_recebido ?? venda.VALOR_RECEBIDO ?? 0,
        desconto: venda.desconto ?? venda.DESCONTOS ?? 0,
        parcelas: venda.quantidade_parcelas || venda.QUANTIDADE_PARCELAS || "",
        comentarios: venda.comentarios || venda.COMENTARIOS || ""
    };
}

function DasbhoardAdmVendas({ API }) {
    const navigate = useNavigate();
    const [vendas, setVendas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    const [status, setStatus] = useState(filtrosStatus[0]);
    const [pagamento, setPagamento] = useState(filtrosPagamento[0]);
    const [vendaDetalhe, setVendaDetalhe] = useState(null);

    useEffect(() => {
        async function carregarVendas() {
            setCarregando(true);
            setErro("");

            try {
                const resposta = await fetch(`${API}/listar_usuario`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                    setVendas([]);
                    return;
                }

                const clientes = extrairListaUsuarios(dados);
                const vendasPorCliente = await Promise.all(clientes.map(async (cliente) => {
                    const id = idUsuario(cliente);

                    if (!id) {
                        return [];
                    }

                    const respostaVendas = await fetch(`${API}/listar_vendas_usuario?id_usuario=${encodeURIComponent(id)}`, {
                        method: "GET",
                        headers: cabecalhoAutorizacao(),
                        credentials: "include"
                    });

                    if (!respostaVendas.ok) {
                        return [];
                    }

                    const dadosVendas = await respostaVendas.json();
                    const lista = Array.isArray(dadosVendas) ? dadosVendas : dadosVendas.vendas || [];

                    return lista.map((venda) => ({
                        ...venda,
                        nome_cliente: nomeUsuario(cliente)
                    }));
                }));

                setVendas(vendasPorCliente.flat().map(normalizarVendaUsuario));
            } catch {
                setErro("Erro de conexão com o servidor.");
                setVendas([]);
            } finally {
                setCarregando(false);
            }
        }

        carregarVendas();
    }, [API]);

    const vendasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return vendas.filter((venda) => {
            const passaBusca =
                !termo ||
                [venda.data, venda.cliente, venda.veiculo, venda.pagamento, venda.status, venda.comentarios]
                    .some((campo) => textoMinusculo(campo).includes(termo));

            const passaStatus = status === "Status" || venda.status === status;
            const passaPagamento = pagamento === "Forma de Pagamento" || venda.pagamento === pagamento;

            return passaBusca && passaStatus && passaPagamento;
        });
    }, [busca, pagamento, status, vendas]);

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <h1>Vendas</h1>
                <button
                    type="button"
                    className={css.botaoCadastrar}
                    onClick={() => navigate("/venda")}
                >
                    Cadastrar Venda
                </button>
            </header>

            <label className={css.busca}>
                <img src="/IconBusca.png" alt="" />
                <input
                    type="text"
                    placeholder="Buscar vendas"
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
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Status"
                    >
                        {filtrosStatus.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    <select
                        value={pagamento}
                        onChange={(e) => setPagamento(e.target.value)}
                        aria-label="Forma de pagamento"
                    >
                        {filtrosPagamento.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>
                </div>

                <div className={css.tabelaWrapper}>
                    <table className={css.tabela}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Veículo</th>
                                <th>Forma de Pagamento</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {carregando && (
                                <tr>
                                    <td colSpan="6" className={css.vazio}>
                                        Carregando vendas...
                                    </td>
                                </tr>
                            )}

                            {!carregando && vendasFiltradas.map((venda) => (
                                <tr key={venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}>
                                    <td data-label="Data">{venda.data}</td>
                                    <td data-label="Cliente">{venda.cliente}</td>
                                    <td data-label="Veículo">{venda.veiculo}</td>
                                    <td data-label="Forma de Pagamento">{venda.pagamento}</td>
                                    <td data-label="Status">
                                        <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                            {venda.status}
                                        </span>
                                    </td>
                                    <td data-label="Ações">
                                        <button type="button" className={css.botaoDetalhe} onClick={() => setVendaDetalhe(venda)}>
                                            Ver detalhe
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!carregando && vendasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="6" className={css.vazio}>
                                        Nenhuma venda encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.cardsMobile}>
                    {carregando && (
                        <div className={css.cardEstado}>Carregando vendas...</div>
                    )}

                    {!carregando && vendasFiltradas.map((venda) => (
                        <article key={`mobile-${venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}`} className={css.cardVenda}>
                            <div className={css.cardVendaTopo}>
                                <div>
                                    <span>Data</span>
                                    <strong>{venda.data}</strong>
                                </div>
                                <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                    {venda.status}
                                </span>
                            </div>

                            <div className={css.cardVendaInfo}>
                                <div>
                                    <span>Cliente</span>
                                    <strong>{venda.cliente}</strong>
                                </div>
                                <div>
                                    <span>Veículo</span>
                                    <strong>{venda.veiculo}</strong>
                                </div>
                                <div>
                                    <span>Pagamento</span>
                                    <strong>{venda.pagamento}</strong>
                                </div>
                            </div>

                            <button type="button" className={css.botaoDetalheMobile} onClick={() => setVendaDetalhe(venda)}>
                                Ver detalhe
                            </button>
                        </article>
                    ))}

                    {!carregando && vendasFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma venda encontrada.</div>
                    )}
                </div>
            </section>

            {vendaDetalhe && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheVenda">
                    <div className={css.modalDetalhe}>
                        <div className={css.modalTopo}>
                            <div>
                                <span>Venda #{vendaDetalhe.id || "-"}</span>
                                <h2 id="tituloDetalheVenda">Detalhe da venda</h2>
                            </div>
                            <button type="button" onClick={() => setVendaDetalhe(null)} aria-label="Fechar detalhe">
                                x
                            </button>
                        </div>

                        <div className={css.detalheGrade}>
                            <div>
                                <span>Data</span>
                                <strong>{vendaDetalhe.data}</strong>
                            </div>
                            <div>
                                <span>Cliente</span>
                                <strong>{vendaDetalhe.cliente}</strong>
                            </div>
                            <div>
                                <span>Veículo</span>
                                <strong>{vendaDetalhe.veiculo}</strong>
                            </div>
                            <div>
                                <span>Forma de pagamento</span>
                                <strong>{vendaDetalhe.pagamento}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <strong>{vendaDetalhe.status}</strong>
                            </div>
                            <div>
                                <span>Parcelas</span>
                                <strong>{vendaDetalhe.parcelas || "À vista"}</strong>
                            </div>
                            <div>
                                <span>Valor da venda</span>
                                <strong>{formatarMoeda(vendaDetalhe.valorVenda)}</strong>
                            </div>
                            <div>
                                <span>Valor recebido</span>
                                <strong>{formatarMoeda(vendaDetalhe.valorRecebido)}</strong>
                            </div>
                            <div>
                                <span>Desconto</span>
                                <strong>{Number(vendaDetalhe.desconto || 0).toLocaleString("pt-BR")}%</strong>
                            </div>
                        </div>

                        <div className={css.detalheComentarios}>
                            <span>Observações</span>
                            <p>{vendaDetalhe.comentarios || "Sem observações."}</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default DasbhoardAdmVendas;
