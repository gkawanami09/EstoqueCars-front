import { useMemo, useState } from "react";
import css from "./DasbhoardAdmVendas.module.css";
import { useNavigate } from "react-router-dom";

const vendas = [
    {
        id: 1,
        data: "08/03/2026",
        cliente: "Jorge Silva",
        veiculo: "Hyundai HB20",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {
        id: 2,
        data: "08/03/2026",
        cliente: "Roberto Faria",
        veiculo: "Toyota Hilux",
        pagamento: "Dinheiro",
        status: "Pendente"
    },
    {
        id: 3,
        data: "08/03/2026",
        cliente: "Marcos Jose",
        veiculo: "Honda HR-V",
        pagamento: "Cartao de Credito",
        status: "Pendente"
    },
    {
        id: 4,
        data: "08/03/2026",
        cliente: "Lais Sinatra",
        veiculo: "BMW M2",
        pagamento: "Pix",
        status: "Pago"
    },
    {
        id: 5,
        data: "08/03/2026",
        cliente: "Robson Pinto",
        veiculo: "Hyundai Creta",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {
        id: 6,
        data: "08/03/2026",
        cliente: "Igor Cacerez",
        veiculo: "Fiat Toro",
        pagamento: "Escambo",
        status: "Pendente"
    },
    {
        id: 7,
        data: "08/03/2026",
        cliente: "Mariana Alves",
        veiculo: "Nissan Frontier",
        pagamento: "Cartao de Credito",
        status: "Pendente"
    },
    {
        id: 8,
        data: "08/03/2026",
        cliente: "Leticia Moreira",
        veiculo: "Jeep Renegade",
        pagamento: "Cartao de Credito",
        status: "Pendente"
    },
    {
        id: 9,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {
           id: 10,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 11,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 12,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 13,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 14,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    }, 
    {   id: 15,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 16,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
    {   id: 17,
        data: "08/03/2026",
        cliente: "Carla Silva",
        veiculo: "Porshe 911",
        pagamento: "Cartao de Credito",
        status: "Pago"
    },
];

const filtrosPeriodo = ["Ultimos 30 dias", "Ultimos 15 dias", "Ultimos 7 dias"];
const filtrosStatus = ["Status", "Pago", "Pendente"];
const filtrosPagamento = ["Forma de Pagamento", "Cartao de Credito", "Dinheiro", "Pix", "Escambo"];

function DasbhoardAdmVendas() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    const [status, setStatus] = useState(filtrosStatus[0]);
    const [pagamento, setPagamento] = useState(filtrosPagamento[0]);

    const vendasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return vendas.filter((venda) => {
            const passaBusca =
                !termo ||
                [venda.data, venda.cliente, venda.veiculo, venda.pagamento, venda.status]
                    .some((campo) => campo.toLowerCase().includes(termo));

            const passaStatus = status === "Status" || venda.status === status;
            const passaPagamento = pagamento === "Forma de Pagamento" || venda.pagamento === pagamento;

            return passaBusca && passaStatus && passaPagamento;
        });
    }, [busca, status, pagamento]);

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
                            {vendasFiltradas.map((venda) => (
                                <tr key={venda.id}>
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

                            {vendasFiltradas.length === 0 && (
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
