// Importa o CSS module com os estilos desta tela.
import css from "./CadastroServicos.module.css";
// Importa o componente Input padronizado do projeto.
import Input from "../components/Input/Input.jsx";
// Importa hooks do React usados para estado, efeito e funcoes memoizadas.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o input com mascara para campos de valor e porcentagem.
import { IMaskInput } from "react-imask";
// Importa recursos de ../components/Paginacao/Paginacao.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Mantem apenas digitos, virgula, ponto e sinal negativo.
    const somenteNumero = texto.replace(/[^\d,.-]/g, "");

    // Quando tem ponto e virgula, assume ponto como milhar e virgula como decimal.
    if (somenteNumero.includes(",") && somenteNumero.includes(".")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }

    // Tenta executar a operação e permite tratar possíveis falhas.
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
        // Executa esta etapa do fluxo.
        payload.descricao = filtrosBusca.descricao.trim();
    }

    // Se ID foi preenchido, converte para numero e adiciona ao payload.
    if (String(filtrosBusca.id_servico).trim()) {
        // Executa esta etapa do fluxo.
        payload.id_servico = Number(filtrosBusca.id_servico);
    }

    // Se valor foi preenchido, normaliza e adiciona ao payload.
    if (String(filtrosBusca.valor_unitario).trim()) {
        // Executa esta etapa do fluxo.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Atualiza o estado por meio de setMensagem.
            setMensagem(null);
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                    // Executa exibirMensagem nesta etapa do fluxo.
                    exibirMensagem("erro", obterMensagemErro(dados, "Serviço não encontrado."));
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
                // Executa exibirMensagem nesta etapa do fluxo.
                exibirMensagem("sucesso", `${lista.length} serviço(s) encontrado(s).`);
            }
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Não foi possível conectar ao servidor para buscar os serviços.");
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
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) {
            // Atualiza o estado por meio de setPaginaAtual.
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Exibe apenas os servicos da pagina atual.
    const servicosPaginados = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "O nome do serviço e o valor são obrigatórios.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Valida se o valor e positivo.
        if (!valorPositivo(formulario.valor)) {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "O valor do serviço deve ser maior que zero.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Executa exibirMensagem nesta etapa do fluxo.
                exibirMensagem("erro", obterMensagemErro(dados, "Não foi possível cadastrar o serviço."));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Mostra sucesso.
            exibirMensagem("sucesso", dados.mensagem || "Serviço cadastrado com sucesso.");
            // Limpa campos do cadastro.
            limparFormulario();
            // Recarrega a lista sem mostrar mensagem de busca.
            buscarServicos(FILTROS_INICIAIS, false);
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Não foi possível conectar ao servidor para cadastrar o serviço.");
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Valida campos obrigatorios.
        if (!edicao.nome_servico.trim() || !String(edicao.valor).trim()) {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "Por favor, adicione todos os campos.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Valida valor positivo.
        if (!valorPositivo(edicao.valor)) {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "O valor do serviço deve ser maior que zero.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Executa exibirMensagem nesta etapa do fluxo.
                exibirMensagem("erro", obterMensagemErro(dados, "Não foi possível atualizar o serviço."));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Mostra sucesso.
            exibirMensagem("sucesso", dados.mensagem || "Serviço atualizado com sucesso.");
            // Sai do modo de edicao.
            cancelarEdicao();
            // Recarrega a lista mantendo filtros atuais.
            buscarServicos(filtros, false);
        } catch {
            // Mostra erro de conexao.
            exibirMensagem("erro", "Não foi possível conectar ao servidor para atualizar o serviço.");
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
        // Atualiza o estado por meio de setExcluindoId.
        setExcluindoId(servico.id_servico);
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao(null);
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/deletar_servico/${servico.id_servico}`, {
                method: "DELETE",
                headers: criarHeadersAutenticados(),
                credentials: "include"
            });

            // Declara dados para uso neste fluxo.
            const dados = await lerResposta(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok || dados.erro) {
                // Executa exibirMensagem nesta etapa do fluxo.
                exibirMensagem("erro", obterMensagemErro(dados, "Não foi possível excluir o serviço."));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("sucesso", dados.mensagem || "Serviço excluído com sucesso.");
            // Atualiza o estado por meio de setServicos.
            setServicos((listaAtual) => listaAtual.filter((item) => item.id_servico !== servico.id_servico));
            // Verifica esta condição antes de continuar o fluxo.
            if (editandoId === servico.id_servico) {
                // Executa cancelarEdicao nesta etapa do fluxo.
                cancelarEdicao();
            }
        } catch {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "Não foi possível conectar ao servidor para excluir o serviço.");
        } finally {
            // Atualiza o estado por meio de setExcluindoId.
            setExcluindoId(null);
        }
    }

    // Reajusta todos os servicos ou apenas um, dependendo do id selecionado.
    async function reajustarServicos(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Verifica esta condição antes de continuar o fluxo.
        if (!String(reajuste.porcentagem).trim()) {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "A porcentagem de reajuste e obrigatoria.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!valorPositivo(reajuste.porcentagem)) {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "A porcentagem deve ser maior que zero.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara payload para uso neste fluxo.
        const payload = {
            porcentagem: normalizarValor(reajuste.porcentagem)
        };

        // Verifica esta condição antes de continuar o fluxo.
        if (String(reajuste.id_servico).trim()) {
            // Executa esta etapa do fluxo.
            payload.id_servico = Number(reajuste.id_servico);
        }

        // Atualiza o estado por meio de setReajustando.
        setReajustando(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/reajustar_servicos`, {
                method: "PUT",
                headers: criarHeadersJson(),
                credentials: "include",
                body: JSON.stringify(payload)
            });

            // Declara dados para uso neste fluxo.
            const dados = await lerResposta(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok || dados.erro) {
                // Executa exibirMensagem nesta etapa do fluxo.
                exibirMensagem("erro", obterMensagemErro(dados, "Não foi possível reajustar os serviços."));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("sucesso", dados.mensagem || "Serviços reajustados com sucesso.");
            // Atualiza o estado por meio de setReajuste.
            setReajuste(REAJUSTE_INICIAL);
            // Executa buscarServicos nesta etapa do fluxo.
            buscarServicos(filtros, false);
        } catch {
            // Executa exibirMensagem nesta etapa do fluxo.
            exibirMensagem("erro", "Não foi possível conectar ao servidor para reajustar os serviços.");
        } finally {
            // Atualiza o estado por meio de setReajustando.
            setReajustando(false);
        }
    }

    // Declara a função limparFiltros usada por esta página.
    function limparFiltros() {
        // Atualiza o estado por meio de setFiltros.
        setFiltros(FILTROS_INICIAIS);
        // Atualiza o estado por meio de setPaginaAtual.
        setPaginaAtual(1);
        // Executa buscarServicos nesta etapa do fluxo.
        buscarServicos(FILTROS_INICIAIS, false);
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.cabecalho}>
                {/* Exibe o título principal desta página. */}
                <h1 className={css.titulo}>Cadastro de Serviços</h1>
                {/* Exibe esta mensagem ou informação. */}
                <p className={css.subtitulo}>Cadastre, consulte, edite, exclua e reajuste os serviços da oficina.</p>
            </div>

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {mensagem && (
                <div
                   className={`${css.mensagem} ${
                        mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                    }`}
                    role="alert"
                >
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Renderiza o elemento strong nesta parte da página. */}
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Confira os dados"}</strong>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>{mensagem.texto}</span>
                    </div>
                    {/* Exibe este botão de ação. */}
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

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.painel}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.painelCabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título desta seção. */}
                        <h2 className={css.painelTitulo}>Novo serviço</h2>
                        {/* Exibe esta mensagem ou informação. */}
                        <p>Informe o nome e o valor do serviço.</p>
                    </div>
                </div>

                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formularioInterno} onSubmit={salvar}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.duplo}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Nome do Serviço"
                            value={formulario.nome_servico}
                            onChange={(e) => atualizarCampo("nome_servico", e.target.value)}
                            placeholder="Ex: Revisão completa"
                            required
                        />

                        {/* Renderiza o componente Input nesta parte da página. */}
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

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.botoes}>
                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.cancelar} onClick={limparFormulario}>
                            Limpar
                        </button>
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.salvar} disabled={salvando}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {salvando ? "Salvando..." : "Salvar Serviço"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.painel}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.painelCabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título desta seção. */}
                        <h2 className={css.painelTitulo}>Buscar serviços</h2>
                        {/* Exibe esta mensagem ou informação. */}
                        <p>Pesquise por nome do serviço ou valor unitário.</p>
                    </div>
                </div>

                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formularioInterno} onSubmit={(e) => {
                    // Executa preventDefault nesta etapa do fluxo.
                    e.preventDefault();
                    // Atualiza o estado por meio de setPaginaAtual.
                    setPaginaAtual(1);
                    // Executa buscarServicos nesta etapa do fluxo.
                    buscarServicos(filtros);
                }}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.filtros}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Descrição"
                            value={filtros.descricao}
                            onChange={(e) => atualizarFiltro("descricao", e.target.value)}
                            placeholder="Ex: alinhamento"
                        />

                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Serviço</span>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.select}
                                value={filtros.id_servico}
                                onChange={(e) => atualizarFiltro("id_servico", e.target.value)}
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="">Todos os serviços</option>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>

                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Valor unitário"
                            {...MASCARA_VALOR}
                            value={filtros.valor_unitario}
                            onAccept={(valor) => atualizarFiltro("valor_unitario", String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                        />
                    </div> 

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.botoes}>
                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.cancelar} onClick={limparFiltros}>
                            Limpar busca
                        </button>
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.salvar} disabled={carregando}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {carregando ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.painel}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.painelCabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título desta seção. */}
                        <h2 className={css.painelTitulo}>Reajustar valores</h2>
                        {/* Exibe esta mensagem ou informação. */}
                        <p>Informe apenas a porcentagem para reajustar todos, ou escolha um serviço específico.</p>
                    </div>
                </div> 

                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formularioInterno} onSubmit={reajustarServicos}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.duplo}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Porcentagem"
                            {...MASCARA_PORCENTAGEM}
                            value={reajuste.porcentagem}
                            onAccept={(valor) => atualizarReajuste("porcentagem", String(valor))}
                            placeholder="Ex: 10"
                            inputMode="decimal"
                            required
                        />

                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Serviço especifico</span>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.select}
                                value={reajuste.id_servico}
                                onChange={(e) => atualizarReajuste("id_servico", e.target.value)}
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="">Todos os serviços</option>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.botoes}>
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.salvar} disabled={reajustando}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {reajustando ? "Reajustando..." : "Aplicar reajuste"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {editandoId && (
                <section className={css.painel}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.painelCabecalho}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div>
                            {/* Exibe o título desta seção. */}
                            <h2 className={css.painelTitulo}>Editar serviço #{editandoId}</h2>
                            {/* Exibe esta mensagem ou informação. */}
                            <p>Atualize as informações do serviço selecionado.</p>
                        </div>
                    </div>

                    {/* Agrupa os campos e ações deste formulário. */}
                    <form className={css.formularioInterno} onSubmit={atualizarServico}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Nome do Serviço"
                                value={edicao.nome_servico}
                                onChange={(e) => setEdicao((atual) => ({ ...atual, nome_servico: e.target.value }))}
                                required
                            />

                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Valor"
                                {...MASCARA_VALOR}
                                value={edicao.valor}
                                onAccept={(valor) => setEdicao((atual) => ({ ...atual, valor: String(valor) }))}
                                inputMode="decimal"
                                required
                            />
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.botoes}>
                            {/* Exibe este botão de ação. */}
                            <button type="button" className={css.cancelar} onClick={cancelarEdicao}>
                                Cancelar
                            </button>
                            {/* Exibe este botão de ação. */}
                            <button type="submit" className={css.salvar} disabled={salvando}>
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {salvando ? "Atualizando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.painel}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.painelCabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título desta seção. */}
                        <h2 className={css.painelTitulo}>Serviços cadastrados</h2>
                        {/* Exibe esta mensagem ou informação. */}
                        <p>{servicos.length} registro(s) carregado(s).</p>
                    </div>
                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        className={css.botaoSecundario}
                        onClick={() => {
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                            // Executa buscarServicos nesta etapa do fluxo.
                            buscarServicos(FILTROS_INICIAIS);
                        }}
                    >
                        Atualizar lista
                    </button>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.tabelaArea}>
                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                    {servicos.length > 0 ? (
                        <table className={css.tabela}>
                            {/* Renderiza o elemento thead nesta parte da página. */}
                            <thead>
                                {/* Renderiza o elemento tr nesta parte da página. */}
                                <tr>
                                    {/* Renderiza o elemento th nesta parte da página. */}
                                    <th>ID</th>
                                    {/* Renderiza o elemento th nesta parte da página. */}
                                    <th>Serviço</th>
                                    {/* Renderiza o elemento th nesta parte da página. */}
                                    <th>Valor</th>
                                    {/* Renderiza o elemento th nesta parte da página. */}
                                    <th>Reajuste</th>
                                    {/* Renderiza o elemento th nesta parte da página. */}
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            {/* Renderiza o elemento tbody nesta parte da página. */}
                            <tbody>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {servicosPaginados.map((servico) => (
                                    <tr key={servico.id_servico}>
                                        {/* Renderiza o elemento td nesta parte da página. */}
                                        <td data-label="ID">{servico.id_servico}</td>
                                        {/* Renderiza o elemento td nesta parte da página. */}
                                        <td data-label="Serviço">{servico.descricao}</td>
                                        {/* Renderiza o elemento td nesta parte da página. */}
                                        <td data-label="Valor">{formatarMoeda(servico.valor_unitario)}</td>
                                        {/* Renderiza o elemento td nesta parte da página. */}
                                        <td data-label="Reajuste">{Number(servico.valor_porcentagem || 0).toFixed(2)}%</td>
                                        {/* Renderiza o elemento td nesta parte da página. */}
                                        <td data-label="Ações">
                                            {/* Agrupa os elementos desta parte da interface. */}
                                            <div className={css.acoesLinha}>
                                                {/* Exibe este botão de ação. */}
                                                <button type="button" onClick={() => iniciarEdicao(servico)}>
                                                    Editar
                                                </button>
                                                {/* Exibe este botão de ação. */}
                                                <button
                                                    type="button"
                                                    className={css.botaoPerigo}
                                                    onClick={() => pedirConfirmacaoExclusao(servico)}
                                                    disabled={excluindoId === servico.id_servico}
                                                >
                                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
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
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {carregando ? "Carregando serviços..." : "Nenhum serviço encontrado."}
                        </div>
                    )}
                </div>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregando && servicos.length > 0 && (
                    <div className={css.paginacaoArea}>
                        {/* Renderiza o componente Paginacao nesta parte da página. */}
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={servicos.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </section>

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {confirmacao && (
                <div className={css.modalFundo} role="presentation" onClick={cancelarConfirmacao}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div
                        className={css.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-confirmacao"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalIcone}>!</div>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div>
                            {/* Exibe o título desta seção. */}
                            <h2 id="titulo-confirmacao" className={css.modalTitulo}>
                                Excluir serviço
                            </h2>
                            {/* Exibe esta mensagem ou informação. */}
                            <p className={css.modalTexto}>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                Deseja excluir o serviço <strong>{confirmacao.descricao}</strong>?
                            </p>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalAcoes}>
                            {/* Exibe este botão de ação. */}
                            <button type="button" className={css.modalCancelar} onClick={cancelarConfirmacao}>
                                Cancelar
                            </button>
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                className={css.modalConfirmar}
                                onClick={() => deletarServico(confirmacao)}
                                disabled={excluindoId === confirmacao.id_servico}
                            >
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {excluindoId === confirmacao.id_servico ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CadastroServicos;
