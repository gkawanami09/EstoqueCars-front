import { useState } from "react";
import css from "./DashboardADMFinanceiros.module.css";

function DashboardADMFinanceiros() {
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState("30");
    const [tipo, setTipo] = useState("todos");
    const [transacoes, setTransacoes] = useState([]);
    const [modalAberto, setModalAberto] = useState(false);
    const [formulario, setFormulario] = useState({
        tipo: "entrada",
        data: "",
        descricao: "",
        valor: ""
    });

    const transacoesFiltradas = transacoes.filter((transacao) => {
        const termo = busca.trim().toLowerCase();
        const tipoSelecionado = tipo.toLowerCase();
        const descricao = String(transacao.descricao || "").toLowerCase();
        const tipoTransacao = String(transacao.tipo || "").toLowerCase();

        const passaBusca = !termo || descricao.includes(termo);
        const passaTipo = tipoSelecionado === "todos" || tipoTransacao === tipoSelecionado;

        return passaBusca && passaTipo;
    });

    const receita = transacoes
        .filter((transacao) => transacao.tipo === "entrada")
        .reduce((total, transacao) => total + Number(transacao.valor || 0), 0);

    const despesas = transacoes
        .filter((transacao) => transacao.tipo === "saida")
        .reduce((total, transacao) => total + Number(transacao.valor || 0), 0);

    const saldoAtual = receita - despesas;
    const totalMes = transacoes.reduce((total, transacao) => total + Number(transacao.valor || 0), 0);

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarTipo(valor) {
        return valor === "entrada" ? "Entrada" : "Saída";
    }

    function atualizarFormulario(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    function fecharModal() {
        setModalAberto(false);
        setFormulario({
            tipo: "entrada",
            data: "",
            descricao: "",
            valor: ""
        });
    }

    function salvarTransacao(evento) {
        evento.preventDefault();

        const valorNumerico = Number(String(formulario.valor).replace(",", "."));

        if (!formulario.data || !formulario.descricao.trim() || !valorNumerico) {
            return;
        }

        setTransacoes((listaAtual) => [
            {
                id: crypto.randomUUID(),
                tipo: formulario.tipo,
                data: formulario.data,
                descricao: formulario.descricao.trim(),
                valor: valorNumerico
            },
            ...listaAtual
        ]);

        fecharModal();
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <h1>Financeiro</h1>
            </header>

            <section className={css.resumo}>
                <article className={`${css.card_resumo} ${css.card_receita}`}>
                    <span>Receita</span>
                    <strong>{formatarMoeda(receita)}</strong>
                </article>

                <article className={`${css.card_resumo} ${css.card_despesas}`}>
                    <span>Despesas</span>
                    <strong>{formatarMoeda(despesas)}</strong>
                </article>

                <article className={`${css.card_resumo} ${css.card_saldo}`}>
                    <span>Saldo Atual</span>
                    <strong>{formatarMoeda(saldoAtual)}</strong>
                </article>

                <article className={`${css.card_resumo} ${css.card_mes}`}>
                    <span>No mês</span>
                    <strong>{formatarMoeda(totalMes)}</strong>
                </article>
            </section>

            <section className={css.filtros}>
                <label className={css.campo_busca}>
                    <img src="/IconBusca.png" alt="Buscar" />
                    <input
                        type="text"
                        placeholder="Buscar transacoes"
                        value={busca}
                        onChange={(evento) => setBusca(evento.target.value)}
                    />
                </label>

                <select
                    className={`${css.select_filtro} ${css.select_periodo}`}
                    value={periodo}
                    onChange={(evento) => setPeriodo(evento.target.value)}
                    aria-label="Periodo"
                >
                    <option value="30">Últimos 30 dias</option>
                    <option value="15">Últimos 15 dias</option>
                    <option value="7">Últimos 7 dias</option>
                </select>

                <select
                    className={css.select_filtro}
                    value={tipo}
                    onChange={(evento) => setTipo(evento.target.value)}
                    aria-label="Tipo"
                >
                    <option value="todos">Tipo</option>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                </select>

                <button type="button" className={css.botao_nova} onClick={() => setModalAberto(true)}>
                    Nova Transação
                </button>
            </section>

            <section className={css.tabela_container}>
                <table className={css.tabela}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {transacoesFiltradas.map((transacao) => (
                            <tr key={transacao.id}>
                                <td data-label="Data">{transacao.data}</td>
                                <td data-label="Descricao">{transacao.descricao}</td>
                                <td data-label="Tipo">
                                    <span className={`${css.status} ${transacao.tipo === "entrada" ? css.entrada : css.saida}`}>
                                        {formatarTipo(transacao.tipo)}
                                    </span>
                                </td>
                                <td
                                    data-label="Valor"
                                    className={transacao.tipo === "entrada" ? css.valor_entrada : css.valor_saida}
                                >
                                    {formatarMoeda(transacao.valor)}
                                </td>
                                <td data-label="Acoes">
                                    <div className={css.acoes}>
                                        <button type="button" className={css.botao_editar} aria-label="Editar transacao">
                                            <img src="/Editar.png" alt="" />
                                        </button>
                                        <button type="button" className={css.botao_excluir} aria-label="Excluir transacao">
                                            <img src="/Exculir.png" alt="" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {transacoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan="5" className={css.estado_vazio}>
                                    Nenhuma transação encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {modalAberto && (
                <div className={css.modal_overlay}>
                    <form className={css.modal} onSubmit={salvarTransacao}>
                        <header className={css.modal_cabecalho}>
                            <h2>Nova Transação</h2>
                        </header>

                        <div className={css.modal_conteudo}>
                            <fieldset className={css.grupo_tipo}>
                                <legend>Tipo</legend>

                                <div className={css.opcoes_tipo}>
                                    <button
                                        type="button"
                                        className={`${css.botao_tipo} ${css.botao_entrada} ${formulario.tipo === "entrada" ? css.tipo_ativo : ""}`}
                                        onClick={() => atualizarFormulario("tipo", "entrada")}
                                    >
                                        Entrada
                                    </button>

                                    <button
                                        type="button"
                                        className={`${css.botao_tipo} ${css.botao_saida} ${formulario.tipo === "saida" ? css.tipo_ativo : ""}`}
                                        onClick={() => atualizarFormulario("tipo", "saida")}
                                    >
                                        Saida
                                    </button>
                                </div>
                            </fieldset>

                            <label className={css.campo_modal}>
                                <span>Data</span>
                                <input
                                    type="date"
                                    value={formulario.data}
                                    onChange={(evento) => atualizarFormulario("data", evento.target.value)}
                                    required
                                />
                            </label>

                            <label className={css.campo_modal}>
                                <span>Descrição</span>
                                <input
                                    type="text"
                                    value={formulario.descricao}
                                    onChange={(evento) => atualizarFormulario("descricao", evento.target.value)}
                                    required
                                />
                            </label>

                            <label className={css.campo_modal}>
                                <span>Valor</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formulario.valor}
                                    onChange={(evento) => atualizarFormulario("valor", evento.target.value)}
                                    required
                                />
                            </label>
                        </div>

                        <footer className={css.modal_botoes}>
                            <button type="submit" className={css.botao_salvar}>
                                Salvar
                            </button>
                            <button type="button" className={css.botao_cancelar} onClick={fecharModal}>
                                Cancelar
                            </button>
                        </footer>
                    </form>
                </div>
            )}
        </main>
    );
}

export default DashboardADMFinanceiros;
