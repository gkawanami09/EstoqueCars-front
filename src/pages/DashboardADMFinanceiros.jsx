import { useCallback, useEffect, useMemo, useState } from "react";
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";
import css from "./DashboardADMFinanceiros.module.css";

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function montarQuery(parametros) {
    const busca = new URLSearchParams();

    Object.entries(parametros).forEach(([chave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== "" && valor !== "todos") {
            busca.set(chave, valor);
        }
    });

    const query = busca.toString();
    return query ? `?${query}` : "";
}

function idTransacao(transacao) {
    return transacao?.id_financeiro || transacao?.id || transacao?.ID_FINANCEIRO;
}

function normalizarTipo(valor, tipoCodigo) {
    const texto = String(valor || "").trim().toLowerCase();

    if (texto === "saida" || texto === "saída" || texto === "despesa") {
        return "saida";
    }

    if (texto === "entrada" || texto === "receita") {
        return "entrada";
    }

    return Number(tipoCodigo) === 1 ? "saida" : "entrada";
}

function normalizarTransacao(transacao) {
    const tipoCodigo = transacao?.tipo_codigo ?? transacao?.TIPO;

    return {
        id: idTransacao(transacao),
        tipo: normalizarTipo(transacao?.tipo || transacao?.TIPO_TEXTO, tipoCodigo),
        data: transacao?.data || transacao?.data_financeiro || transacao?.DATA_FINANCEIRO || "",
        descricao: transacao?.descricao || transacao?.DESCRICAO || "",
        veiculo: transacao?.veiculo || transacao?.VEICULO || transacao?.nome_veiculo || transacao?.NOME_VEICULO || "",
        valor: Number(transacao?.valor ?? transacao?.VALOR ?? 0)
    };
}

function dataParaTela(valor) {
    if (!valor) {
        return "-";
    }

    const texto = String(valor);
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dataIso) {
        const [, ano, mes, dia] = dataIso;
        return `${dia}/${mes}/${ano}`;
    }

    return texto;
}

function idVeiculo(carro) {
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO;
}

function nomeVeiculo(carro) {
    const marca = carro?.marca || carro?.MARCA;
    const modelo = carro?.modelo || carro?.MODELO;
    const placa = carro?.placa || carro?.PLACA;
    const nome = [marca, modelo].filter(Boolean).join(" ");

    return [nome || "Veículo", placa].filter(Boolean).join(" - ");
}

function precoVeiculo(carro) {
    const valor = carro?.preco ?? carro?.PRECO ?? carro?.valor ?? carro?.VALOR ?? "";
    const texto = String(valor).trim();
    const numero = texto.includes(",")
        ? Number(texto.replace(/\./g, "").replace(",", "."))
        : Number(texto);

    return Number.isFinite(numero) && numero > 0 ? numero : "";
}

function nomePeriodo(periodo) {
    if (!periodo) {
        return "Todo o período";
    }

    return `Últimos ${periodo} dias`;
}

function DashboardADMFinanceiros({ API }) {
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState("30");
    const [tipo, setTipo] = useState("todos");
    const [veiculos, setVeiculos] = useState([]);
    const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
    const [transacoes, setTransacoes] = useState([]);
    const [resumo, setResumo] = useState({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        lucro_liquido: 0
    });
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [transacaoEditando, setTransacaoEditando] = useState(null);
    const [transacaoParaExcluir, setTransacaoParaExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);
    const [formulario, setFormulario] = useState({
        tipo: "entrada",
        id_veiculo: "",
        data: "",
        descricao: "",
        valor: ""
    });

    const transacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return transacoes;
        }

        return transacoes.filter((transacao) => (
            [
                transacao.descricao,
                transacao.veiculo,
                dataParaTela(transacao.data),
                transacao.tipo === "entrada" ? "receita entrada" : "despesa saída saida"
            ].join(" ").toLowerCase().includes(termo)
        ));
    }, [busca, transacoes]);

    const totaisVisiveis = useMemo(() => {
        return transacoesFiltradas.reduce((total, transacao) => {
            if (transacao.tipo === "entrada") {
                total.receitas += Number(transacao.valor || 0);
            } else {
                total.despesas += Number(transacao.valor || 0);
            }

            return total;
        }, { receitas: 0, despesas: 0 });
    }, [transacoesFiltradas]);

    const carregarFinanceiro = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const queryLista = montarQuery({ periodo, tipo });
            const queryResumo = montarQuery({ periodo });

            const [respostaLista, respostaResumo] = await Promise.all([
                fetch(`${API}/listar_financeiro${queryLista}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                }),
                fetch(`${API}/resumo_financeiro${queryResumo}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                })
            ]);

            const dadosLista = await respostaLista.json().catch(() => ({}));
            const dadosResumo = await respostaResumo.json().catch(() => ({}));

            if (!respostaLista.ok) {
                throw new Error(dadosLista.erro || dadosLista.mensagem || "Não foi possível carregar as transações.");
            }

            if (!respostaResumo.ok) {
                throw new Error(dadosResumo.erro || dadosResumo.mensagem || "Não foi possível carregar o resumo financeiro.");
            }

            const lista = Array.isArray(dadosLista)
                ? dadosLista
                : dadosLista.transacoes || dadosLista.financeiro || [];

            setTransacoes(lista.map(normalizarTransacao));
            setResumo({
                receitas: Number(dadosResumo.receitas || 0),
                despesas: Number(dadosResumo.despesas || 0),
                saldo: Number(dadosResumo.saldo || 0),
                lucro_liquido: Number(dadosResumo.lucro_liquido ?? dadosResumo.saldo ?? 0)
            });
        } catch (erroAtual) {
            setTransacoes([]);
            setErro(erroAtual.message || "Não foi possível carregar o financeiro.");
        } finally {
            setCarregando(false);
        }
    }, [API, periodo, tipo]);

    useEffect(() => {
        carregarFinanceiro();
    }, [carregarFinanceiro]);

    useEffect(() => {
        async function carregarVeiculos() {
            setCarregandoVeiculos(true);

            try {
                const resposta = await fetch(`${API}/listar_carro`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json().catch(() => []);

                if (resposta.ok) {
                    setVeiculos(Array.isArray(dados) ? dados : dados.veiculos || dados.carros || []);
                }
            } finally {
                setCarregandoVeiculos(false);
            }
        }

        carregarVeiculos();
    }, [API]);

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarTipo(valor) {
        return valor === "entrada" ? "Receita" : "Despesa";
    }

    function atualizarFormulario(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    function selecionarVeiculo(valor) {
        const veiculo = veiculos.find((carro) => String(idVeiculo(carro)) === String(valor));
        const valorDoCarro = veiculo ? precoVeiculo(veiculo) : "";

        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            id_veiculo: valor,
            descricao: dadosAtuais.descricao || (veiculo ? `${dadosAtuais.tipo === "entrada" ? "Receita" : "Despesa"} - ${nomeVeiculo(veiculo)}` : ""),
            valor: valorDoCarro ? String(valorDoCarro) : dadosAtuais.valor
        }));
    }

    function limparFiltros() {
        setBusca("");
        setPeriodo("30");
        setTipo("todos");
    }

    function abrirCadastro(tipoInicial = "entrada") {
        setTransacaoEditando(null);
        setFormulario({
            tipo: tipoInicial,
            id_veiculo: "",
            data: new Date().toISOString().slice(0, 10),
            descricao: "",
            valor: ""
        });
        setModalAberto(true);
        setErro("");
        setMensagem("");
    }

    function abrirEdicao(transacao) {
        setTransacaoEditando(transacao);
        setFormulario({
            tipo: transacao.tipo,
            id_veiculo: "",
            data: String(transacao.data || "").slice(0, 10),
            descricao: transacao.descricao,
            valor: String(transacao.valor)
        });
        setModalAberto(true);
        setErro("");
        setMensagem("");
    }

    function fecharModal() {
        if (salvando) {
            return;
        }

        setModalAberto(false);
        setTransacaoEditando(null);
        setFormulario({
            tipo: "entrada",
            id_veiculo: "",
            data: "",
            descricao: "",
            valor: ""
        });
    }

    async function salvarTransacao(evento) {
        evento.preventDefault();

        const valorNumerico = Number(String(formulario.valor).replace(",", "."));

        if (!formulario.data || !formulario.descricao.trim() || !valorNumerico) {
            setErro("Preencha data, descrição e valor para salvar.");
            return;
        }

        setSalvando(true);
        setErro("");
        setMensagem("");

        try {
            const editando = Boolean(transacaoEditando?.id);
            const resposta = await fetch(
                editando
                    ? `${API}/editar_financeiro/${transacaoEditando.id}`
                    : `${API}/cadastro_financeiro`,
                {
                    method: editando ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...cabecalhoAutorizacao()
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        tipo: formulario.tipo,
                        id_veiculo: formulario.id_veiculo || null,
                        data: formulario.data,
                        descricao: formulario.descricao.trim(),
                        valor: valorNumerico
                    })
                }
            );
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível salvar a transação.");
            }

            fecharModal();
            setMensagem(dados.mensagem || "Transação salva com sucesso.");
            await carregarFinanceiro();
        } catch (erroAtual) {
            setErro(erroAtual.message || "Não foi possível salvar a transação.");
        } finally {
            setSalvando(false);
        }
    }

    async function excluirTransacao() {
        if (!transacaoParaExcluir?.id) {
            return;
        }

        setExcluindo(true);
        setErro("");
        setMensagem("");

        try {
            const resposta = await fetch(`${API}/excluir_financeiro/${transacaoParaExcluir.id}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível excluir a transação.");
            }

            setTransacaoParaExcluir(null);
            setMensagem(dados.mensagem || "Transação excluída com sucesso.");
            await carregarFinanceiro();
        } catch (erroAtual) {
            setErro(erroAtual.message || "Não foi possível excluir a transação.");
        } finally {
            setExcluindo(false);
        }
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <div>
                    <span>Área administrativa</span>
                    <h1>Financeiro</h1>
                    <p>Controle receitas, despesas, saldo e lucro líquido por período.</p>
                </div>

                <div className={css.acoes_topo}>
                    <button type="button" className={css.botao_secundario} onClick={carregarFinanceiro} disabled={carregando}>
                        {carregando ? "Atualizando..." : "Atualizar"}
                    </button>
                    <button type="button" className={css.botao_nova} onClick={() => abrirCadastro("entrada")}>
                        Nova transação
                    </button>
                </div>
            </header>

            <section className={css.resumo}>
                <button
                    type="button"
                    className={`${css.card_resumo} ${css.card_receita} ${tipo === "entrada" ? css.card_ativo : ""}`}
                    onClick={() => setTipo(tipo === "entrada" ? "todos" : "entrada")}
                >
                    <span>Receitas do período</span>
                    <strong>{formatarMoeda(resumo.receitas)}</strong>
                </button>

                <button
                    type="button"
                    className={`${css.card_resumo} ${css.card_despesas} ${tipo === "saida" ? css.card_ativo : ""}`}
                    onClick={() => setTipo(tipo === "saida" ? "todos" : "saida")}
                >
                    <span>Despesas do período</span>
                    <strong>{formatarMoeda(resumo.despesas)}</strong>
                </button>

                <article className={`${css.card_resumo} ${css.card_saldo}`}>
                    <span>Saldo financeiro</span>
                    <strong>{formatarMoeda(resumo.saldo)}</strong>
                </article>

                <article className={`${css.card_resumo} ${css.card_mes}`}>
                    <span>Lucro líquido</span>
                    <strong>{formatarMoeda(resumo.lucro_liquido)}</strong>
                </article>
            </section>

            <section className={css.painel_filtros}>
                <div className={css.filtros_cabecalho}>
                    <div>
                        <strong>{nomePeriodo(periodo)}</strong>
                        <span>{transacoesFiltradas.length} transação{transacoesFiltradas.length === 1 ? "" : "ões"} na lista</span>
                    </div>
                    <button type="button" onClick={limparFiltros}>
                        Limpar filtros
                    </button>
                </div>

                <div className={css.filtros}>
                    <label className={css.campo_busca}>
                        <img src="/IconBusca.png" alt="Buscar" />
                        <input
                            type="text"
                            placeholder="Buscar por descrição, data ou tipo"
                            value={busca}
                            onChange={(evento) => setBusca(evento.target.value)}
                        />
                    </label>

                    <select
                        className={`${css.select_filtro} ${css.select_periodo}`}
                        value={periodo}
                        onChange={(evento) => setPeriodo(evento.target.value)}
                        aria-label="Período"
                    >
                        <option value="30">Últimos 30 dias</option>
                        <option value="15">Últimos 15 dias</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="">Todo o período</option>
                    </select>

                    <select
                        className={css.select_filtro}
                        value={tipo}
                        onChange={(evento) => setTipo(evento.target.value)}
                        aria-label="Tipo"
                    >
                        <option value="todos">Todos os tipos</option>
                        <option value="entrada">Receitas</option>
                        <option value="saida">Despesas</option>
                    </select>
                </div>
            </section>

            <section className={css.resumo_visivel}>
                <span>Receitas visíveis: <strong>{formatarMoeda(totaisVisiveis.receitas)}</strong></span>
                <span>Despesas visíveis: <strong>{formatarMoeda(totaisVisiveis.despesas)}</strong></span>
                <span>Resultado visível: <strong>{formatarMoeda(totaisVisiveis.receitas - totaisVisiveis.despesas)}</strong></span>
            </section>

            {erro && <p className={css.mensagem_erro}>{erro}</p>}
            {mensagem && <p className={css.mensagem_sucesso}>{mensagem}</p>}

            <section className={css.tabela_container}>
                <table className={css.tabela}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Veículo</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>

                    <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan="6" className={css.estado_vazio}>
                                    Carregando transações...
                                </td>
                            </tr>
                        )}

                        {!carregando && transacoesFiltradas.map((transacao) => (
                            <tr key={transacao.id}>
                                <td data-label="Data">{dataParaTela(transacao.data)}</td>
                                <td data-label="Descrição">{transacao.descricao}</td>
                                <td data-label="Veículo">{transacao.veiculo || "-"}</td>
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
                                <td data-label="Ações">
                                    <div className={css.acoes}>
                                        <button
                                            type="button"
                                            className={css.botao_editar}
                                            aria-label="Editar transação"
                                            onClick={() => abrirEdicao(transacao)}
                                        >
                                            <img src="/Editar.png" alt="" />
                                        </button>
                                        <button
                                            type="button"
                                            className={css.botao_excluir}
                                            aria-label="Excluir transação"
                                            onClick={() => setTransacaoParaExcluir(transacao)}
                                        >
                                            <img src="/Exculir.png" alt="" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {!carregando && transacoesFiltradas.length === 0 && (
                            <tr>
                                <td colSpan="6" className={css.estado_vazio}>
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
                            <div>
                                <span>{transacaoEditando ? "Editar registro" : "Novo registro"}</span>
                                <h2>{transacaoEditando ? "Editar transação" : "Nova transação"}</h2>
                            </div>
                            <button type="button" onClick={fecharModal} disabled={salvando} aria-label="Fechar modal">
                                ×
                            </button>
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
                                        Receita
                                    </button>

                                    <button
                                        type="button"
                                        className={`${css.botao_tipo} ${css.botao_saida} ${formulario.tipo === "saida" ? css.tipo_ativo : ""}`}
                                        onClick={() => atualizarFormulario("tipo", "saida")}
                                    >
                                        Despesa
                                    </button>
                                </div>
                            </fieldset>

                            <label className={css.campo_modal}>
                                <span>Veículo relacionado</span>
                                <select
                                    value={formulario.id_veiculo}
                                    onChange={(evento) => selecionarVeiculo(evento.target.value)}
                                    disabled={carregandoVeiculos}
                                >
                                    <option value="">
                                        {carregandoVeiculos ? "Carregando veículos..." : "Selecione um veículo, se tiver relação"}
                                    </option>
                                    {veiculos.map((carro) => (
                                        <option key={idVeiculo(carro)} value={idVeiculo(carro)}>
                                            {nomeVeiculo(carro)}
                                        </option>
                                    ))}
                                </select>
                            </label>

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
                                    placeholder="Ex: Venda de veículo, manutenção, taxa..."
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
                                    placeholder="0,00"
                                    required
                                />
                            </label>
                        </div>

                        <footer className={css.modal_botoes}>
                            <button type="submit" className={css.botao_salvar} disabled={salvando}>
                                {salvando ? "Salvando..." : "Salvar"}
                            </button>
                            <button type="button" className={css.botao_cancelar} onClick={fecharModal} disabled={salvando}>
                                Cancelar
                            </button>
                        </footer>
                    </form>
                </div>
            )}

            <ModalConfirmacao
                aberto={Boolean(transacaoParaExcluir)}
                titulo="Excluir transação"
                texto="Deseja excluir esta transação financeira?"
                destaque={transacaoParaExcluir?.descricao}
                textoConfirmar="Excluir"
                carregando={excluindo}
                onCancelar={() => setTransacaoParaExcluir(null)}
                onConfirmar={excluirTransacao}
            />
        </main>
    );
}

export default DashboardADMFinanceiros;
