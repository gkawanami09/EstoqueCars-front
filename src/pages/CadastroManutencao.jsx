// Importa hooks do React usados para estado, carregamento da tela e calculos.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa os estilos dessa pagina.
import css from "./CadastroManutencao.module.css";
// Importa o modal usado para confirmar exclusoes.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao.jsx";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Cria o formulario vazio de manutencao.
const formularioInicial = () => ({
    // Null significa que esta criando, nao editando.
    id_manutencao: null,
    // ID do veiculo escolhido no autocomplete.
    id_veiculo: "",
    // Data que vem do input datetime-local.
    data_manutencao: "",
    // Lista inicial com um servico vazio.
    servicos: [{ id_servico: "", quantidade: "1" }]
});

// Objeto usado para limpar o formulario de item.
const itemInicial = {
    // ID do servico escolhido para adicionar em uma manutencao.
    id_servico: "",
    // Quantidade padrao do servico.
    quantidade: "1"
};

// Extrai uma lista mesmo quando a API muda o nome da chave.
function extrairLista(dados, chaves) {
    // Se a propria resposta ja for uma lista, retorna ela.
    if (Array.isArray(dados)) {
        return dados;
    }

    // Testa cada nome de chave possivel enviado pela API.
    for (const chave of chaves) {
        // Se a chave existir e for lista, retorna essa lista.
        if (Array.isArray(dados?.[chave])) {
            return dados[chave];
        }
    }

    // Se nao achou lista nenhuma, retorna lista vazia.
    return [];
}

// Padroniza o formato de servico vindo da API.
function normalizarServico(servico) {
    // Aceita varios nomes possiveis para o ID do servico.
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id ?? servico.idServico;
    // Aceita varios nomes possiveis para o nome/descricao do servico.
    const nome =
        servico.nome_servico ??
        servico.NOME_SERVICO ??
        servico.descricao ??
        servico.nome ??
        servico.nomeServico ??
        servico.servico ??
        `Serviço ${id || ""}`;
    // Aceita varios nomes possiveis para o valor do servico.
    const valor = servico.valor ?? servico.VALOR ?? servico.preco ?? servico.valor_unitario ?? 0;

    // Retorna sempre no formato que a tela entende.
    return {
        id: String(id ?? ""),
        nome: String(nome || "Serviço"),
        valor: Number(valor || 0)
    };
}

// Padroniza o formato de veiculo vindo da API.
function normalizarVeiculo(veiculo) {
    // Aceita varios nomes possiveis para o ID do veiculo.
    const id = veiculo.id_veiculo ?? veiculo.ID_VEICULO ?? veiculo.id ?? veiculo.id_carro;
    // Pega a marca independente de como a API nomeou.
    const marca = veiculo.marca ?? veiculo.MARCA ?? "";
    // Pega o modelo independente de como a API nomeou.
    const modelo = veiculo.modelo ?? veiculo.MODELO ?? veiculo.nome ?? "";
    // Pega a placa independente de como a API nomeou.
    const placa = veiculo.placa ?? veiculo.PLACA ?? "";

    // Retorna o veiculo pronto para aparecer no autocomplete.
    return {
        id: String(id ?? ""),
        marca,
        modelo,
        placa,
        label: [placa, modelo, marca].filter(Boolean).join(" - ") || `Veículo ${id || ""}`
    };
}

// Padroniza o formato de manutencao vindo da API.
function normalizarManutencao(manutencao) {
    // Aceita varios nomes possiveis para o ID da manutencao.
    const id = manutencao.id_manutencao ?? manutencao.ID_MANUTENCAO ?? manutencao.id;
    // Aceita a lista de servicos com os nomes mais usados no backend.
    const servicosRealizados = manutencao.servicos_realizados ?? manutencao.servicos ?? [];

    // Retorna a manutencao no formato usado pela tabela.
    return {
        id_manutencao: id,
        marca: manutencao.marca ?? manutencao.MARCA ?? "",
        modelo: manutencao.modelo ?? manutencao.MODELO ?? "",
        placa: manutencao.placa ?? manutencao.PLACA ?? "",
        data: manutencao.data ?? manutencao.data_manutencao ?? manutencao.DATA_MANUTENCAO ?? "",
        valor_total: Number(manutencao.valor_total ?? manutencao.VALOR_TOTAL ?? 0),
        servicos_realizados: Array.isArray(servicosRealizados) ? servicosRealizados : []
    };
}

// Padroniza um item da manutencao vindo da API.
function normalizarItem(item) {
    // ID do item da tabela ITEM_MANUTENCAO.
    const id = item.id_item ?? item.ID_ITEM ?? item.id;
    // Quantidade do servico dentro daquela manutencao.
    const quantidade = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
    // Valor cobrado quando o item foi registrado.
    const valorUnitario = Number(item.valor_unitario ?? item.valor_cobrado ?? item.VALOR_COBRADO ?? 0);

    // Retorna o item ja com total calculado.
    return {
        id_item: id,
        id_manutencao: item.id_manutencao ?? item.ID_MANUTENCAO,
        id_servico: item.id_servico ?? item.ID_SERVICO,
        nome_servico: item.nome_servico ?? item.servico ?? item.NOME_SERVICO ?? "Serviço",
        quantidade,
        valor_unitario: valorUnitario,
        total: Number(item.total ?? quantidade * valorUnitario)
    };
}

// Padroniza cada registro do historico de preco.
function normalizarHistorico(registro) {
    // Retorna sempre os nomes que a tela usa.
    return {
        servico: registro.servico ?? registro.nome_servico ?? registro.NOME_SERVICO ?? "Serviço",
        valor_antigo: Number(registro.valor_antigo ?? registro.valor_unitario ?? registro.VALOR_UNITARIO ?? 0),
        data_alteracao: registro.data_alteracao ?? registro.data_historico ?? registro.DATA_HISTORICO ?? ""
    };
}

// Converte data do input HTML para o formato brasileiro que a API espera.
function inputParaDataBr(valor) {
    // Se o campo estiver vazio, retorna vazio.
    if (!valor) {
        return "";
    }

    // Separa data e hora do valor datetime-local.
    const [data, hora = "00:00"] = valor.split("T");
    // Separa ano, mes e dia.
    const [ano, mes, dia] = data.split("-");

    // Se a data estiver incompleta, devolve o valor original.
    if (!ano || !mes || !dia) {
        return valor;
    }

    // Retorna no formato DD/MM/AAAA HH:MM.
    return `${dia}/${mes}/${ano} ${hora.slice(0, 5)}`;
}

// Converte data brasileira da API para o formato aceito pelo input.
function dataBrParaInput(valor) {
    // Garante que sempre vamos trabalhar com texto.
    const data = String(valor || "");
    // Procura o padrao DD/MM/AAAA HH:MM.
    const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    // Se nao encontrar o padrao, deixa o input vazio.
    if (!partes) {
        return "";
    }

    // Retorna no formato AAAA-MM-DDTHH:MM.
    return `${partes[3]}-${partes[2]}-${partes[1]}T${partes[4]}:${partes[5]}`;
}

// Converte data brasileira em objeto Date para comparar passado/futuro.
function dataBrParaDate(valor) {
    // Procura o padrao DD/MM/AAAA HH:MM.
    const partes = String(valor || "").match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    // Se a data nao estiver no padrao, retorna null.
    if (!partes) {
        return null;
    }

    // Cria o Date usando ano, mes, dia, hora e minuto.
    return new Date(
        Number(partes[3]),
        Number(partes[2]) - 1,
        Number(partes[1]),
        Number(partes[4]),
        Number(partes[5])
    );
}

// Formata numero como moeda brasileira.
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Garante uma quantidade numerica valida para servicos da manutencao.
function normalizarQuantidadeServico(valor) {
    const quantidade = Number(valor || 1);
    return quantidade > 0 ? quantidade : 1;
}

// Monta o header Authorization quando existe token salvo.
function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Monta headers para rotas que recebem JSON.
function headersJsonAutenticado() {
    return {
        "Content-Type": "application/json",
        ...(cabecalhoAutorizacao() || {})
    };
}

// Le respostas da API de manutencao, inclusive quando o backend retorna vazio.
async function lerRespostaJson(resposta) {
    // Le como texto primeiro para evitar erro quando a resposta vem vazia.
    const texto = await resposta.text();

    // Se nao veio corpo na resposta, retorna objeto vazio.
    if (!texto) {
        return {};
    }

    try {
        // Tenta converter o texto em JSON.
        return JSON.parse(texto);
    } catch {
        // Se nao for JSON valido, evita quebrar a tela.
        return {};
    }
}

// Pagina principal de cadastro, listagem e edicao de manutencoes.
function CadastroManutencao({ API }) {
    // Lista de manutencoes carregadas da API.
    const [manutencoes, setManutencoes] = useState([]);
    // Lista de veiculos usada no autocomplete.
    const [veiculos, setVeiculos] = useState([]);
    // Lista de servicos usada nos selects.
    const [servicos, setServicos] = useState([]);
    // Dados do formulario principal.
    const [formulario, setFormulario] = useState(formularioInicial);
    // Dados do formulario de adicionar item.
    const [itemFormulario, setItemFormulario] = useState(itemInicial);
    // Manutencao aberta no painel de itens.
    const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null);
    // Itens da manutencao selecionada.
    const [itens, setItens] = useState([]);
    // Quantidades editaveis dos itens.
    const [quantidadesItens, setQuantidadesItens] = useState({});
    // Texto usado na busca da tabela.
    const [buscaTexto, setBuscaTexto] = useState("");
    // Pagina atual da tabela de manutencoes.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Texto digitado no autocomplete de veiculo.
    const [buscaVeiculo, setBuscaVeiculo] = useState("");
    // Controla se as sugestoes de veiculo aparecem.
    const [mostrarSugestoesVeiculos, setMostrarSugestoesVeiculos] = useState(false);
    // ID do servico escolhido no historico de preco.
    const [servicoHistorico, setServicoHistorico] = useState("");
    // Registros de historico retornados pela API.
    const [historico, setHistorico] = useState([]);
    // Mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);
   // Carregamento da lista de manutencoes.
    const [carregando, setCarregando] = useState(true);
    // Carregamento do botao de salvar manutencao.
    const [salvando, setSalvando] = useState(false);
    // Carregamento dos itens da manutencao.
    const [carregandoItens, setCarregandoItens] = useState(false);
    // Carregamento do botao de adicionar item.
    const [salvandoItem, setSalvandoItem] = useState(false);
    // Carregamento da consulta de historico.
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);
    // Guarda os dados do modal de confirmacao.
    const [confirmacao, setConfirmacao] = useState(null);
    // Controla carregamento dentro do modal.
    const [confirmandoAcao, setConfirmandoAcao] = useState(false);

    // Cria um mapa para achar servico rapido pelo id.
    const servicosPorId = useMemo(() => {
        const mapa = new Map();
        servicos.forEach((servico) => mapa.set(String(servico.id), servico));
        return mapa;
    }, [servicos]);

    // Filtra os veiculos que aparecem no autocomplete.
    const veiculosFiltrados = useMemo(() => {
        // Normaliza a busca para comparar sem maiuscula/minuscula.
        const termo = buscaVeiculo.trim().toLowerCase();
        // Se tiver termo, filtra; se nao tiver, mostra todos.
        const lista = termo
            ? veiculos.filter((veiculo) => {
                const campos = [veiculo.label, veiculo.placa, veiculo.modelo, veiculo.marca];
                return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
            })
            : veiculos;

        // Mostra no maximo 6 sugestoes para nao ocupar a tela.
        return lista.slice(0, 6);
    }, [buscaVeiculo, veiculos]);

    // Filtra a tabela de manutencoes pelo texto digitado.
    const manutencoesFiltradas = useMemo(() => {
        // Normaliza a busca.
        const termo = buscaTexto.trim().toLowerCase();

        // Sem busca, retorna a lista completa.
        if (!termo) {
            return manutencoes;
        }

        // Procura o texto nos dados da manutencao e nos servicos.
        return manutencoes.filter((manutencao) => {
            const campos = [
                manutencao.marca,
                manutencao.modelo,
                manutencao.placa,
                manutencao.data,
                manutencao.valor_total,
                ...manutencao.servicos_realizados.flatMap((servico) => [
                    servico.servico,
                    servico.nome_servico,
                    servico.NOME_SERVICO,
                    servico.descricao,
                    servico.DESCRICAO
                ])
            ];

            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [buscaTexto, manutencoes]);

    // Total de paginas considerando os filtros atuais.
    const totalPaginas = Math.max(1, Math.ceil(manutencoesFiltradas.length / ITENS_POR_PAGINA));

    // Mantem a pagina atual dentro do limite quando a lista muda.
    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Mostra somente as manutencoes da pagina atual.
    const manutencoesPaginadas = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return manutencoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [manutencoesFiltradas, paginaAtual]);

    // Calcula o total do formulario antes de salvar.
    const totalFormulario = useMemo(() => {
        return formulario.servicos.reduce((total, item) => {
            // Busca o servico escolhido pelo ID.
            const servico = servicosPorId.get(String(item.id_servico));
            // Pega o valor do servico.
            const valor = Number(servico?.valor || 0);
            // Pega a quantidade digitada.
            const quantidade = Number(item.quantidade || 0);

            // Soma valor vezes quantidade ao total.
            return total + valor * quantidade;
        }, 0);
    }, [formulario.servicos, servicosPorId]);

    // Carrega a lista geral de manutencoes para a tabela.
    const carregarManutencoes = useCallback(async () => {
        // Mostra estado de carregamento na tabela.
        setCarregando(true);
        // Limpa mensagem antiga antes de chamar a API.
        setMensagem(null);

        try {
            // Chama a rota GET que lista todas as manutencoes.
            const resposta = await fetch(`${API}/listar_manutencao`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta mesmo se ela vier vazia.
            const dados = await lerRespostaJson(resposta);

            // Trata erro vindo da API.
            if (!resposta.ok) {
                const texto = dados.mensagem || dados.erro || "";

                // Se a API disser que nao existe nenhuma, a tabela fica vazia.
                if (resposta.status === 404 && texto.toLowerCase().includes("nenhuma")) {
                    setManutencoes([]);
                    return;
                }

                // Qualquer outro erro aparece como alerta na tela.
                setMensagem({
                    tipo: "erro",
                    texto: texto || "Não foi possível carregar as manutenções."
                });
                return;
            }

            // Normaliza a lista antes de salvar no estado.
            setManutencoes(extrairLista(dados, ["manutencoes", "manutencao"]).map(normalizarManutencao));
        } catch {
            // Erro de rede ou servidor fora do ar.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga o carregamento no fim da requisicao.
            setCarregando(false);
        }
    }, [API]);

    // Busca os veiculos para o autocomplete do agendamento.
    const carregarVeiculos = useCallback(async () => {
        try {
            // Busca os carros cadastrados para escolher na manutencao.
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta em JSON seguro.
            const dados = await lerRespostaJson(resposta);

            // Se a API falhar, deixa a lista vazia.
            if (!resposta.ok) {
                setVeiculos([]);
                return;
            }

            // Normaliza veiculos para o autocomplete.
            setVeiculos(extrairLista(dados, ["carros", "veiculos", "veiculo"]).map(normalizarVeiculo));
        } catch {
            // Em erro de conexao, nao quebra a pagina.
            setVeiculos([]);
        }
    }, [API]);

    // Carrega os servicos; tenta rotas antigas e depois usa buscar_servico como fallback.
    const carregarServicos = useCallback(async () => {
        // Algumas APIs podem usar nomes diferentes para listar servicos.
        const rotas = ["/listar_servico", "/listar_servicos", "/servicos"];

        // Tenta cada rota de listagem ate uma funcionar.
        for (const rota of rotas) {
            try {
                // Chama a rota atual da tentativa.
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                // Le a resposta sem quebrar se vier vazia.
                const dados = await lerRespostaJson(resposta);

                // Se funcionar, salva os servicos e para o loop.
                if (resposta.ok) {
                    const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                    setServicos(lista.filter((servico) => servico.id));
                    return;
                }
            } catch {
                // Se uma rota falhar, tenta a proxima.
                setServicos([]);
            }
        }

        try {
            // Fallback usado pela sua API atual para listar servicos com filtro vazio.
            const resposta = await fetch(`${API}/buscar_servico`, {
                method: "POST",
                headers: headersJsonAutenticado(),
                credentials: "include",
                body: JSON.stringify({})
            });
            // Le o JSON retornado pela rota.
            const dados = await lerRespostaJson(resposta);

            // Se a busca funcionar, usa a lista de servicos retornada.
            if (resposta.ok) {
                const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                setServicos(lista.filter((servico) => servico.id));
                return;
            }
        } catch {
            // Se tudo falhar, deixa o select sem servicos.
            setServicos([]);
        }

        // Garante lista vazia quando nenhuma rota funcionou.
        setServicos([]);
    }, [API]);

    // Lista os itens de uma manutencao selecionada.
    const carregarItens = useCallback(async (idManutencao) => {
        // Sem ID nao existe item para buscar.
        if (!idManutencao) {
            return;
        }

        // Liga carregamento da tabela de itens.
        setCarregandoItens(true);

        try {
            // Chama a rota que lista os itens da manutencao.
            const resposta = await fetch(`${API}/listar_item_manutencao/${idManutencao}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta de forma segura.
            const dados = await lerRespostaJson(resposta);

            // Trata erro da API.
            if (!resposta.ok) {
                const texto = dados.mensagem || dados.erro || "";

                // Se nao tiver item cadastrado, apenas limpa a lista.
                if (resposta.status === 404 && texto.toLowerCase().includes("nenhum")) {
                    setItens([]);
                    setQuantidadesItens({});
                    return;
                }

                // Outros erros aparecem na mensagem visual.
                setMensagem({
                    tipo: "erro",
                    texto: texto || "Não foi possível carregar os itens da manutenção."
                });
                return;
            }

            // Normaliza os itens para a tela.
            const lista = extrairLista(dados, ["itens", "items"]).map(normalizarItem);
            // Salva os itens na tabela.
            setItens(lista);
            // Monta um objeto com as quantidades para editar nos inputs.
            setQuantidadesItens(
                lista.reduce((acumulado, item) => ({
                    ...acumulado,
                    [item.id_item]: String(item.quantidade)
                }), {})
            );
        } catch {
            // Mensagem quando nao consegue conectar ao servidor.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento dos itens.
            setCarregandoItens(false);
        }
    }, [API]);

    // Carrega manutencoes, veiculos e servicos quando a tela abre.
    useEffect(() => {
        carregarManutencoes();
        carregarVeiculos();
        carregarServicos();
    }, [carregarManutencoes, carregarServicos, carregarVeiculos]);

    // Atualiza um campo simples do formulario principal.
    function atualizarCampo(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    // Atualiza o texto do autocomplete de veiculo.
    function atualizarBuscaVeiculo(valor) {
        // Guarda o texto digitado.
        setBuscaVeiculo(valor);

        // Normaliza o texto para comparar com veiculo.label e placa.
        const termo = valor.trim().toLowerCase();
        // Procura veiculo exatamente igual ao texto digitado.
        const veiculoEncontrado = veiculos.find((veiculo) =>
            String(veiculo.label).toLowerCase() === termo ||
            String(veiculo.placa).toLowerCase() === termo
        );

        // Se encontrou, preenche o id_veiculo; se nao, limpa.
        atualizarCampo("id_veiculo", veiculoEncontrado?.id || "");
    }

    // Escolhe um veiculo clicado na lista de sugestoes.
    function selecionarVeiculo(veiculo) {
        // Mostra o texto completo no campo.
        setBuscaVeiculo(veiculo.label);
        // Salva o ID real para enviar para a API.
        atualizarCampo("id_veiculo", veiculo.id);
        // Fecha a lista de sugestoes.
        setMostrarSugestoesVeiculos(false);
    }

    // Atualiza um campo de um servico dentro do formulario.
    function atualizarServicoFormulario(index, campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: (() => {
                const servicosAtualizados = dadosAtuais.servicos.map((servico, posicao) =>
                    posicao === index ? { ...servico, [campo]: valor } : servico
                );

                if (campo !== "id_servico" || !String(valor).trim()) {
                    return servicosAtualizados;
                }

                const posicaoDuplicada = servicosAtualizados.findIndex((servico, posicao) =>
                    posicao !== index && String(servico.id_servico) === String(valor)
                );

                if (posicaoDuplicada === -1) {
                    return servicosAtualizados;
                }

                return servicosAtualizados
                    .map((servico, posicao) => {
                        if (posicao !== posicaoDuplicada) {
                            return servico;
                        }

                        const quantidadeAtual = normalizarQuantidadeServico(servico.quantidade);
                        const quantidadeRepetida = normalizarQuantidadeServico(servicosAtualizados[index]?.quantidade);

                        return {
                            ...servico,
                            quantidade: String(quantidadeAtual + quantidadeRepetida)
                        };
                    })
                    .filter((_, posicao) => posicao !== index);
            })()
        }));
    }

    // Adiciona uma nova linha de servico no formulario.
    function adicionarServicoFormulario() {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: [...dadosAtuais.servicos, { id_servico: "", quantidade: "1" }]
        }));
    }

    // Remove uma linha de servico do formulario.
    function removerServicoFormulario(index) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: dadosAtuais.servicos.filter((_, posicao) => posicao !== index)
        }));
    }

    // Limpa o formulario principal e a mensagem.
    function limparFormulario() {
        setFormulario(formularioInicial());
        setBuscaVeiculo("");
        setMensagem(null);
    }

    // Converte os servicos do formulario para o JSON esperado pela API.
    function montarServicosPayload() {
        const servicosAgrupados = new Map();

        formulario.servicos
            .filter((servico) => String(servico.id_servico).trim())
            .forEach((servico) => {
                const idServico = Number(servico.id_servico);
                const quantidade = normalizarQuantidadeServico(servico.quantidade);
                const quantidadeAtual = servicosAgrupados.get(idServico) || 0;

                servicosAgrupados.set(idServico, quantidadeAtual + quantidade);
            });

        return Array.from(servicosAgrupados, ([id_servico, quantidade]) => ({
            id_servico,
            quantidade
        }));
    }

    // Cria ou edita uma manutencao, vinculando veiculo, data e servicos.
    async function salvarManutencao(e) {
        // Impede o navegador de recarregar a pagina.
        e.preventDefault();
        // Limpa mensagem anterior.
        setMensagem(null);

        // Monta a lista de servicos no formato da API.
        const servicosPayload = montarServicosPayload();

        // Confere se os campos obrigatorios foram preenchidos.
        if (!String(formulario.id_veiculo).trim() || !formulario.data_manutencao || servicosPayload.length === 0) {
            setMensagem({
                tipo: "erro",
                texto: "Selecione um veículo da lista, informe a data e escolha pelo menos um serviço."
            });
            return;
        }

        // Converte a data para DD/MM/AAAA HH:MM.
        const dataBr = inputParaDataBr(formulario.data_manutencao);
        // Monta o objeto que sera enviado para cadastrar ou editar.
        const payload = {
            id_veiculo: Number(formulario.id_veiculo),
            data_manutencao: dataBr,
            data_nova: dataBr,
            servico: servicosPayload,
            servicos: servicosPayload
        };

        // Define se e cadastro novo ou edicao.
        const estaEditando = Boolean(formulario.id_manutencao);
        // Escolhe a rota correta da API.
        const rota = estaEditando
            ? `${API}/editar_manutencao/${formulario.id_manutencao}`
            : `${API}/cadastrar_manutencao`;

        // Liga carregamento do botao de salvar.
        setSalvando(true);

        try {
            // Envia os dados para a API.
            const resposta = await fetch(rota, {
                method: estaEditando ? "PUT" : "POST",
                headers: headersJsonAutenticado(),
                credentials: "include",
                body: JSON.stringify(payload)
            });
            // Le a resposta da API.
            const dados = await lerRespostaJson(resposta);

            // Se a API retornou erro, mostra na tela.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível salvar a manutenção."
                });
                return;
            }

            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Manutenção salva com sucesso."
            });
            // Limpa o formulario.
            setFormulario(formularioInicial());
            // Limpa o campo de busca do veiculo.
            setBuscaVeiculo("");
            // Atualiza a listagem.
            await carregarManutencoes();
        } catch {
            // Erro de rede ou servidor desligado.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do botao.
            setSalvando(false);
        }
    }

    // Coloca os dados de uma manutencao dentro do formulario para editar.
    function editarManutencao(manutencao) {
        // Tenta achar o veiculo pelo numero da placa.
        const veiculoEncontrado = veiculos.find((veiculo) =>
            veiculo.placa && manutencao.placa && String(veiculo.placa).toUpperCase() === String(manutencao.placa).toUpperCase()
        );

        // Converte servicos realizados para o formato do formulario.
        const servicosManutencao = manutencao.servicos_realizados.length > 0
            ? manutencao.servicos_realizados.map((item) => {
                // Procura o servico cadastrado pelo nome.
                const servicoEncontrado = servicos.find((servico) =>
                    String(servico.nome).toLowerCase() === String(item.servico || item.nome_servico || "").toLowerCase()
                );

                // Retorna id e quantidade para preencher a linha.
                return {
                    id_servico: servicoEncontrado?.id || "",
                    quantidade: String(item.quantidade || 1)
                };
            })
            : [{ id_servico: "", quantidade: "1" }];

        // Preenche o formulario principal.
        setFormulario({
            id_manutencao: manutencao.id_manutencao,
            id_veiculo: veiculoEncontrado?.id || "",
            data_manutencao: dataBrParaInput(manutencao.data),
            servicos: servicosManutencao
        });
        // Preenche o texto visivel do veiculo.
        setBuscaVeiculo(veiculoEncontrado?.label || [manutencao.placa, manutencao.modelo, manutencao.marca].filter(Boolean).join(" - "));
        // Move a tela para o formulario.
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Abre o modal de confirmacao para excluir manutencao.
    function pedirExclusaoManutencao(idManutencao) {
        setConfirmacao({
            tipo: "manutencao",
            id: idManutencao,
            titulo: "Cancelar agendamento",
            texto: "Deseja cancelar este agendamento de manutenção?",
            textoConfirmar: "Cancelar agendamento"
        });
    }

    // Cancela/exclui manutencao futura pela API.
    async function excluirManutencao(idManutencao) {
        // Liga carregamento do modal.
        setConfirmandoAcao(true);
        // Limpa mensagem antiga.
        setMensagem(null);

        try {
            // Chama a rota DELETE do backend.
            const resposta = await fetch(`${API}/deletar_manutencao/${idManutencao}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta de forma segura.
            const dados = await lerRespostaJson(resposta);

            // Mostra erro se o backend bloquear.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível excluir a manutenção."
                });
                return;
            }

            // Mostra mensagem de sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Manutenção excluída com sucesso."
            });
            // Fecha o painel de itens se ele estava mostrando a manutencao excluida.
            setManutencaoSelecionada((atual) =>
                atual?.id_manutencao === idManutencao ? null : atual
            );
            // Fecha o modal.
            setConfirmacao(null);
            // Recarrega a tabela.
            await carregarManutencoes();
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do modal.
            setConfirmandoAcao(false);
        }
    }

    // Seleciona uma manutencao e carrega os itens dela.
    async function selecionarManutencao(manutencao) {
        // Guarda a manutencao aberta no painel.
        setManutencaoSelecionada(manutencao);
        // Limpa o formulario de novo item.
        setItemFormulario(itemInicial);
        // Busca os itens da API.
        await carregarItens(manutencao.id_manutencao);
    }

    // Adiciona um novo item de servico na manutencao ja selecionada.
    async function adicionarItem(e) {
        // Evita refresh da pagina.
        e.preventDefault();
        // Limpa mensagem anterior.
        setMensagem(null);

        // Precisa ter manutencao aberta e servico escolhido.
        if (!manutencaoSelecionada || !String(itemFormulario.id_servico).trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Selecione uma manutenção e um serviço para adicionar."
            });
            return;
        }

        // Liga carregamento do botao adicionar item.
        setSalvandoItem(true);

        try {
            // Envia o novo item para a API.
            const resposta = await fetch(`${API}/adicionar_item_manutencao`, {
                method: "POST",
                headers: headersJsonAutenticado(),
                credentials: "include",
                body: JSON.stringify({
                    id_manutencao: Number(manutencaoSelecionada.id_manutencao),
                    id_servico: Number(itemFormulario.id_servico),
                    quantidade: Number(itemFormulario.quantidade || 1)
                })
            });
            // Le retorno da API.
            const dados = await lerRespostaJson(resposta);

            // Mostra erro se a API nao aceitar o item.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível adicionar o item."
                });
                return;
            }

            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item adicionado com sucesso."
            });
            // Limpa formulario do item.
            setItemFormulario(itemInicial);
            // Atualiza itens e total da tabela.
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do botao.
            setSalvandoItem(false);
        }
    }

    // Atualiza a quantidade do item e recalcula o total no backend.
    async function editarItem(idItem) {
        // Limpa mensagem antiga.
        setMensagem(null);
        // Pega a quantidade digitada no input daquele item.
        const quantidade = quantidadesItens[idItem];

        // Valida se a quantidade foi preenchida e e maior que zero.
        if (!quantidade || Number(quantidade) <= 0) {
            setMensagem({
                tipo: "erro",
                texto: "Informe uma quantidade valida para atualizar o item."
            });
            return;
        }

        try {
            // Chama a rota que edita a quantidade do item.
            const resposta = await fetch(`${API}/editar_item_manutencao/${idItem}`, {
                method: "PUT",
                headers: headersJsonAutenticado(),
                credentials: "include",
                body: JSON.stringify({ quantidade: Number(quantidade) })
            });
            // Le a resposta da API.
            const dados = await lerRespostaJson(resposta);

            // Mostra erro se a API recusou.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível editar o item."
                });
                return;
            }

            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item atualizado com sucesso."
            });
            // Recarrega itens e manutencoes para atualizar valores.
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        }
    }

    // Abre o modal para confirmar exclusao de item.
    function pedirExclusaoItem(idItem) {
        setConfirmacao({
            tipo: "item",
            id: idItem,
            titulo: "Excluir item",
            texto: "Deseja excluir este item da manutenção?",
            textoConfirmar: "Excluir item"
        });
    }

    // Remove um item da manutencao e pede para a API recalcular o total.
    async function excluirItem(idItem) {
        // Liga carregamento do modal.
        setConfirmandoAcao(true);
        // Limpa mensagem antiga.
        setMensagem(null);

        try {
            // Chama a rota que exclui o item.
            const resposta = await fetch(`${API}/excluir_item_manutencao/${idItem}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta.
            const dados = await lerRespostaJson(resposta);

            // Mostra erro se a API bloquear.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível excluir o item."
                });
                return;
            }

            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item excluido com sucesso."
            });
            // Fecha modal.
            setConfirmacao(null);
            // Atualiza itens e tabela principal.
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do modal.
            setConfirmandoAcao(false);
        }
    }

    // Consulta o historico de preco de um servico.
    async function buscarHistorico(e) {
        // Evita recarregar a pagina.
        e.preventDefault();
        // Limpa historico anterior.
        setHistorico([]);
        // Limpa mensagem anterior.
        setMensagem(null);

        // Obriga escolher um servico antes de consultar.
        if (!String(servicoHistorico).trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Informe um serviço para consultar o histórico."
            });
            return;
        }

        // Liga carregamento do botao consultar.
        setCarregandoHistorico(true);

        try {
            // Chama a rota do historico de reajuste do servico.
            const resposta = await fetch(`${API}/historico_servico/${servicoHistorico}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta da API.
            const dados = await lerRespostaJson(resposta);

            // Mostra erro quando nao existe historico ou a API falha.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Nenhum histórico encontrado."
                });
                return;
            }

            // Salva o historico normalizado na tela.
            setHistorico(extrairLista(dados, ["historico"]).map(normalizarHistorico));
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do historico.
            setCarregandoHistorico(false);
        }
    }

    // Define a classe CSS do status da manutencao.
    function classeStatus(data) {
        // Converte data brasileira para Date.
        const dataAgendada = dataBrParaDate(data);

        // Se a data estiver invalida, usa status de agendada.
        if (!dataAgendada) {
            return css.status_agendada;
        }

        // Data e hora atual.
        const agora = new Date();
        // Periodo de sete dias usado para marcar como "Proxima".
        const seteDias = 7 * 24 * 60 * 60 * 1000;

        // Se a data ja passou, aparece como realizada.
        if (dataAgendada < agora) {
            return css.status_realizada;
        }

        // Se esta dentro dos proximos sete dias, aparece como proxima.
        if (dataAgendada.getTime() - agora.getTime() <= seteDias) {
            return css.status_proxima;
        }

        // Caso contrario, fica como agendada.
        return css.status_agendada;
    }

    // Define o texto do status da manutencao.
    function textoStatus(data) {
        // Converte data brasileira para Date.
        const dataAgendada = dataBrParaDate(data);

        // Data passada vira realizada.
        if (dataAgendada && dataAgendada < new Date()) {
            return "Realizada";
        }

        // Classe proxima vira texto "Proxima".
        if (classeStatus(data) === css.status_proxima) {
        return "Próxima";
        }

        // Texto padrao para manutencao futura.
        return "Agendada";
    }

    // Renderiza toda a pagina.
    return (
        // Container principal da tela.
        <main className={css.container}>
            {/* Cabecalho da pagina. */}
            <header className={css.cabecalho}>
                <div>
                    <h1 className={css.titulo}>Manutenções</h1>
                    <p className={css.subtitulo}>Agende serviços, acompanhe itens e consulte o histórico de valores.</p>
                </div>

                <button type="button" className={css.botaoSecundario} onClick={carregarManutencoes}>
                    Atualizar lista
                </button>
            </header>

            {mensagem && (
                <div
                   className={`${css.mensagem} ${
                        mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                    }`}
                    role="alert"
                >
                    <div>
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atenção"}</strong>
                        <span>{mensagem.texto}</span>
                    </div>
                    <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                        x
                    </button>
                </div>
            )}

            <section className={css.areaFormulario}>
                <form className={css.formulario} onSubmit={salvarManutencao}>
                    <div className={css.formCabecalho}>
                        <div>
                            <h2>{formulario.id_manutencao ? "Editar agendamento" : "Novo agendamento"}</h2>
                            <span>Escolha a data, o horário e os serviços que serão feitos no veículo.</span>
                        </div>
                        <strong>{formatarMoeda(totalFormulario)}</strong>
                    </div>

                    <div className={css.gridCampos}>
                        <div className={`${css.campo} ${css.campoAutocomplete}`}>
                            <span>Veículo</span>
                            <input
                                type="text"
                                value={buscaVeiculo}
                                onChange={(e) => atualizarBuscaVeiculo(e.target.value)}
                                onFocus={() => setMostrarSugestoesVeiculos(true)}
                                onBlur={() => setMostrarSugestoesVeiculos(false)}
                                placeholder="Busque por placa, modelo ou marca"
                                autoComplete="off"
                            />
                            {mostrarSugestoesVeiculos && (
                                <div className={css.listaAutocomplete}>
                                    {veiculosFiltrados.length > 0 ? (
                                        veiculosFiltrados.map((veiculo) => (
                                            <button
                                                key={veiculo.id}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    selecionarVeiculo(veiculo);
                                                }}
                                            >
                                                <strong>{veiculo.placa || "Sem placa"}</strong>
                                                <span>{[veiculo.modelo, veiculo.marca].filter(Boolean).join(" - ") || veiculo.label}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className={css.autocompleteVazio}>Nenhum veículo encontrado</div>
                                    )}
                                </div>
                            )}
                            {formulario.id_veiculo && (
                                <small className={css.campoAjuda}>Veículo selecionado para este agendamento.</small>
                            )}
                        </div>

                        <label className={css.campo}>
                            <span>Data e hora</span>
                            <input
                                type="datetime-local"
                                value={formulario.data_manutencao}
                                onChange={(e) => atualizarCampo("data_manutencao", e.target.value)}
                            />
                        </label>
                    </div>

                    <div className={css.listaServicos}>
                        {formulario.servicos.map((item, index) => {
                            const servico = servicosPorId.get(String(item.id_servico));
                            const subtotal = Number(servico?.valor || 0) * Number(item.quantidade || 0);

                            return (
                                <div key={`${item.id_servico}-${index}`} className={css.linhaServico}>
                                    <label className={css.campo}>
                                        <span>Serviço</span>
                                        {servicos.length > 0 ? (
                                            <select
                                                value={item.id_servico}
                                                onChange={(e) => atualizarServicoFormulario(index, "id_servico", e.target.value)}
                                            >
                                                <option value="">Selecione</option>
                                                {servicos.map((servicoOpcao) => (
                                                    <option key={servicoOpcao.id} value={servicoOpcao.id}>
                                                        {servicoOpcao.nome} - {formatarMoeda(servicoOpcao.valor)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select value="" disabled>
                                                <option>Nenhum serviço carregado</option>
                                            </select>
                                        )}
                                    </label>

                                    <label className={css.campo}>
                                        <span>Quantidade</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantidade}
                                            onChange={(e) => atualizarServicoFormulario(index, "quantidade", e.target.value)}
                                        />
                                    </label>

                                    <div className={css.subtotalServico}>
                                        <span>Subtotal</span>
                                        <strong>{formatarMoeda(subtotal)}</strong>
                                    </div>

                                    <button
                                        type="button"
                                        className={css.botaoRemover}
                                        onClick={() => removerServicoFormulario(index)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className={css.botoesFormulario}>
                        <button type="button" className={css.botaoSecundario} onClick={adicionarServicoFormulario}>
                            Adicionar serviço
                        </button>
                        <button type="button" className={css.botaoSecundario} onClick={limparFormulario}>
                            Limpar
                        </button>
                        <button type="submit" className={css.botaoPrimario} disabled={salvando}>
                            {salvando ? "Salvando..." : formulario.id_manutencao ? "Salvar edição" : "Agendar manutenção"}
                        </button>
                    </div>
                </form>

                <form className={css.painelHistorico} onSubmit={buscarHistorico}>
                    <h2>Histórico de preço</h2>
                    <label className={css.campo}>
                        <span>Serviço</span>
                        <select
                            value={servicoHistorico}
                            onChange={(e) => setServicoHistorico(e.target.value)}
                            disabled={servicos.length === 0}
                        >
                            <option value="">{servicos.length > 0 ? "Selecione um serviço" : "Nenhum serviço carregado"}</option>
                            {servicos.map((servico) => (
                                <option key={servico.id} value={servico.id}>
                                    {servico.nome}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" className={css.botaoPrimario} disabled={carregandoHistorico || servicos.length === 0}>
                        {carregandoHistorico ? "Buscando..." : "Consultar"}
                    </button>

                    <div className={css.listaHistorico}>
                        {historico.map((registro, index) => (
                            <div key={`${registro.data_alteracao}-${index}`} className={css.itemHistorico}>
                                <span>{registro.data_alteracao}</span>
                                <strong>{formatarMoeda(registro.valor_antigo)}</strong>
                            </div>
                        ))}
                    </div>
                </form>
            </section>

            <section className={css.buscaAvancada}>
                <div className={css.buscaTexto}>
                    <img src="/IconBusca.png" alt="Buscar" />
                    <input
                        type="text"
                        placeholder="Buscar por placa, modelo, marca, data ou serviço"
                        value={buscaTexto}
                        onChange={(e) => {
                            setBuscaTexto(e.target.value);
                            setPaginaAtual(1);
                        }}
                    />
                </div>
                <button
                    type="button"
                    className={css.botaoSecundario}
                    onClick={() => {
                        setBuscaTexto("");
                        setPaginaAtual(1);
                    }}
                >
                    Limpar busca
                </button>
            </section>

            <section className={css.tabelaContainer}>
                <table className={css.tabela}>
                    <thead>
                    <tr>
                        <th>Veículo</th>
                        <th>Placa</th>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {carregando && (
                        <tr>
                            <td colSpan="6" className={css.celulaVazia}>Carregando manutenções...</td>
                        </tr>
                    )}

                    {!carregando && manutencoesFiltradas.length === 0 && (
                        <tr>
                            <td colSpan="6" className={css.celulaVazia}>Nenhuma manutenção encontrada</td>
                        </tr>
                    )}

                    {!carregando && manutencoesPaginadas.map((manutencao) => (
                        <tr key={manutencao.id_manutencao}>
                            <td data-label="Veículo">
                                <strong>{manutencao.modelo || "Veículo"}</strong>
                                <span className={css.textoApoio}>{manutencao.marca}</span>
                            </td>
                            <td data-label="Placa">{manutencao.placa || "-"}</td>
                            <td data-label="Data">{manutencao.data || "-"}</td>
                            <td data-label="Total" className={css.valor}>{formatarMoeda(manutencao.valor_total)}</td>
                            <td data-label="Status">
                                <span className={`${css.status} ${classeStatus(manutencao.data)}`}>
                                    {textoStatus(manutencao.data)}
                                </span>
                            </td>
                            <td data-label="Ações">
                                <div className={css.acoes}>
                                    <button type="button" className={css.btnDetalhes} onClick={() => selecionarManutencao(manutencao)}>
                                        Itens
                                    </button>
                                    <button type="button" className={css.btnEditar} onClick={() => editarManutencao(manutencao)}>
                                        Editar
                                    </button>
                                    <button type="button" className={css.btnExcluir} onClick={() => pedirExclusaoManutencao(manutencao.id_manutencao)}>
                                        Excluir
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>

            {!carregando && manutencoesFiltradas.length > 0 && (
                <div className={css.paginacaoArea}>
                    <Paginacao
                        paginaAtual={paginaAtual}
                        totalItens={manutencoesFiltradas.length}
                        onMudarPagina={setPaginaAtual}
                    />
                </div>
            )}

            {manutencaoSelecionada && (
                <section className={css.painelItens}>
                    <header className={css.painelItensCabecalho}>
                        <div>
                            <h2>Itens da manutenção</h2>
                            <span>{manutencaoSelecionada.modelo} {manutencaoSelecionada.placa ? `- ${manutencaoSelecionada.placa}` : ""}</span>
                        </div>
                        <button type="button" className={css.botaoSecundario} onClick={() => setManutencaoSelecionada(null)}>
                            Fechar
                        </button>
                    </header>

                    <form className={css.formItem} onSubmit={adicionarItem}>
                        <label className={css.campo}>
                            <span>Serviço</span>
                            {/* Renderiza o select com a lista de servicos disponiveis, ou desabilita caso a API ainda nao tenha carregado ou falhado. */}
                            {servicos.length > 0 ? (
                                <select
                                    value={itemFormulario.id_servico}
                                    onChange={(e) => setItemFormulario((atual) => ({ ...atual, id_servico: e.target.value }))}
                                >
                                    <option value="">Selecione</option>
                                    {servicos.map((servico) => (
                                        <option key={servico.id} value={servico.id}>
                                            {servico.nome} - {formatarMoeda(servico.valor)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select value="" disabled>
                                    <option>Nenhum serviço carregado</option>
                                </select>
                            )}
                        </label>
                        
                        {/* Campo para inputar a quantidade daquele servico que vai ser adicionado. */}
                        <label className={css.campo}>
                            <span>Quantidade</span>
                            <input
                                type="number"
                                min="1"
                                value={itemFormulario.quantidade}
                                onChange={(e) => setItemFormulario((atual) => ({ ...atual, quantidade: e.target.value }))}
                            />
                        </label>

                        {/* Botao de submit do formulario para acionar a rota de adicao do item na API. Desativa enquanto carrega ou se nao tiver servico selecionavel. */}
                        <button type="submit" className={css.botaoPrimario} disabled={salvandoItem || servicos.length === 0}>
                            {salvandoItem ? "Adicionando..." : "Adicionar item"}
                        </button>
                    </form>

                    {/* Container da tabela listando os itens ja adicionados na manutencao selecionada. */}
                    <div className={css.tabelaItensContainer}>
                        <table className={css.tabela}>
                            {/* Cabecalho da tabela dos servicos prestados naquela manutencao especifica. */}
                            <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Quantidade</th>
                                <th>Unitário</th>
                                <th>Total</th>
                                <th>Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {/* Mostra mensagem visual enquanto aguarda retorno da rota de listagem de itens da manutencao. */}
                            {carregandoItens && (
                                <tr>
                                    <td colSpan="5" className={css.celulaVazia}>Carregando itens...</td>
                                </tr>
                            )}

                            {/* Mostra mensagem indicando que a lista esta vazia, se a API retornou sem erros porem sem itens. */}
                            {!carregandoItens && itens.length === 0 && (
                                <tr>
                                    <td colSpan="5" className={css.celulaVazia}>Nenhum item cadastrado</td>
                                </tr>
                            )}

                            {/* Varre a lista de itens da manutencao atual para imprimir linha a linha na tabela/cards. */}
                            {!carregandoItens && itens.map((item) => (
                                <tr key={item.id_item}>
                                    {/* Exibe o nome do servico vindo do objeto de item (preenchido por join da API ou normalizacao). */}
                                    <td data-label="Serviço">{item.nome_servico}</td>
                                    
                                    {/* Imprime o input de alterar quantidade do servico diretamente na celula. */}
                                    <td data-label="Quantidade">
                                        <input
                                            className={css.inputQuantidade}
                                            type="number"
                                            min="1"
                                            value={quantidadesItens[item.id_item] || ""}
                                            onChange={(e) =>
                                                setQuantidadesItens((atuais) => ({
                                                    ...atuais,
                                                    [item.id_item]: e.target.value
                                                }))
                                            }
                                        />
                                    </td>
                                    
                                    {/* Imprime o custo unitario fixado na hora em que o servico foi inserido. */}
                                    <td data-label="Unitário">{formatarMoeda(item.valor_unitario)}</td>
                                    
                                    {/* Imprime o subtotal multiplicando o unitario pela quantidade. */}
                                    <td data-label="Total" className={css.valor}>{formatarMoeda(item.total)}</td>
                                    
                                    {/* Agrupa os botoes de acoes para salvar a nova qtde ou excluir definitivamente o item da manutencao. */}
                                    <td data-label="Ações">
                                        <div className={css.acoes}>
                                            <button type="button" className={css.btnEditar} onClick={() => editarItem(item.id_item)}>
                                                Salvar
                                            </button>
                                            <button type="button" className={css.btnExcluir} onClick={() => pedirExclusaoItem(item.id_item)}>
                                                Excluir
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            <ModalConfirmacao
                aberto={Boolean(confirmacao)}
                titulo={confirmacao?.titulo}
                texto={confirmacao?.texto}
                textoConfirmar={confirmacao?.textoConfirmar}
                carregando={confirmandoAcao}
                onCancelar={() => setConfirmacao(null)}
                onConfirmar={() => {
                    if (confirmacao?.tipo === "manutencao") {
                        excluirManutencao(confirmacao.id);
                        return;
                    }

                    if (confirmacao?.tipo === "item") {
                        excluirItem(confirmacao.id);
                    }
                }}
            />
        </main>
    );
}

export default CadastroManutencao;
