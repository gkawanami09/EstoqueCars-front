// Importa os hooks do React usados para estado, efeitos, memorização e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o modal reutilizável para confirmar exclusões.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";
// Importa as classes CSS module desta página.
import css from "./DashboardADMFinanceiros.module.css";

// Monta o cabeçalho de autorização para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se existir token, envia Authorization Bearer; senão, retorna objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Monta uma query string ignorando filtros vazios ou "todos".
function montarQuery(parametros) {
    // Cria um objeto próprio para parâmetros de URL.
    const busca = new URLSearchParams();

    // Percorre cada parâmetro recebido.
    Object.entries(parametros).forEach(([chave, valor]) => {
        // Adiciona somente valores realmente preenchidos.
        if (valor !== undefined && valor !== null && valor !== "" && valor !== "todos") {
            busca.set(chave, valor);
        }
    });

    // Converte os parâmetros em texto.
    const query = busca.toString();
    // Retorna a query com "?" quando houver parâmetros.
    return query ? `?${query}` : "";
}

// Descobre o ID da transação aceitando nomes diferentes vindos da API.
function idTransacao(transacao) {
    return transacao?.id_financeiro || transacao?.id || transacao?.ID_FINANCEIRO;
}

// Normaliza o tipo da transação para "entrada" ou "saida".
function normalizarTipo(valor, tipoCodigo) {
    // Converte o texto recebido para minúsculo e remove espaços extras.
    const texto = String(valor || "").trim().toLowerCase();

    // Reconhece saída por texto.
    if (texto === "saida" || texto === "saída" || texto === "despesa") {
        return "saida";
    }

    // Reconhece entrada por texto.
    if (texto === "entrada" || texto === "receita") {
        return "entrada";
    }

    // Quando não vem texto claro, usa o código numérico como fallback.
    return Number(tipoCodigo) === 1 ? "saida" : "entrada";
}

// Converte uma transação da API para o formato usado pela tela.
function normalizarTransacao(transacao) {
    // Lê o código do tipo, quando existir.
    const tipoCodigo = transacao?.tipo_codigo ?? transacao?.TIPO;

    // Retorna um objeto padronizado para a interface.
    return {
        id: idTransacao(transacao),
        tipo: normalizarTipo(transacao?.tipo || transacao?.TIPO_TEXTO, tipoCodigo),
        data: transacao?.data || transacao?.data_financeiro || transacao?.DATA_FINANCEIRO || "",
        descricao: transacao?.descricao || transacao?.DESCRICAO || "",
        veiculo: transacao?.veiculo || transacao?.VEICULO || transacao?.nome_veiculo || transacao?.NOME_VEICULO || "",
        valor: Number(transacao?.valor ?? transacao?.VALOR ?? 0)
    };
}

// Formata a data para exibição na tabela.
function dataParaTela(valor) {
    // Se não houver data, mostra hífen.
    if (!valor) {
        return "-";
    }

    // Converte o valor para texto.
    const texto = String(valor);
    // Verifica se a data está no formato ISO yyyy-mm-dd.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    // Se for ISO, troca para dd/mm/yyyy.
    if (dataIso) {
        const [, ano, mes, dia] = dataIso;
        return `${dia}/${mes}/${ano}`;
    }

    // Se não for ISO, mostra o texto original.
    return texto;
}

// Descobre o ID do veículo aceitando nomes diferentes da API.
function idVeiculo(carro) {
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO;
}

// Monta o nome exibido para um veículo.
function nomeVeiculo(carro) {
    // Lê marca, modelo e placa aceitando campos maiúsculos ou minúsculos.
    const marca = carro?.marca || carro?.MARCA;
    const modelo = carro?.modelo || carro?.MODELO;
    const placa = carro?.placa || carro?.PLACA;
    // Junta marca e modelo quando existirem.
    const nome = [marca, modelo].filter(Boolean).join(" ");

    // Junta nome e placa em uma label única.
    return [nome || "Veículo", placa].filter(Boolean).join(" - ");
}

// Extrai e converte o preço do veículo.
function precoVeiculo(carro) {
    // Lê o valor aceitando nomes diferentes.
    const valor = carro?.preco ?? carro?.PRECO ?? carro?.valor ?? carro?.VALOR ?? "";
    // Converte para texto para tratar vírgula e ponto.
    const texto = String(valor).trim();
    // Converte valores brasileiros com vírgula para número.
    const numero = texto.includes(",")
        ? Number(texto.replace(/\./g, "").replace(",", "."))
        : Number(texto);

    // Retorna o número apenas se ele for válido e maior que zero.
    return Number.isFinite(numero) && numero > 0 ? numero : "";
}

// Retorna o nome amigável do período selecionado.
function nomePeriodo(periodo) {
    // Período vazio representa todos os registros.
    if (!periodo) {
        return "Todo o período";
    }

    // Monta o texto dos últimos dias.
    return `Últimos ${periodo} dias`;
}

// Componente principal do dashboard financeiro administrativo.
function DashboardADMFinanceiros({ API }) {
    // Guarda o texto de busca digitado.
    const [busca, setBusca] = useState("");
    // Guarda o período selecionado no filtro.
    const [periodo, setPeriodo] = useState("30");
    // Guarda o tipo selecionado no filtro.
    const [tipo, setTipo] = useState("todos");
    // Guarda os veículos usados no select do formulário.
    const [veiculos, setVeiculos] = useState([]);
    // Controla o carregamento da lista de veículos.
    const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
    // Guarda as transações financeiras listadas.
    const [transacoes, setTransacoes] = useState([]);
    // Guarda os totais do resumo financeiro.
    const [resumo, setResumo] = useState({
        receitas: 0,
        despesas: 0,
        saldo: 0,
        lucro_liquido: 0
    });
    // Controla o carregamento principal da página.
    const [carregando, setCarregando] = useState(true);
    // Controla o carregamento do botão de salvar.
    const [salvando, setSalvando] = useState(false);
    // Guarda mensagens de erro.
    const [erro, setErro] = useState("");
    // Guarda mensagens de sucesso.
    const [mensagem, setMensagem] = useState("");
    // Controla se o modal de cadastro/edição está aberto.
    const [modalAberto, setModalAberto] = useState(false);
    // Guarda a transação que está sendo editada.
    const [transacaoEditando, setTransacaoEditando] = useState(null);
    // Guarda a transação selecionada para exclusão.
    const [transacaoParaExcluir, setTransacaoParaExcluir] = useState(null);
    // Controla o carregamento da exclusão.
    const [excluindo, setExcluindo] = useState(false);
    // Guarda os campos do formulário financeiro.
    const [formulario, setFormulario] = useState({
        tipo: "entrada",
        id_veiculo: "",
        data: "",
        descricao: "",
        valor: ""
    });

    // Filtra as transações conforme o texto de busca.
    const transacoesFiltradas = useMemo(() => {
        // Normaliza o termo digitado.
        const termo = busca.trim().toLowerCase();

        // Se não houver busca, mostra todas as transações.
        if (!termo) {
            return transacoes;
        }

        // Procura o termo nos principais campos da transação.
        return transacoes.filter((transacao) => (
            [
                transacao.descricao,
                transacao.veiculo,
                dataParaTela(transacao.data),
                transacao.tipo === "entrada" ? "receita entrada" : "despesa saída saida"
            ].join(" ").toLowerCase().includes(termo)
        ));
    }, [busca, transacoes]);

    // Calcula os totais apenas das transações visíveis após filtros locais.
    const totaisVisiveis = useMemo(() => {
        // Soma receitas e despesas com reduce.
        return transacoesFiltradas.reduce((total, transacao) => {
            // Entradas somam em receitas.
            if (transacao.tipo === "entrada") {
                total.receitas += Number(transacao.valor || 0);
            } else {
                // Saídas somam em despesas.
                total.despesas += Number(transacao.valor || 0);
            }

            // Retorna o acumulador para a próxima transação.
            return total;
        }, { receitas: 0, despesas: 0 });
    }, [transacoesFiltradas]);

    // Carrega a lista de transações e o resumo financeiro.
    const carregarFinanceiro = useCallback(async () => {
        // Ativa o carregamento principal.
        setCarregando(true);
        // Limpa erro anterior.
        setErro("");

        // Tenta buscar os dados financeiros.
        try {
            // Monta a query da lista com período e tipo.
            const queryLista = montarQuery({ periodo, tipo });
            // Monta a query do resumo apenas com período.
            const queryResumo = montarQuery({ periodo });

            // Busca lista e resumo em paralelo.
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

            // Tenta ler o JSON da lista.
            const dadosLista = await respostaLista.json().catch(() => ({}));
            // Tenta ler o JSON do resumo.
            const dadosResumo = await respostaResumo.json().catch(() => ({}));

            // Se a lista falhou, interrompe com erro.
            if (!respostaLista.ok) {
                throw new Error(dadosLista.erro || dadosLista.mensagem || "Não foi possível carregar as transações.");
            }

            // Se o resumo falhou, interrompe com erro.
            if (!respostaResumo.ok) {
                throw new Error(dadosResumo.erro || dadosResumo.mensagem || "Não foi possível carregar o resumo financeiro.");
            }

            // Aceita a lista como array direto ou dentro de propriedades conhecidas.
            const lista = Array.isArray(dadosLista)
                ? dadosLista
                : dadosLista.transacoes || dadosLista.financeiro || [];

            // Normaliza e salva as transações.
            setTransacoes(lista.map(normalizarTransacao));
            // Salva os totais do resumo, convertendo tudo para número.
            setResumo({
                receitas: Number(dadosResumo.receitas || 0),
                despesas: Number(dadosResumo.despesas || 0),
                saldo: Number(dadosResumo.saldo || 0),
                lucro_liquido: Number(dadosResumo.lucro_liquido ?? dadosResumo.saldo ?? 0)
            });
        } catch (erroAtual) {
            // Limpa a lista se ocorrer erro.
            setTransacoes([]);
            // Mostra mensagem de erro.
            setErro(erroAtual.message || "Não foi possível carregar o financeiro.");
        } finally {
            // Desliga o carregamento principal.
            setCarregando(false);
        }
    }, [API, periodo, tipo]);

    // Recarrega o financeiro ao abrir a tela ou mudar filtros de API.
    useEffect(() => {
        carregarFinanceiro();
    }, [carregarFinanceiro]);

    // Carrega a lista de veículos usada no formulário.
    useEffect(() => {
        // Função interna porque o useEffect não pode ser async diretamente.
        async function carregarVeiculos() {
            // Ativa o carregamento dos veículos.
            setCarregandoVeiculos(true);

            // Tenta buscar os veículos.
            try {
                // Faz a requisição para listar carros.
                const resposta = await fetch(`${API}/listar_carro`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                // Tenta ler o JSON, usando array vazio em falha.
                const dados = await resposta.json().catch(() => []);

                // Se deu certo, salva a lista em formato aceito.
                if (resposta.ok) {
                    setVeiculos(Array.isArray(dados) ? dados : dados.veiculos || dados.carros || []);
                }
            } finally {
                // Desliga o carregamento dos veículos.
                setCarregandoVeiculos(false);
            }
        }

        // Executa a busca de veículos.
        carregarVeiculos();
    }, [API]);

    // Formata valores monetários em reais.
    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Converte o tipo interno para texto de exibição.
    function formatarTipo(valor) {
        return valor === "entrada" ? "Receita" : "Despesa";
    }

    // Atualiza um campo específico do formulário.
    function atualizarFormulario(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    // Atualiza o formulário quando um veículo é selecionado.
    function selecionarVeiculo(valor) {
        // Procura o veículo selecionado pelo ID.
        const veiculo = veiculos.find((carro) => String(idVeiculo(carro)) === String(valor));
        // Pega o valor do carro para preencher automaticamente, se existir.
        const valorDoCarro = veiculo ? precoVeiculo(veiculo) : "";

        // Atualiza ID do veículo, descrição e valor.
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            id_veiculo: valor,
            descricao: dadosAtuais.descricao || (veiculo ? `${dadosAtuais.tipo === "entrada" ? "Receita" : "Despesa"} - ${nomeVeiculo(veiculo)}` : ""),
            valor: valorDoCarro ? String(valorDoCarro) : dadosAtuais.valor
        }));
    }

    // Reseta todos os filtros para o padrão.
    function limparFiltros() {
        setBusca("");
        setPeriodo("30");
        setTipo("todos");
    }

    // Abre o modal para cadastrar uma nova transação.
    function abrirCadastro(tipoInicial = "entrada") {
        // Garante que não há transação em edição.
        setTransacaoEditando(null);
        // Preenche o formulário com valores iniciais.
        setFormulario({
            tipo: tipoInicial,
            id_veiculo: "",
            data: new Date().toISOString().slice(0, 10),
            descricao: "",
            valor: ""
        });
        // Abre o modal.
        setModalAberto(true);
        // Limpa erro antigo.
        setErro("");
        // Limpa mensagem antiga.
        setMensagem("");
    }

    // Abre o modal preenchido para editar uma transação.
    function abrirEdicao(transacao) {
        // Guarda a transação em edição.
        setTransacaoEditando(transacao);
        // Preenche o formulário com os dados da transação.
        setFormulario({
            tipo: transacao.tipo,
            id_veiculo: "",
            data: String(transacao.data || "").slice(0, 10),
            descricao: transacao.descricao,
            valor: String(transacao.valor)
        });
        // Abre o modal.
        setModalAberto(true);
        // Limpa erro antigo.
        setErro("");
        // Limpa mensagem antiga.
        setMensagem("");
    }

    // Fecha o modal de cadastro/edição.
    function fecharModal() {
        // Impede fechar enquanto está salvando.
        if (salvando) {
            return;
        }

        // Fecha o modal.
        setModalAberto(false);
        // Limpa a transação em edição.
        setTransacaoEditando(null);
        // Reseta o formulário.
        setFormulario({
            tipo: "entrada",
            id_veiculo: "",
            data: "",
            descricao: "",
            valor: ""
        });
    }

    // Salva uma transação nova ou editada.
    async function salvarTransacao(evento) {
        // Impede o submit padrão do formulário.
        evento.preventDefault();

        // Converte o valor digitado para número.
        const valorNumerico = Number(String(formulario.valor).replace(",", "."));

        // Valida os campos obrigatórios.
        if (!formulario.data || !formulario.descricao.trim() || !valorNumerico) {
            setErro("Preencha data, descrição e valor para salvar.");
            return;
        }

        // Ativa o carregamento do salvar.
        setSalvando(true);
        // Limpa erro anterior.
        setErro("");
        // Limpa mensagem anterior.
        setMensagem("");

        // Tenta salvar na API.
        try {
            // Define se está editando ou criando.
            const editando = Boolean(transacaoEditando?.id);
            // Envia a requisição para o endpoint correto.
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
            // Tenta ler a resposta como JSON.
            const dados = await resposta.json().catch(() => ({}));

            // Se a API retornou erro, interrompe com mensagem.
            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível salvar a transação.");
            }

            // Fecha o modal após salvar.
            fecharModal();
            // Mostra mensagem de sucesso.
            setMensagem(dados.mensagem || "Transação salva com sucesso.");
            // Recarrega os dados financeiros atualizados.
            await carregarFinanceiro();
        } catch (erroAtual) {
            // Mostra erro se o salvamento falhar.
            setErro(erroAtual.message || "Não foi possível salvar a transação.");
        } finally {
            // Desliga o carregamento do salvar.
            setSalvando(false);
        }
    }

    // Exclui a transação selecionada no modal de confirmação.
    async function excluirTransacao() {
        // Se não houver transação selecionada, não faz nada.
        if (!transacaoParaExcluir?.id) {
            return;
        }

        // Ativa o carregamento da exclusão.
        setExcluindo(true);
        // Limpa erro anterior.
        setErro("");
        // Limpa mensagem anterior.
        setMensagem("");

        // Tenta excluir pela API.
        try {
            // Envia a requisição DELETE.
            const resposta = await fetch(`${API}/excluir_financeiro/${transacaoParaExcluir.id}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Tenta ler a resposta como JSON.
            const dados = await resposta.json().catch(() => ({}));

            // Se a API retornou erro, interrompe com mensagem.
            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível excluir a transação.");
            }

            // Fecha o modal de confirmação.
            setTransacaoParaExcluir(null);
            // Mostra mensagem de sucesso.
            setMensagem(dados.mensagem || "Transação excluída com sucesso.");
            // Recarrega o financeiro atualizado.
            await carregarFinanceiro();
        } catch (erroAtual) {
            // Mostra erro se a exclusão falhar.
            setErro(erroAtual.message || "Não foi possível excluir a transação.");
        } finally {
            // Desliga o carregamento da exclusão.
            setExcluindo(false);
        }
    }

    // Renderiza a página financeira.
    return (
        // Container principal da página.
        <main className={css.pagina}>
            {/* Cabeçalho da área financeira. */}
            <header className={css.cabecalho}>
                <div>
                    <span>Área administrativa</span>
                    <h1>Financeiro</h1>
                    <p>Controle receitas, despesas, saldo e lucro líquido por período.</p>
                </div>

                {/* Ações principais do topo. */}
                <div className={css.acoes_topo}>
                    <button type="button" className={css.botao_secundario} onClick={carregarFinanceiro} disabled={carregando}>
                        {carregando ? "Atualizando..." : "Atualizar"}
                    </button>
                    <button type="button" className={css.botao_nova} onClick={() => abrirCadastro("entrada")}>
                        Nova transação
                    </button>
                </div>
            </header>

            {/* Cards com resumo financeiro do período. */}
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

            {/* Painel de filtros da tabela. */}
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

                {/* Campos de busca, período e tipo. */}
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

            {/* Resumo calculado somente com os itens visíveis na tabela. */}
            <section className={css.resumo_visivel}>
                <span>Receitas visíveis: <strong>{formatarMoeda(totaisVisiveis.receitas)}</strong></span>
                <span>Despesas visíveis: <strong>{formatarMoeda(totaisVisiveis.despesas)}</strong></span>
                <span>Resultado visível: <strong>{formatarMoeda(totaisVisiveis.receitas - totaisVisiveis.despesas)}</strong></span>
            </section>

            {/* Mensagens de erro e sucesso. */}
            {erro && <p className={css.mensagem_erro}>{erro}</p>}
            {mensagem && <p className={css.mensagem_sucesso}>{mensagem}</p>}

            {/* Tabela de transações financeiras. */}
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
                        {/* Linha de carregamento da tabela. */}
                        {carregando && (
                            <tr>
                                <td colSpan="6" className={css.estado_vazio}>
                                    Carregando transações...
                                </td>
                            </tr>
                        )}

                        {/* Linhas das transações filtradas. */}
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

                        {/* Linha vazia quando não há resultado. */}
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

            {/* Modal de cadastro ou edição de transação. */}
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

                        {/* Campos do formulário financeiro. */}
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

                        {/* Botões do modal. */}
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

            {/* Modal de confirmação para excluir transação. */}
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

// Exporta a página para ser usada nas rotas da aplicação.
export default DashboardADMFinanceiros;
