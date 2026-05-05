// Importa o CSS module com os estilos desta tela.
import css from "./CadastroServicos.module.css";
// Importa o componente Input padronizado do projeto.
import Input from "../components/Input/Input.jsx";
// Importa hooks do React usados para estado, efeito e funcoes memoizadas.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o input com mascara para campos de valor e porcentagem.
import { IMaskInput } from "react-imask";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Estado inicial do formulario de cadastro de servico.
const FORMULARIO_INICIAL = {
    // Nome/descricao do servico.
    nome_servico: "",
    // Valor cobrado pelo servico.
    valor: ""
};

// Estado inicial dos campos usados para filtrar a listagem.
const FILTROS_INICIAIS = {
    // Filtro por descricao/nome do servico.
    descricao: "",
    // Filtro por ID do servico.
    id_servico: "",
    // Filtro por valor unitario.
    valor_unitario: ""
};

// Estado inicial do formulario de reajuste.
const REAJUSTE_INICIAL = {
    // Porcentagem que sera aplicada no reajuste.
    porcentagem: "",
    // ID opcional; vazio significa reajustar todos os servicos.
    id_servico: ""
};

// Configuracao de mascara para campos monetarios.
const MASCARA_VALOR = {
    // Usa IMaskInput no lugar do input normal.
    as: IMaskInput,
    // Aceita numeros.
    mask: Number,
    // Permite duas casas decimais.
    scale: 2,
    // Usa ponto como separador de milhar.
    thousandsSeparator: ".",
    // Usa virgula como separador decimal.
    radix: ",",
    // Aceita ponto digitado como separador decimal tambem.
    mapToRadix: ["."],
    // Normaliza zeros extras.
    normalizeZeros: true,
    // Completa as casas decimais com zero.
    padFractionalZeros: true,
    // Entrega o valor sem mascara para o estado.
    unmask: true
};

// Configuracao de mascara para o campo de porcentagem.
const MASCARA_PORCENTAGEM = {
    // Usa IMaskInput no lugar do input normal.
    as: IMaskInput,
    // Aceita numeros.
    mask: Number,
    // Permite duas casas decimais.
    scale: 2,
    // Usa virgula como separador decimal.
    radix: ",",
    // Aceita ponto como separador decimal.
    mapToRadix: ["."],
    // Normaliza zeros extras.
    normalizeZeros: true,
    // Entrega o valor sem mascara para o estado.
    unmask: true
};

// Monta headers para rotas que recebem JSON.
function criarHeadersJson() {
    // Busca o token salvo depois do login.
    const token = localStorage.getItem("access_token");

    // Retorna Content-Type e Authorization quando houver token.
    return {
        // Informa ao backend que o corpo e JSON.
        "Content-Type": "application/json",
        // Adiciona Bearer token apenas se existir.
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

// Monta headers autenticados para rotas com FormData.
function criarHeadersAutenticados() {
    // Busca o token salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Retorna Authorization quando existir token; FormData nao precisa Content-Type manual.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Normaliza valores digitados em moeda para formato numerico aceito pelo backend.
function normalizarValor(valor) {
    // Converte para texto e remove espacos das pontas.
    const texto = String(valor ?? "").trim();

    // Se nao existe valor, retorna vazio.
    if (!texto) {
        return "";
    }

    // Mantem apenas digitos, virgula, ponto e sinal negativo.
    const somenteNumero = texto.replace(/[^\d,.-]/g, "");

    // Quando tem ponto e virgula, assume ponto como milhar e virgula como decimal.
    if (somenteNumero.includes(",") && somenteNumero.includes(".")) {
        return somenteNumero.replace(/\./g, "").replace(",", ".");
    }

    // Quando tem apenas virgula, troca por ponto para enviar como decimal.
    return somenteNumero.replace(",", ".");
}

// Verifica se um valor representa numero positivo.
function valorPositivo(valor) {
    // Converte o valor normalizado para numero.
    const numero = Number(normalizarValor(valor));
    // Retorna true somente para numero valido maior que zero.
    return Number.isFinite(numero) && numero > 0;
}

// Padroniza um servico vindo da API para o formato usado pela tela.
function normalizarServico(servico) {
    // Aceita diferentes nomes de ID que a API pode devolver.
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id;
    // Aceita diferentes nomes de descricao que a API pode devolver.
    const nome = servico.descricao ?? servico.nome_servico ?? servico.NOME_SERVICO ?? servico.nome ?? "";
    // Aceita diferentes nomes de valor que a API pode devolver.
    const valor = servico.valor_unitario ?? servico.valor ?? servico.VALOR ?? 0;
    // Aceita diferentes nomes para a porcentagem de reajuste.
    const porcentagem = servico.valor_porcentagem ?? servico.porcentagem ?? 0;

    // Retorna o objeto no formato unico usado pelo front.
    return {
        // ID padronizado.
        id_servico: id,
        // Nome/descricao padronizado.
        descricao: nome,
        // Valor padronizado.
        valor_unitario: valor,
        // Porcentagem padronizada.
        valor_porcentagem: porcentagem
    };
}

// Ordena servicos pelo ID em ordem crescente.
function ordenarServicosPorId(lista) {
    // Copia a lista antes de ordenar para nao alterar o array original.
    return [...lista].sort((servicoA, servicoB) => Number(servicoA.id_servico) - Number(servicoB.id_servico));
}

// Le a resposta da API mesmo quando ela vem vazia ou sem JSON valido.
async function lerResposta(resposta) {
    // Le primeiro como texto para evitar erro com corpo vazio.
    const texto = await resposta.text();

    // Se nao veio corpo, retorna objeto vazio.
    if (!texto) {
        return {};
    }

    try {
        // Tenta converter o texto em JSON.
        return JSON.parse(texto);
    } catch {
        // Se nao for JSON valido, retorna objeto vazio.
        return {};
    }
}

// Escolhe a melhor mensagem de erro disponivel.
function obterMensagemErro(dados, fallback) {
    // Prioriza erro, depois mensagem, depois texto padrao.
    return dados.erro || dados.mensagem || fallback;
}

// Monta o corpo JSON da busca removendo filtros vazios.
function montarPayloadBusca(filtrosBusca) {
    // Comeca com objeto vazio.
    const payload = {};

    // Se descricao foi preenchida, adiciona ao payload.
    if (String(filtrosBusca.descricao).trim()) {
        payload.descricao = filtrosBusca.descricao.trim();
    }

    // Se ID foi preenchido, converte para numero e adiciona ao payload.
    if (String(filtrosBusca.id_servico).trim()) {
        payload.id_servico = Number(filtrosBusca.id_servico);
    }

    // Se valor foi preenchido, normaliza e adiciona ao payload.
    if (String(filtrosBusca.valor_unitario).trim()) {
        payload.valor_unitario = normalizarValor(filtrosBusca.valor_unitario);
    }

    // Retorna apenas os filtros realmente preenchidos.
    return payload;
}

// Formata valores como moeda brasileira.
function formatarMoeda(valor) {
    // Converte o valor recebido para numero.
    const numero = Number(valor);

    // Se nao for numero valido, retorna zero formatado.
    if (!Number.isFinite(numero)) {
        return "R$ 0,00";
    }

    // Formata o numero em BRL no padrao brasileiro.
    return new Intl.NumberFormat("pt-BR", {
        // Define formato monetario.
        style: "currency",
        // Define real brasileiro como moeda.
        currency: "BRL"
    }).format(numero);
}

// Tela de cadastro, busca, edicao, exclusao e reajuste de servicos.
function CadastroServicos({ API }) {
    // Guarda os dados do formulario de novo servico.
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
    // Guarda os filtros da busca.
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    // Guarda os dados do formulario de reajuste.
    const [reajuste, setReajuste] = useState(REAJUSTE_INICIAL);
    // Guarda a lista de servicos exibida na tabela.
    const [servicos, setServicos] = useState([]);
    // Guarda a pagina atual da tabela.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Guarda mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);
   // Controla carregamento da busca/listagem.
    const [carregando, setCarregando] = useState(false);
    // Controla carregamento dos botoes de salvar/atualizar.
    const [salvando, setSalvando] = useState(false);
    // Controla carregamento do botao de reajuste.
    const [reajustando, setReajustando] = useState(false);
    // Guarda o ID do servico que esta sendo excluido.
    const [excluindoId, setExcluindoId] = useState(null);
    // Guarda o ID do servico em edicao; null significa nenhum.
    const [editandoId, setEditandoId] = useState(null);
    // Guarda os campos do formulario de edicao.
    const [edicao, setEdicao] = useState(FORMULARIO_INICIAL);
    // Guarda o servico selecionado no modal de confirmacao.
    const [confirmacao, setConfirmacao] = useState(null);

    // Centraliza a criacao de mensagens visuais.
    const exibirMensagem = useCallback((tipo, texto) => {
        // Salva tipo e texto no estado da mensagem.
        setMensagem({ tipo, texto });
    }, []);

    // Busca os servicos aplicando filtros de descricao, id ou valor.
    const buscarServicos = useCallback(async (filtrosBusca = FILTROS_INICIAIS, mostrarMensagem = true) => {
        // Liga o carregamento da listagem.
        setCarregando(true);
        // Limpa a mensagem antiga quando a busca deve avisar o usuario.
        if (mostrarMensagem) {
            setMensagem(null);
        }

        try {
            // Chama a rota de busca de servicos.
            const resposta = await fetch(`${API}/buscar_servico`, {
                // Backend espera POST para buscar com filtros.
                method: "POST",
                // Envia Content-Type e token.
                headers: criarHeadersJson(),
                // Mantem cookies por compatibilidade com a autenticacao.
                credentials: "include",
                // Envia os filtros preenchidos em JSON.
                body: JSON.stringify(montarPayloadBusca(filtrosBusca))
            });

            // Le a resposta mesmo se vier vazia.
            const dados = await lerResposta(resposta);

            // Trata erro HTTP ou erro informado no corpo.
            if (!resposta.ok || dados.erro) {
                // Limpa lista para nao mostrar resultado antigo.
                setServicos([]);
                // Mostra mensagem se a busca pediu mensagem ou se nao for 404.
                if (mostrarMensagem || resposta.status !== 404) {
                    exibirMensagem("erro", obterMensagemErro(dados, "Servico nao encontrado."));
                }
                // Interrompe a funcao.
                return;
            }

            // Normaliza e ordena a lista quando a API retorna servicos.
            const lista = Array.isArray(dados.servicos)
                ? ordenarServicosPorId(dados.servicos.map(normalizarServico))
                : [];
            // Salva a lista na tela.
            setServicos(lista);

            // Opcionalmente mostra quantos resultados foram encontrados.
            if (mostrarMensagem) {
                exibirMensagem("sucesso", `${lista.length} servico(s) encontrado(s).`);
            }
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para buscar os servicos.");
        } finally {
            // Desliga o carregamento ao final.
            setCarregando(false);
        }
    }, [API, exibirMensagem]); // Recria a funcao se API ou helper de mensagem mudarem.

    // Carrega todos os servicos quando a tela abre.
    useEffect(() => {
        // Busca sem filtros e sem exibir mensagem inicial.
        buscarServicos(FILTROS_INICIAIS, false);
    }, [buscarServicos]); // Executa novamente se a funcao de busca mudar.

    // Total de paginas considerando os servicos carregados.
    const totalPaginas = Math.max(1, Math.ceil(servicos.length / ITENS_POR_PAGINA));

    // Mantem a pagina atual valida quando a lista muda de tamanho.
    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Exibe apenas os servicos da pagina atual.
    const servicosPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return servicos.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [servicos, paginaAtual]);

    // Atualiza um campo do formulario de cadastro.
    function atualizarCampo(campo, valor) {
        // Mantem os campos atuais e troca apenas o campo recebido.
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
    }

    // Atualiza um campo dos filtros de busca.
    function atualizarFiltro(campo, valor) {
        // Mantem os filtros atuais e troca apenas o filtro recebido.
        setFiltros((atual) => ({ ...atual, [campo]: valor }));
    }

    // Atualiza um campo do formulario de reajuste.
    function atualizarReajuste(campo, valor) {
        // Mantem o reajuste atual e troca apenas o campo recebido.
        setReajuste((atual) => ({ ...atual, [campo]: valor }));
    }

    // Limpa o formulario de cadastro.
    function limparFormulario() {
        // Volta para os valores iniciais.
        setFormulario(FORMULARIO_INICIAL);
    }

    // Cadastra um novo servico usando FormData, como a API espera.
    async function salvar(e) {
        // Impede refresh da pagina.
        e.preventDefault();
        // Limpa mensagem antiga.
        setMensagem(null);

        // Valida preenchimento obrigatorio.
        if (!formulario.nome_servico.trim() || !String(formulario.valor).trim()) {
            exibirMensagem("erro", "O nome do servico e o valor sao obrigatorios.");
            return;
        }

        // Valida se o valor e positivo.
        if (!valorPositivo(formulario.valor)) {
            exibirMensagem("erro", "O valor do servico deve ser maior que zero.");
            return;
        }

        // Cria FormData porque a API Flask le request.form.
        const formData = new FormData();
        // Adiciona nome sem espacos extras.
        formData.append("nome_servico", formulario.nome_servico.trim());
        // Adiciona valor normalizado para decimal com ponto.
        formData.append("valor", normalizarValor(formulario.valor));

        // Liga carregamento do botao salvar.
        setSalvando(true);

        try {
            // Chama a rota de cadastro de servico.
            const resposta = await fetch(`${API}/cadastrar_servico`, {
                // Cadastro usa POST.
                method: "POST",
                // Envia token sem Content-Type manual por ser FormData.
                headers: criarHeadersAutenticados(),
                // Mantem cookies.
                credentials: "include",
                // Envia os dados do formulario.
                body: formData
            });

            // Le a resposta da API.
            const dados = await lerResposta(resposta);

            // Trata erro HTTP ou erro no corpo.
            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel cadastrar o servico."));
                return;
            }

            // Mostra sucesso.
            exibirMensagem("sucesso", dados.mensagem || "Servico cadastrado com sucesso.");
            // Limpa campos do cadastro.
            limparFormulario();
            // Recarrega a lista sem mostrar mensagem de busca.
            buscarServicos(FILTROS_INICIAIS, false);
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para cadastrar o servico.");
        } finally {
            // Desliga carregamento do botao salvar.
            setSalvando(false);
        }
    }

    // Prepara um servico para edicao.
    function iniciarEdicao(servico) {
        // Guarda o ID que esta sendo editado.
        setEditandoId(servico.id_servico);
        // Preenche o formulario de edicao com os dados atuais.
        setEdicao({
            // Nome atual do servico.
            nome_servico: servico.descricao || "",
            // Valor atual convertido para texto.
            valor: String(servico.valor_unitario ?? "")
        });
        // Limpa mensagem antiga.
        setMensagem(null);
    }

    // Cancela a edicao atual.
    function cancelarEdicao() {
        // Remove ID em edicao.
        setEditandoId(null);
        // Limpa formulario de edicao.
        setEdicao(FORMULARIO_INICIAL);
    }

    // Atualiza nome/valor do servico; a API registra historico se o valor mudar.
    async function atualizarServico(e) {
        // Impede refresh da pagina.
        e.preventDefault();

        // Se nao existe servico em edicao, nao faz nada.
        if (!editandoId) {
            return;
        }

        // Valida campos obrigatorios.
        if (!edicao.nome_servico.trim() || !String(edicao.valor).trim()) {
            exibirMensagem("erro", "Por favor, adicione todos os campos.");
            return;
        }

        // Valida valor positivo.
        if (!valorPositivo(edicao.valor)) {
            exibirMensagem("erro", "O valor do servico deve ser maior que zero.");
            return;
        }

        // Monta FormData para a rota Flask.
        const formData = new FormData();
        // Envia nome atualizado.
        formData.append("nome_servico", edicao.nome_servico.trim());
        // Envia valor atualizado normalizado.
        formData.append("valor", normalizarValor(edicao.valor));
        // Liga carregamento do botao de salvar edicao.
        setSalvando(true);

        try {
            // Chama a rota de atualizar servico.
            const resposta = await fetch(`${API}/atualizar_servico/${editandoId}`, {
                // Atualizacao usa PUT.
                method: "PUT",
                // Envia token autenticado.
                headers: criarHeadersAutenticados(),
                // Mantem cookies.
                credentials: "include",
                // Envia dados do formulario.
                body: formData
            });

            // Le resposta da API.
            const dados = await lerResposta(resposta);

            // Trata erro da API.
            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel atualizar o servico."));
                return;
            }

            // Mostra sucesso.
            exibirMensagem("sucesso", dados.mensagem || "Servico atualizado com sucesso.");
            // Sai do modo de edicao.
            cancelarEdicao();
            // Recarrega a lista mantendo filtros atuais.
            buscarServicos(filtros, false);
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para atualizar o servico.");
        } finally {
            // Desliga carregamento do botao.
            setSalvando(false);
        }
    }

    // Abre modal de confirmacao para exclusao.
    function pedirConfirmacaoExclusao(servico) {
        // Guarda o servico escolhido no estado.
        setConfirmacao(servico);
    }

    // Fecha modal de confirmacao.
    function cancelarConfirmacao() {
        // Remove o servico selecionado.
        setConfirmacao(null);
    }

    // Exclui o servico; o backend deve bloquear se ele estiver em manutencoes.
    async function deletarServico(servico) {
        setExcluindoId(servico.id_servico);
        setConfirmacao(null);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/deletar_servico/${servico.id_servico}`, {
                method: "DELETE",
                headers: criarHeadersAutenticados(),
                credentials: "include"
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel deletar o servico."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servico deletado com sucesso.");
            setServicos((listaAtual) => listaAtual.filter((item) => item.id_servico !== servico.id_servico));
            if (editandoId === servico.id_servico) {
                cancelarEdicao();
            }
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para deletar o servico.");
        } finally {
            setExcluindoId(null);
        }
    }

    // Reajusta todos os servicos ou apenas um, dependendo do id selecionado.
    async function reajustarServicos(e) {
        e.preventDefault();
        setMensagem(null);

        if (!String(reajuste.porcentagem).trim()) {
            exibirMensagem("erro", "A porcentagem de reajuste e obrigatoria.");
            return;
        }

        if (!valorPositivo(reajuste.porcentagem)) {
            exibirMensagem("erro", "A porcentagem deve ser maior que zero.");
            return;
        }

        const payload = {
            porcentagem: normalizarValor(reajuste.porcentagem)
        };

        if (String(reajuste.id_servico).trim()) {
            payload.id_servico = Number(reajuste.id_servico);
        }

        setReajustando(true);

        try {
            const resposta = await fetch(`${API}/reajustar_servicos`, {
                method: "PUT",
                headers: criarHeadersJson(),
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel reajustar os servicos."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servicos reajustados com sucesso.");
            setReajuste(REAJUSTE_INICIAL);
            buscarServicos(filtros, false);
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para reajustar os servicos.");
        } finally {
            setReajustando(false);
        }
    }

    function limparFiltros() {
        setFiltros(FILTROS_INICIAIS);
        setPaginaAtual(1);
        buscarServicos(FILTROS_INICIAIS, false);
    }

    return (
        <main className={css.container}>
            <div className={css.cabecalho}>
                <h1 className={css.titulo}>Cadastro de Serviços</h1>
                <p className={css.subtitulo}>Cadastre, consulte, edite, exclua e reajuste os serviços da oficina.</p>
            </div>

            {mensagem && (
                <div
                   className={`${css.mensagem} ${
                        mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                    }`}
                    role="alert"
                >
                    <div>
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Confira os dados"}</strong>
                        <span>{mensagem.texto}</span>
                    </div>
                    <button
                        type="button"
                        className={css.mensagem_fechar}
                        onClick={() => setMensagem(null)}
                        aria-label="Fechar mensagem"
                    >
                        x
                    </button>
                </div>
            )}

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Novo serviço</h2>
                        <p>Informe o nome e o valor do serviço.</p>
                    </div>
                </div>

                <form className={css.formularioInterno} onSubmit={salvar}>
                    <div className={css.duplo}>
                        <Input
                            label="Nome do Serviço"
                            value={formulario.nome_servico}
                            onChange={(e) => atualizarCampo("nome_servico", e.target.value)}
                            placeholder="Ex: Revisao completa"
                            required
                        />

                        <Input
                            label="Valor"
                            {...MASCARA_VALOR}
                            value={formulario.valor}
                            onAccept={(valor) => atualizarCampo("valor", String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                            required
                        />
                    </div> 

                    <div className={css.botoes}>
                        <button type="button" className={css.cancelar} onClick={limparFormulario}>
                            Limpar
                        </button>
                        <button type="submit" className={css.salvar} disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar Serviço"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Buscar serviços</h2>
                        <p>Pesquise por nome do serviço ou valor unitário.</p>
                    </div>
                </div>

                <form className={css.formularioInterno} onSubmit={(e) => {
                    e.preventDefault();
                    setPaginaAtual(1);
                    buscarServicos(filtros);
                }}>
                    <div className={css.filtros}>
                        <Input
                            label="Descricao"
                            value={filtros.descricao}
                            onChange={(e) => atualizarFiltro("descricao", e.target.value)}
                            placeholder="Ex: alinhamento"
                        />

                        <label className={css.campo}>
                            <span>Serviço</span>
                            <select
                                className={css.select}
                                value={filtros.id_servico}
                                onChange={(e) => atualizarFiltro("id_servico", e.target.value)}
                            >
                                <option value="">Todos os serviços</option>
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <Input
                            label="Valor unitário"
                            {...MASCARA_VALOR}
                            value={filtros.valor_unitario}
                            onAccept={(valor) => atualizarFiltro("valor_unitario", String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                        />
                    </div> 

                    <div className={css.botoes}>
                        <button type="button" className={css.cancelar} onClick={limparFiltros}>
                            Limpar busca
                        </button>
                        <button type="submit" className={css.salvar} disabled={carregando}>
                            {carregando ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Reajustar valores</h2>
                        <p>Informe apenas a porcentagem para reajustar todos, ou escolha um serviço específico.</p>
                    </div>
                </div> 

                <form className={css.formularioInterno} onSubmit={reajustarServicos}>
                    <div className={css.duplo}>
                        <Input
                            label="Porcentagem"
                            {...MASCARA_PORCENTAGEM}
                            value={reajuste.porcentagem}
                            onAccept={(valor) => atualizarReajuste("porcentagem", String(valor))}
                            placeholder="Ex: 10"
                            inputMode="decimal"
                            required
                        />

                        <label className={css.campo}>
                            <span>Serviço especifico</span>
                            <select
                                className={css.select}
                                value={reajuste.id_servico}
                                onChange={(e) => atualizarReajuste("id_servico", e.target.value)}
                            >
                                <option value="">Todos os serviços</option>
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={css.botoes}>
                        <button type="submit" className={css.salvar} disabled={reajustando}>
                            {reajustando ? "Reajustando..." : "Aplicar reajuste"}
                        </button>
                    </div>
                </form>
            </section>

            {editandoId && (
                <section className={css.painel}>
                    <div className={css.painelCabecalho}>
                        <div>
                            <h2 className={css.painelTitulo}>Editar serviço #{editandoId}</h2>
                            <p>Atualize as informações do serviço selecionado.</p>
                        </div>
                    </div>

                    <form className={css.formularioInterno} onSubmit={atualizarServico}>
                        <div className={css.duplo}>
                            <Input
                                label="Nome do Serviço"
                                value={edicao.nome_servico}
                                onChange={(e) => setEdicao((atual) => ({ ...atual, nome_servico: e.target.value }))}
                                required
                            />

                            <Input
                                label="Valor"
                                {...MASCARA_VALOR}
                                value={edicao.valor}
                                onAccept={(valor) => setEdicao((atual) => ({ ...atual, valor: String(valor) }))}
                                inputMode="decimal"
                                required
                            />
                        </div>

                        <div className={css.botoes}>
                            <button type="button" className={css.cancelar} onClick={cancelarEdicao}>
                                Cancelar
                            </button>
                            <button type="submit" className={css.salvar} disabled={salvando}>
                                {salvando ? "Atualizando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Serviços cadastrados</h2>
                        <p>{servicos.length} registro(s) carregado(s).</p>
                    </div>
                    <button
                        type="button"
                        className={css.botaoSecundario}
                        onClick={() => {
                            setPaginaAtual(1);
                            buscarServicos(FILTROS_INICIAIS);
                        }}
                    >
                        Atualizar lista
                    </button>
                </div>

                <div className={css.tabelaArea}>
                    {servicos.length > 0 ? (
                        <table className={css.tabela}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Serviço</th>
                                    <th>Valor</th>
                                    <th>Reajuste</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicosPaginados.map((servico) => (
                                    <tr key={servico.id_servico}>
                                        <td data-label="ID">{servico.id_servico}</td>
                                        <td data-label="Serviço">{servico.descricao}</td>
                                        <td data-label="Valor">{formatarMoeda(servico.valor_unitario)}</td>
                                        <td data-label="Reajuste">{Number(servico.valor_porcentagem || 0).toFixed(2)}%</td>
                                        <td data-label="Ações">
                                            <div className={css.acoesLinha}>
                                                <button type="button" onClick={() => iniciarEdicao(servico)}>
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className={css.botaoPerigo}
                                                    onClick={() => pedirConfirmacaoExclusao(servico)}
                                                    disabled={excluindoId === servico.id_servico}
                                                >
                                                    {excluindoId === servico.id_servico ? "Excluindo..." : "Excluir"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={css.vazio}>
                            {carregando ? "Carregando serviços..." : "Nenhum serviço encontrado."}
                        </div>
                    )}
                </div>

                {!carregando && servicos.length > 0 && (
                    <div className={css.paginacaoArea}>
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={servicos.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </section>

            {confirmacao && (
                <div className={css.modalFundo} role="presentation" onClick={cancelarConfirmacao}>
                    <div
                        className={css.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-confirmacao"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={css.modalIcone}>!</div>
                        <div>
                            <h2 id="titulo-confirmacao" className={css.modalTitulo}>
                                Excluir serviço
                            </h2>
                            <p className={css.modalTexto}>
                                Deseja deletar o serviço <strong>{confirmacao.descricao}</strong>?
                            </p>
                        </div>

                        <div className={css.modalAcoes}>
                            <button type="button" className={css.modalCancelar} onClick={cancelarConfirmacao}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={css.modalConfirmar}
                                onClick={() => deletarServico(confirmacao)}
                                disabled={excluindoId === confirmacao.id_servico}
                            >
                                {excluindoId === confirmacao.id_servico ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default CadastroServicos;