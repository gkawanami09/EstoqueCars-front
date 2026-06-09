// Importa hooks do React usados para estado, carregamento da tela e calculos.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa os estilos dessa pagina.
import css from "./CadastroManutencao.module.css";
// Importa o modal usado para confirmar exclusoes.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao.jsx";
// Importa recursos de ../components/Paginacao/Paginacao.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados;
    }

    // Testa cada nome de chave possivel enviado pela API.
    for (const chave of chaves) {
        // Se a chave existir e for lista, retorna essa lista.
        if (Array.isArray(dados?.[chave])) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Separa data e hora do valor datetime-local.
    const [data, hora = "00:00"] = valor.split("T");
    // Separa ano, mes e dia.
    const [ano, mes, dia] = data.split("-");

    // Se a data estiver incompleta, devolve o valor original.
    if (!ano || !mes || !dia) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Garante uma quantidade numerica valida para servicos da manutencao.
function normalizarQuantidadeServico(valor) {
    // Declara quantidade para uso neste fluxo.
    const quantidade = Number(valor || 1);
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return quantidade > 0 ? quantidade : 1;
}

// Monta o header Authorization quando existe token salvo.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Monta headers para rotas que recebem JSON.
function headersJsonAutenticado() {
    // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }

    // Tenta executar a operação e permite tratar possíveis falhas.
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
        // Declara mapa para uso neste fluxo.
        const mapa = new Map();
        // Executa forEach nesta etapa do fluxo.
        servicos.forEach((servico) => mapa.set(String(servico.id), servico));
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return mapa;
    }, [servicos]);

    // Filtra os veiculos que aparecem no autocomplete.
    const veiculosFiltrados = useMemo(() => {
        // Normaliza a busca para comparar sem maiuscula/minuscula.
        const termo = buscaVeiculo.trim().toLowerCase();
        // Se tiver termo, filtra; se nao tiver, mostra todos.
        const lista = termo
            ? veiculos.filter((veiculo) => {
                // Declara campos para uso neste fluxo.
                const campos = [veiculo.label, veiculo.placa, veiculo.modelo, veiculo.marca];
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return manutencoes;
        }

        // Procura o texto nos dados da manutencao e nos servicos.
        return manutencoes.filter((manutencao) => {
            // Declara campos para uso neste fluxo.
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

            // Retorna o resultado desta função ou o conteúdo visual da página.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [buscaTexto, manutencoes]);

    // Total de paginas considerando os filtros atuais.
    const totalPaginas = Math.max(1, Math.ceil(manutencoesFiltradas.length / ITENS_POR_PAGINA));

    // Mantem a pagina atual dentro do limite quando a lista muda.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) {
            // Atualiza o estado por meio de setPaginaAtual.
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Mostra somente as manutencoes da pagina atual.
    const manutencoesPaginadas = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return manutencoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [manutencoesFiltradas, paginaAtual]);

    // Calcula o total do formulario antes de salvar.
    const totalFormulario = useMemo(() => {
        // Retorna o resultado desta função ou o conteúdo visual da página.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Declara texto para uso neste fluxo.
                const texto = dados.mensagem || dados.erro || "";

                // Se a API disser que nao existe nenhuma, a tabela fica vazia.
                if (resposta.status === 404 && texto.toLowerCase().includes("nenhuma")) {
                    // Atualiza o estado por meio de setManutencoes.
                    setManutencoes([]);
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Qualquer outro erro aparece como alerta na tela.
                setMensagem({
                    tipo: "erro",
                    texto: texto || "Não foi possível carregar as manutenções."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setVeiculos.
                setVeiculos([]);
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Tenta executar a operação e permite tratar possíveis falhas.
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
                    // Declara lista para uso neste fluxo.
                    const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                    // Atualiza o estado por meio de setServicos.
                    setServicos(lista.filter((servico) => servico.id));
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }
            } catch {
                // Se uma rota falhar, tenta a proxima.
                setServicos([]);
            }
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Declara lista para uso neste fluxo.
                const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                // Atualiza o estado por meio de setServicos.
                setServicos(lista.filter((servico) => servico.id));
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Liga carregamento da tabela de itens.
        setCarregandoItens(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Declara texto para uso neste fluxo.
                const texto = dados.mensagem || dados.erro || "";

                // Se nao tiver item cadastrado, apenas limpa a lista.
                if (resposta.status === 404 && texto.toLowerCase().includes("nenhum")) {
                    // Atualiza o estado por meio de setItens.
                    setItens([]);
                    // Atualiza o estado por meio de setQuantidadesItens.
                    setQuantidadesItens({});
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Outros erros aparecem na mensagem visual.
                setMensagem({
                    tipo: "erro",
                    texto: texto || "Não foi possível carregar os itens da manutenção."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Executa carregarManutencoes nesta etapa do fluxo.
        carregarManutencoes();
        // Executa carregarVeiculos nesta etapa do fluxo.
        carregarVeiculos();
        // Executa carregarServicos nesta etapa do fluxo.
        carregarServicos();
    }, [carregarManutencoes, carregarServicos, carregarVeiculos]);

    // Atualiza um campo simples do formulario principal.
    function atualizarCampo(campo, valor) {
        // Atualiza o estado por meio de setFormulario.
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
        // Atualiza o estado por meio de setFormulario.
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: (() => {
                // Declara servicosAtualizados para uso neste fluxo.
                const servicosAtualizados = dadosAtuais.servicos.map((servico, posicao) =>
                    posicao === index ? { ...servico, [campo]: valor } : servico
                );

                // Verifica esta condição antes de continuar o fluxo.
                if (campo !== "id_servico" || !String(valor).trim()) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return servicosAtualizados;
                }

                // Declara posicaoDuplicada para uso neste fluxo.
                const posicaoDuplicada = servicosAtualizados.findIndex((servico, posicao) =>
                    posicao !== index && String(servico.id_servico) === String(valor)
                );

                // Verifica esta condição antes de continuar o fluxo.
                if (posicaoDuplicada === -1) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return servicosAtualizados;
                }

                // Retorna o resultado desta função ou o conteúdo visual da página.
                return servicosAtualizados
                    .map((servico, posicao) => {
                        // Verifica esta condição antes de continuar o fluxo.
                        if (posicao !== posicaoDuplicada) {
                            // Retorna o resultado desta função ou o conteúdo visual da página.
                            return servico;
                        }

                        // Declara quantidadeAtual para uso neste fluxo.
                        const quantidadeAtual = normalizarQuantidadeServico(servico.quantidade);
                        // Declara quantidadeRepetida para uso neste fluxo.
                        const quantidadeRepetida = normalizarQuantidadeServico(servicosAtualizados[index]?.quantidade);

                        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Atualiza o estado por meio de setFormulario.
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: [...dadosAtuais.servicos, { id_servico: "", quantidade: "1" }]
        }));
    }

    // Remove uma linha de servico do formulario.
    function removerServicoFormulario(index) {
        // Atualiza o estado por meio de setFormulario.
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: dadosAtuais.servicos.filter((_, posicao) => posicao !== index)
        }));
    }

    // Limpa o formulario principal e a mensagem.
    function limparFormulario() {
        // Atualiza o estado por meio de setFormulario.
        setFormulario(formularioInicial());
        // Atualiza o estado por meio de setBuscaVeiculo.
        setBuscaVeiculo("");
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);
    }

    // Converte os servicos do formulario para o JSON esperado pela API.
    function montarServicosPayload() {
        // Declara servicosAgrupados para uso neste fluxo.
        const servicosAgrupados = new Map();

        // Executa forEach nesta etapa do fluxo.
        formulario.servicos
            .filter((servico) => String(servico.id_servico).trim())
            .forEach((servico) => {
                // Declara idServico para uso neste fluxo.
                const idServico = Number(servico.id_servico);
                // Declara quantidade para uso neste fluxo.
                const quantidade = normalizarQuantidadeServico(servico.quantidade);
                // Declara quantidadeAtual para uso neste fluxo.
                const quantidadeAtual = servicosAgrupados.get(idServico) || 0;

                // Atualiza o estado por meio de set.
                servicosAgrupados.set(idServico, quantidadeAtual + quantidade);
            });

        // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Selecione um veículo da lista, informe a data e escolha pelo menos um serviço."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível salvar a manutenção."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Atualiza o estado por meio de setConfirmacao.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível excluir a manutenção."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Selecione uma manutenção e um serviço para adicionar."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Liga carregamento do botao adicionar item.
        setSalvandoItem(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível adicionar o item."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Executa carregarManutencoes nesta etapa do fluxo.
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
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Informe uma quantidade valida para atualizar o item."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível editar o item."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item atualizado com sucesso."
            });
            // Recarrega itens e manutencoes para atualizar valores.
            await carregarItens(manutencaoSelecionada.id_manutencao);
            // Executa carregarManutencoes nesta etapa do fluxo.
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
        // Atualiza o estado por meio de setConfirmacao.
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

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível excluir o item."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Executa carregarManutencoes nesta etapa do fluxo.
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
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Informe um serviço para consultar o histórico."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Liga carregamento do botao consultar.
        setCarregandoHistorico(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
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
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Nenhum histórico encontrado."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_agendada;
        }

        // Data e hora atual.
        const agora = new Date();
        // Periodo de sete dias usado para marcar como "Proxima".
        const seteDias = 7 * 24 * 60 * 60 * 1000;

        // Se a data ja passou, aparece como realizada.
        if (dataAgendada < agora) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_realizada;
        }

        // Se esta dentro dos proximos sete dias, aparece como proxima.
        if (dataAgendada.getTime() - agora.getTime() <= seteDias) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Realizada";
        }

        // Classe proxima vira texto "Proxima".
        if (classeStatus(data) === css.status_proxima) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
                {/* Agrupa os elementos desta parte da interface. */}
                <div>
                    {/* Exibe o título principal desta página. */}
                    <h1 className={css.titulo}>Manutenções</h1>
                    {/* Exibe esta mensagem ou informação. */}
                    <p className={css.subtitulo}>Agende serviços, acompanhe itens e consulte o histórico de valores.</p>
                </div>

                {/* Exibe este botão de ação. */}
                <button type="button" className={css.botaoSecundario} onClick={carregarManutencoes}>
                    Atualizar lista
                </button>
            </header>

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
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atenção"}</strong>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>{mensagem.texto}</span>
                    </div>
                    {/* Exibe este botão de ação. */}
                    <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                        x
                    </button>
                </div>
            )}

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.areaFormulario}>
                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formulario} onSubmit={salvarManutencao}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.formCabecalho}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div>
                            {/* Exibe o título desta seção. */}
                            <h2>{formulario.id_manutencao ? "Editar agendamento" : "Novo agendamento"}</h2>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Escolha a data, o horário e os serviços que serão feitos no veículo.</span>
                        </div>
                        {/* Renderiza o elemento strong nesta parte da página. */}
                        <strong>{formatarMoeda(totalFormulario)}</strong>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.gridCampos}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={`${css.campo} ${css.campoAutocomplete}`}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Veículo</span>
                            {/* Exibe este campo de entrada de dados. */}
                            <input
                                type="text"
                                value={buscaVeiculo}
                                onChange={(e) => atualizarBuscaVeiculo(e.target.value)}
                                onFocus={() => setMostrarSugestoesVeiculos(true)}
                                onBlur={() => setMostrarSugestoesVeiculos(false)}
                                placeholder="Busque por placa, modelo ou marca"
                                autoComplete="off"
                            />
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {mostrarSugestoesVeiculos && (
                                <div className={css.listaAutocomplete}>
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {veiculosFiltrados.length > 0 ? (
                                        veiculosFiltrados.map((veiculo) => (
                                            <button
                                                key={veiculo.id}
                                                type="button"
                                                onMouseDown={(e) => {
                                                    // Executa preventDefault nesta etapa do fluxo.
                                                    e.preventDefault();
                                                    // Executa selecionarVeiculo nesta etapa do fluxo.
                                                    selecionarVeiculo(veiculo);
                                                }}
                                            >
                                                {/* Renderiza o elemento strong nesta parte da página. */}
                                                <strong>{veiculo.placa || "Sem placa"}</strong>
                                                {/* Renderiza o elemento span nesta parte da página. */}
                                                <span>{[veiculo.modelo, veiculo.marca].filter(Boolean).join(" - ") || veiculo.label}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className={css.autocompleteVazio}>Nenhum veículo encontrado</div>
                                    )}
                                </div>
                            )}
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {formulario.id_veiculo && (
                                <small className={css.campoAjuda}>Veículo selecionado para este agendamento.</small>
                            )}
                        </div>

                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Data e hora</span>
                            {/* Exibe este campo de entrada de dados. */}
                            <input
                                type="datetime-local"
                                value={formulario.data_manutencao}
                                onChange={(e) => atualizarCampo("data_manutencao", e.target.value)}
                            />
                        </label>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.listaServicos}>
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {formulario.servicos.map((item, index) => {
                            // Declara servico para uso neste fluxo.
                            const servico = servicosPorId.get(String(item.id_servico));
                            // Declara subtotal para uso neste fluxo.
                            const subtotal = Number(servico?.valor || 0) * Number(item.quantidade || 0);

                            // Retorna o resultado desta função ou o conteúdo visual da página.
                            return (
                                <div key={`${item.id_servico}-${index}`} className={css.linhaServico}>
                                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                                    <label className={css.campo}>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Serviço</span>
                                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                        {servicos.length > 0 ? (
                                            <select
                                                value={item.id_servico}
                                                onChange={(e) => atualizarServicoFormulario(index, "id_servico", e.target.value)}
                                            >
                                                {/* Renderiza o elemento option nesta parte da página. */}
                                                <option value="">Selecione</option>
                                                {/* Percorre os dados para renderizar os itens desta área. */}
                                                {servicos.map((servicoOpcao) => (
                                                    <option key={servicoOpcao.id} value={servicoOpcao.id}>
                                                        {/* Percorre os dados para renderizar os itens desta área. */}
                                                        {servicoOpcao.nome} - {formatarMoeda(servicoOpcao.valor)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select value="" disabled>
                                                {/* Renderiza o elemento option nesta parte da página. */}
                                                <option>Nenhum serviço carregado</option>
                                            </select>
                                        )}
                                    </label>

                                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                                    <label className={css.campo}>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Quantidade</span>
                                        {/* Exibe este campo de entrada de dados. */}
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantidade}
                                            onChange={(e) => atualizarServicoFormulario(index, "quantidade", e.target.value)}
                                        />
                                    </label>

                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.subtotalServico}>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Subtotal</span>
                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                        <strong>{formatarMoeda(subtotal)}</strong>
                                    </div>

                                    {/* Exibe este botão de ação. */}
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

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.botoesFormulario}>
                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.botaoSecundario} onClick={adicionarServicoFormulario}>
                            Adicionar serviço
                        </button>
                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.botaoSecundario} onClick={limparFormulario}>
                            Limpar
                        </button>
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.botaoPrimario} disabled={salvando}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {salvando ? "Salvando..." : formulario.id_manutencao ? "Salvar edição" : "Agendar manutenção"}
                        </button>
                    </div>
                </form>

                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.painelHistorico} onSubmit={buscarHistorico}>
                    {/* Exibe o título desta seção. */}
                    <h2>Histórico de preço</h2>
                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Serviço</span>
                        {/* Exibe uma lista de opções para seleção. */}
                        <select
                            value={servicoHistorico}
                            onChange={(e) => setServicoHistorico(e.target.value)}
                            disabled={servicos.length === 0}
                        >
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="">{servicos.length > 0 ? "Selecione um serviço" : "Nenhum serviço carregado"}</option>
                            {/* Percorre os dados para renderizar os itens desta área. */}
                            {servicos.map((servico) => (
                                <option key={servico.id} value={servico.id}>
                                    {servico.nome}
                                </option>
                            ))}
                        </select>
                    </label>
                    {/* Exibe este botão de ação. */}
                    <button type="submit" className={css.botaoPrimario} disabled={carregandoHistorico || servicos.length === 0}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {carregandoHistorico ? "Buscando..." : "Consultar"}
                    </button>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.listaHistorico}>
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {historico.map((registro, index) => (
                            <div key={`${registro.data_alteracao}-${index}`} className={css.itemHistorico}>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>{registro.data_alteracao}</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{formatarMoeda(registro.valor_antigo)}</strong>
                            </div>
                        ))}
                    </div>
                </form>
            </section>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.buscaAvancada}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.buscaTexto}>
                    {/* Exibe esta imagem na interface. */}
                    <img src="/IconBusca.png" alt="Buscar" />
                    {/* Exibe este campo de entrada de dados. */}
                    <input
                        type="text"
                        placeholder="Buscar por placa, modelo, marca, data ou serviço"
                        value={buscaTexto}
                        onChange={(e) => {
                            // Atualiza o estado por meio de setBuscaTexto.
                            setBuscaTexto(e.target.value);
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                    />
                </div>
                {/* Exibe este botão de ação. */}
                <button
                    type="button"
                    className={css.botaoSecundario}
                    onClick={() => {
                        // Atualiza o estado por meio de setBuscaTexto.
                        setBuscaTexto("");
                        // Atualiza o estado por meio de setPaginaAtual.
                        setPaginaAtual(1);
                    }}
                >
                    Limpar busca
                </button>
            </section>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.tabelaContainer}>
                {/* Exibe os dados em formato de tabela. */}
                <table className={css.tabela}>
                    {/* Renderiza o elemento thead nesta parte da página. */}
                    <thead>
                    {/* Renderiza o elemento tr nesta parte da página. */}
                    <tr>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Veículo</th>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Placa</th>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Data</th>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Total</th>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Status</th>
                        {/* Renderiza o elemento th nesta parte da página. */}
                        <th>Ações</th>
                    </tr>
                    </thead>
                    {/* Renderiza o elemento tbody nesta parte da página. */}
                    <tbody>
                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {carregando && (
                        <tr>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td colSpan="6" className={css.celulaVazia}>Carregando manutenções...</td>
                        </tr>
                    )}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && manutencoesFiltradas.length === 0 && (
                        <tr>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td colSpan="6" className={css.celulaVazia}>Nenhuma manutenção encontrada</td>
                        </tr>
                    )}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && manutencoesPaginadas.map((manutencao) => (
                        <tr key={manutencao.id_manutencao}>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Veículo">
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{manutencao.modelo || "Veículo"}</strong>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={css.textoApoio}>{manutencao.marca}</span>
                            </td>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Placa">{manutencao.placa || "-"}</td>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Data">{manutencao.data || "-"}</td>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Total" className={css.valor}>{formatarMoeda(manutencao.valor_total)}</td>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Status">
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={`${css.status} ${classeStatus(manutencao.data)}`}>
                                    {/* Percorre os dados para renderizar os itens desta área. */}
                                    {textoStatus(manutencao.data)}
                                </span>
                            </td>
                            {/* Renderiza o elemento td nesta parte da página. */}
                            <td data-label="Ações">
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div className={css.acoes}>
                                    {/* Exibe este botão de ação. */}
                                    <button type="button" className={css.btnDetalhes} onClick={() => selecionarManutencao(manutencao)}>
                                        Itens
                                    </button>
                                    {/* Exibe este botão de ação. */}
                                    <button type="button" className={css.btnEditar} onClick={() => editarManutencao(manutencao)}>
                                        Editar
                                    </button>
                                    {/* Exibe este botão de ação. */}
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

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {!carregando && manutencoesFiltradas.length > 0 && (
                <div className={css.paginacaoArea}>
                    {/* Renderiza o componente Paginacao nesta parte da página. */}
                    <Paginacao
                        paginaAtual={paginaAtual}
                        totalItens={manutencoesFiltradas.length}
                        onMudarPagina={setPaginaAtual}
                    />
                </div>
            )}

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {manutencaoSelecionada && (
                <section className={css.painelItens}>
                    {/* Exibe o cabeçalho desta área. */}
                    <header className={css.painelItensCabecalho}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div>
                            {/* Exibe o título desta seção. */}
                            <h2>Itens da manutenção</h2>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>{manutencaoSelecionada.modelo} {manutencaoSelecionada.placa ? `- ${manutencaoSelecionada.placa}` : ""}</span>
                        </div>
                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.botaoSecundario} onClick={() => setManutencaoSelecionada(null)}>
                            Fechar
                        </button>
                    </header>

                    {/* Agrupa os campos e ações deste formulário. */}
                    <form className={css.formItem} onSubmit={adicionarItem}>
                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Serviço</span>
                            {/* Renderiza o select com a lista de servicos disponiveis, ou desabilita caso a API ainda nao tenha carregado ou falhado. */}
                            {servicos.length > 0 ? (
                                <select
                                    value={itemFormulario.id_servico}
                                    onChange={(e) => setItemFormulario((atual) => ({ ...atual, id_servico: e.target.value }))}
                                >
                                    {/* Renderiza o elemento option nesta parte da página. */}
                                    <option value="">Selecione</option>
                                    {/* Percorre os dados para renderizar os itens desta área. */}
                                    {servicos.map((servico) => (
                                        <option key={servico.id} value={servico.id}>
                                            {/* Percorre os dados para renderizar os itens desta área. */}
                                            {servico.nome} - {formatarMoeda(servico.valor)}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select value="" disabled>
                                    {/* Renderiza o elemento option nesta parte da página. */}
                                    <option>Nenhum serviço carregado</option>
                                </select>
                            )}
                        </label>
                        
                        {/* Campo para inputar a quantidade daquele servico que vai ser adicionado. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Quantidade</span>
                            {/* Exibe este campo de entrada de dados. */}
                            <input
                                type="number"
                                min="1"
                                value={itemFormulario.quantidade}
                                onChange={(e) => setItemFormulario((atual) => ({ ...atual, quantidade: e.target.value }))}
                            />
                        </label>

                        {/* Botao de submit do formulario para acionar a rota de adicao do item na API. Desativa enquanto carrega ou se nao tiver servico selecionavel. */}
                        <button type="submit" className={css.botaoPrimario} disabled={salvandoItem || servicos.length === 0}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {salvandoItem ? "Adicionando..." : "Adicionar item"}
                        </button>
                    </form>

                    {/* Container da tabela listando os itens ja adicionados na manutencao selecionada. */}
                    <div className={css.tabelaItensContainer}>
                        {/* Exibe os dados em formato de tabela. */}
                        <table className={css.tabela}>
                            {/* Cabecalho da tabela dos servicos prestados naquela manutencao especifica. */}
                            <thead>
                            {/* Renderiza o elemento tr nesta parte da página. */}
                            <tr>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Serviço</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Quantidade</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Unitário</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Total</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Ações</th>
                            </tr>
                            </thead>
                            {/* Renderiza o elemento tbody nesta parte da página. */}
                            <tbody>
                            {/* Mostra mensagem visual enquanto aguarda retorno da rota de listagem de itens da manutencao. */}
                            {carregandoItens && (
                                <tr>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td colSpan="5" className={css.celulaVazia}>Carregando itens...</td>
                                </tr>
                            )}

                            {/* Mostra mensagem indicando que a lista esta vazia, se a API retornou sem erros porem sem itens. */}
                            {!carregandoItens && itens.length === 0 && (
                                <tr>
                                    {/* Renderiza o elemento td nesta parte da página. */}
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
                                        {/* Exibe este campo de entrada de dados. */}
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
                                        {/* Agrupa os elementos desta parte da interface. */}
                                        <div className={css.acoes}>
                                            {/* Exibe este botão de ação. */}
                                            <button type="button" className={css.btnEditar} onClick={() => editarItem(item.id_item)}>
                                                Salvar
                                            </button>
                                            {/* Exibe este botão de ação. */}
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

            {/* Renderiza o componente ModalConfirmacao nesta parte da página. */}
            <ModalConfirmacao
                aberto={Boolean(confirmacao)}
                titulo={confirmacao?.titulo}
                texto={confirmacao?.texto}
                textoConfirmar={confirmacao?.textoConfirmar}
                carregando={confirmandoAcao}
                onCancelar={() => setConfirmacao(null)}
                onConfirmar={() => {
                    // Verifica esta condição antes de continuar o fluxo.
                    if (confirmacao?.tipo === "manutencao") {
                        // Executa excluirManutencao nesta etapa do fluxo.
                        excluirManutencao(confirmacao.id);
                        // Retorna o resultado desta função ou o conteúdo visual da página.
                        return;
                    }

                    // Verifica esta condição antes de continuar o fluxo.
                    if (confirmacao?.tipo === "item") {
                        // Executa excluirItem nesta etapa do fluxo.
                        excluirItem(confirmacao.id);
                    }
                }}
            />
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CadastroManutencao;
