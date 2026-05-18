import { useEffect, useMemo, useState } from "react";
import css from "./DasbhoardAdmVendas.module.css";
import { useNavigate } from "react-router-dom";

const filtrosPeriodo = ["Ultimos 30 dias", "Ultimos 15 dias", "Ultimos 7 dias"];
const filtrosStatus = ["Status", "Pago", "Pendente"];
const filtrosPagamento = ["Forma de Pagamento", "Pix", "Parcelado", "Cartão de débito", "Boleto", "Dinheiro"];

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizarVenda(venda) {
    return {
        id: venda.id_venda || venda.ID_VENDA,
        data: venda.data_venda || venda.DATA_VENDA || "-",
        cliente: venda.cliente || venda.nome_cliente || venda.nome_usuario || `Cliente ${venda.id_usuario || venda.ID_USUARIO || "-"}`,
        veiculo: venda.veiculo || venda.nome_veiculo || venda.modelo || `Veículo ${venda.id_veiculo || venda.ID_VEICULO || "-"}`,
        pagamento: venda.forma_pagamento_texto || venda.forma_pagamento || venda.FORMA_PAGAMENTO || "Não informado",
        status: venda.status_pagamento_texto || venda.status_pagamento || venda.STATUS_PAGAMENTO || "Não informado",
        valorVenda: venda.valor_venda ?? venda.VALOR_VENDA ?? 0,
        valorRecebido: venda.valor_recebido ?? venda.VALOR_RECEBIDO ?? 0,
        desconto: venda.desconto ?? venda.DESCONTOS ?? 0,
        comentarios: venda.comentarios || venda.COMENTARIOS || ""
    };
}

function textoMinusculo(valor) {
    return String(valor || "").toLowerCase();
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

    useEffect(() => {
        async function carregarVendas() {
            setCarregando(true);
            setErro("");

            try {
                const resposta = await fetch(`${API}/listar_venda`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro || dados.mensagem || "Erro ao carregar vendas.");
                    setVendas([]);
                    return;
                }

                const lista = Array.isArray(dados) ? dados : dados.vendas || [];
                setVendas(lista.map(normalizarVenda));
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
                <button type="button" 
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
                        aria-label="Periodo"
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
                                    <td data-label="Veiculo">{venda.veiculo}</td>
                                    <td data-label="Forma de Pagamento">{venda.pagamento}</td>
                                    <td data-label="Status">
                                        <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                            {venda.status}
                                        </span>
                                    </td>
                                    <td data-label="Acoes">
                                        <button type="button" className={css.botaoDetalhe}>
                                            Ver Detalhe
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
            </section>
        </main>
    );
}

export default DasbhoardAdmVendas;
