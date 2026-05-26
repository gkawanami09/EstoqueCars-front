import { useEffect, useMemo, useState } from "react";
import css from "./DasbhoardAdmEstoque.module.css";

const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
const filtrosTipo = ["Tipo", "Entrada", "Saída"];

const movimentacoesBase = [
    { id: 1, data: "02/03/2026", veiculo: "Hyundai HB20", tipo: "Entrada" },
    { id: 2, data: "01/03/2026", veiculo: "BMW M2", tipo: "Saída" },
    { id: 3, data: "25/02/2026", veiculo: "Toyota Hilux", tipo: "Saída" },
    { id: 4, data: "22/02/2026", veiculo: "Fiat Toro", tipo: "Saída" },
    { id: 5, data: "19/02/2026", veiculo: "Honda HR-V", tipo: "Entrada" },
    { id: 6, data: "04/02/2026", veiculo: "Porshe 911", tipo: "Saída" },
    { id: 7, data: "04/02/2026", veiculo: "Hyundai HB20", tipo: "Entrada" },
    { id: 8, data: "04/02/2026", veiculo: "Fiat Toro", tipo: "Entrada" },
    { id: 9, data: "02/02/2026", veiculo: "Honda HR-V", tipo: "Entrada" }
];

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function extrairLista(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    return dados?.carros || dados?.veiculos || dados?.veiculo || [];
}

function estaEmEstoque(carro) {
    const status = String(carro?.status_estoque ?? carro?.status ?? "").toLowerCase();
    const statusVenda = String(carro?.status_venda ?? carro?.STATUS_VENDA ?? "").toLowerCase();

    if (statusVenda.includes("vend") || status === "2" || status.includes("vend")) {
        return false;
    }

    return true;
}

export default function DashboardAdmEstoque({ API }) {
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    const [tipo, setTipo] = useState(filtrosTipo[0]);
    const [totalEstoque, setTotalEstoque] = useState(20);
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
                const resposta = await fetch(`${API}/listar_carro`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro || "Não foi possível carregar o estoque.");
                    return;
                }

                const carros = extrairLista(dados);
                setTotalEstoque(carros.filter(estaEmEstoque).length);
            } catch {
                setErro("Erro de conexão com o servidor.");
            } finally {
                setCarregando(false);
            }
        }

        carregarEstoque();
    }, [API]);

    const movimentacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return movimentacoesBase.filter((movimentacao) => {
            const passaBusca =
                !termo ||
                [movimentacao.data, movimentacao.veiculo, movimentacao.tipo]
                    .some((campo) => campo.toLowerCase().includes(termo));
            const passaTipo = tipo === "Tipo" || movimentacao.tipo === tipo;

            return passaBusca && passaTipo;
        });
    }, [busca, tipo]);

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <h1>Estoque</h1>
            </header>

            <section className={css.cardResumo} aria-label="Resumo do estoque">
                <img src="/Estoque.png" alt="veiculo vermelho" />
                <strong>{carregando ? "..." : totalEstoque}</strong>
                <span>Veículos em Estoque</span>
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
                            {movimentacoesFiltradas.map((movimentacao) => (
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

                            {movimentacoesFiltradas.length === 0 && (
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
                    {movimentacoesFiltradas.map((movimentacao) => (
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

                    {movimentacoesFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma movimentação encontrada.</div>
                    )}
                </div>
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
