import { useCallback, useEffect, useMemo, useState } from "react";
import css from "./CadastroManutencao.module.css";
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao.jsx";

const formularioInicial = () => ({
    id_manutencao: null,
    id_veiculo: "",
    data_manutencao: "",
    servicos: [{ id_servico: "", quantidade: "1" }]
});

const itemInicial = {
    id_servico: "",
    quantidade: "1"
};

function extrairLista(dados, chaves) {
    if (Array.isArray(dados)) {
        return dados;
    }

    for (const chave of chaves) {
        if (Array.isArray(dados?.[chave])) {
            return dados[chave];
        }
    }

    return [];
}

function normalizarServico(servico) {
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id ?? servico.idServico;
    const nome =
        servico.nome_servico ??
        servico.NOME_SERVICO ??
        servico.descricao ??
        servico.nome ??
        servico.nomeServico ??
        servico.servico ??
        `Servico ${id || ""}`;
    const valor = servico.valor ?? servico.VALOR ?? servico.preco ?? servico.valor_unitario ?? 0;

    return {
        id: String(id ?? ""),
        nome: String(nome || "Servico"),
        valor: Number(valor || 0)
    };
}

function normalizarVeiculo(veiculo) {
    const id = veiculo.id_veiculo ?? veiculo.ID_VEICULO ?? veiculo.id ?? veiculo.id_carro;
    const marca = veiculo.marca ?? veiculo.MARCA ?? "";
    const modelo = veiculo.modelo ?? veiculo.MODELO ?? veiculo.nome ?? "";
    const placa = veiculo.placa ?? veiculo.PLACA ?? "";

    return {
        id: String(id ?? ""),
        marca,
        modelo,
        placa,
        label: [placa, modelo, marca].filter(Boolean).join(" - ") || `Veiculo ${id || ""}`
    };
}

function normalizarManutencao(manutencao) {
    const id = manutencao.id_manutencao ?? manutencao.ID_MANUTENCAO ?? manutencao.id;
    const servicosRealizados = manutencao.servicos_realizados ?? manutencao.servicos ?? [];

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

function normalizarItem(item) {
    const id = item.id_item ?? item.ID_ITEM ?? item.id;
    const quantidade = Number(item.quantidade ?? item.QUANTIDADE ?? 1);
    const valorUnitario = Number(item.valor_unitario ?? item.valor_cobrado ?? item.VALOR_COBRADO ?? 0);

    return {
        id_item: id,
        id_manutencao: item.id_manutencao ?? item.ID_MANUTENCAO,
        id_servico: item.id_servico ?? item.ID_SERVICO,
        nome_servico: item.nome_servico ?? item.servico ?? item.NOME_SERVICO ?? "Servico",
        quantidade,
        valor_unitario: valorUnitario,
        total: Number(item.total ?? quantidade * valorUnitario)
    };
}

function normalizarHistorico(registro) {
    return {
        servico: registro.servico ?? registro.nome_servico ?? registro.NOME_SERVICO ?? "Servico",
        valor_antigo: Number(registro.valor_antigo ?? registro.valor_unitario ?? registro.VALOR_UNITARIO ?? 0),
        data_alteracao: registro.data_alteracao ?? registro.data_historico ?? registro.DATA_HISTORICO ?? ""
    };
}

function inputParaDataBr(valor) {
    if (!valor) {
        return "";
    }

    const [data, hora = "00:00"] = valor.split("T");
    const [ano, mes, dia] = data.split("-");

    if (!ano || !mes || !dia) {
        return valor;
    }

    return `${dia}/${mes}/${ano} ${hora.slice(0, 5)}`;
}

function dataBrParaInput(valor) {
    const data = String(valor || "");
    const partes = data.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    if (!partes) {
        return "";
    }

    return `${partes[3]}-${partes[2]}-${partes[1]}T${partes[4]}:${partes[5]}`;
}

function dataBrParaDate(valor) {
    const partes = String(valor || "").match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    if (!partes) {
        return null;
    }

    return new Date(
        Number(partes[3]),
        Number(partes[2]) - 1,
        Number(partes[1]),
        Number(partes[4]),
        Number(partes[5])
    );
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function lerRespostaJson(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {};
    }
}

function CadastroManutencao({ API }) {
    const [manutencoes, setManutencoes] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [formulario, setFormulario] = useState(formularioInicial);
    const [itemFormulario, setItemFormulario] = useState(itemInicial);
    const [manutencaoSelecionada, setManutencaoSelecionada] = useState(null);
    const [itens, setItens] = useState([]);
    const [quantidadesItens, setQuantidadesItens] = useState({});
    const [buscaTexto, setBuscaTexto] = useState("");
    const [buscaVeiculo, setBuscaVeiculo] = useState("");
    const [mostrarSugestoesVeiculos, setMostrarSugestoesVeiculos] = useState(false);
    const [servicoHistorico, setServicoHistorico] = useState("");
    const [historico, setHistorico] = useState([]);
    const [mensagem, setMensagem] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [carregandoItens, setCarregandoItens] = useState(false);
    const [salvandoItem, setSalvandoItem] = useState(false);
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);
    const [confirmacao, setConfirmacao] = useState(null);
    const [confirmandoAcao, setConfirmandoAcao] = useState(false);

    const servicosPorId = useMemo(() => {
        const mapa = new Map();
        servicos.forEach((servico) => mapa.set(String(servico.id), servico));
        return mapa;
    }, [servicos]);

    const veiculosFiltrados = useMemo(() => {
        const termo = buscaVeiculo.trim().toLowerCase();
        const lista = termo
            ? veiculos.filter((veiculo) => {
                const campos = [veiculo.label, veiculo.placa, veiculo.modelo, veiculo.marca];
                return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
            })
            : veiculos;

        return lista.slice(0, 6);
    }, [buscaVeiculo, veiculos]);

    const manutencoesFiltradas = useMemo(() => {
        const termo = buscaTexto.trim().toLowerCase();

        if (!termo) {
            return manutencoes;
        }

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

    const totalFormulario = useMemo(() => {
        return formulario.servicos.reduce((total, item) => {
            const servico = servicosPorId.get(String(item.id_servico));
            const valor = Number(servico?.valor || 0);
            const quantidade = Number(item.quantidade || 0);

            return total + valor * quantidade;
        }, 0);
    }, [formulario.servicos, servicosPorId]);

    const carregarManutencoes = useCallback(async () => {
        setCarregando(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/listar_manutencao`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                const texto = dados.mensagem || dados.erro || "";

                if (resposta.status === 404 && texto.toLowerCase().includes("nenhuma")) {
                    setManutencoes([]);
                    return;
                }

                setMensagem({
                    tipo: "erro",
                    texto: texto || "Nao foi possivel carregar as manutencoes."
                });
                return;
            }

            setManutencoes(extrairLista(dados, ["manutencoes", "manutencao"]).map(normalizarManutencao));
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setCarregando(false);
        }
    }, [API]);

    const carregarVeiculos = useCallback(async () => {
        try {
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setVeiculos([]);
                return;
            }

            setVeiculos(extrairLista(dados, ["carros", "veiculos", "veiculo"]).map(normalizarVeiculo));
        } catch {
            setVeiculos([]);
        }
    }, [API]);

    const carregarServicos = useCallback(async () => {
        const rotas = ["/listar_servico", "/listar_servicos", "/servicos"];

        for (const rota of rotas) {
            try {
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    credentials: "include"
                });
                const dados = await lerRespostaJson(resposta);

                if (resposta.ok) {
                    const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                    setServicos(lista.filter((servico) => servico.id));
                    return;
                }
            } catch {
                setServicos([]);
            }
        }

        try {
            const resposta = await fetch(`${API}/buscar_servico`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({})
            });
            const dados = await lerRespostaJson(resposta);

            if (resposta.ok) {
                const lista = extrairLista(dados, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico);
                setServicos(lista.filter((servico) => servico.id));
                return;
            }
        } catch {
            setServicos([]);
        }

        setServicos([]);
    }, [API]);

    const carregarItens = useCallback(async (idManutencao) => {
        if (!idManutencao) {
            return;
        }

        setCarregandoItens(true);

        try {
            const resposta = await fetch(`${API}/listar_item_manutencao/${idManutencao}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                const texto = dados.mensagem || dados.erro || "";

                if (resposta.status === 404 && texto.toLowerCase().includes("nenhum")) {
                    setItens([]);
                    setQuantidadesItens({});
                    return;
                }

                setMensagem({
                    tipo: "erro",
                    texto: texto || "Nao foi possivel carregar os itens da manutencao."
                });
                return;
            }

            const lista = extrairLista(dados, ["itens", "items"]).map(normalizarItem);
            setItens(lista);
            setQuantidadesItens(
                lista.reduce((acumulado, item) => ({
                    ...acumulado,
                    [item.id_item]: String(item.quantidade)
                }), {})
            );
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setCarregandoItens(false);
        }
    }, [API]);

    useEffect(() => {
        carregarManutencoes();
        carregarVeiculos();
        carregarServicos();
    }, [carregarManutencoes, carregarServicos, carregarVeiculos]);

    function atualizarCampo(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    function atualizarBuscaVeiculo(valor) {
        setBuscaVeiculo(valor);

        const termo = valor.trim().toLowerCase();
        const veiculoEncontrado = veiculos.find((veiculo) =>
            String(veiculo.label).toLowerCase() === termo ||
            String(veiculo.placa).toLowerCase() === termo
        );

        atualizarCampo("id_veiculo", veiculoEncontrado?.id || "");
    }

    function selecionarVeiculo(veiculo) {
        setBuscaVeiculo(veiculo.label);
        atualizarCampo("id_veiculo", veiculo.id);
        setMostrarSugestoesVeiculos(false);
    }

    function atualizarServicoFormulario(index, campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: dadosAtuais.servicos.map((servico, posicao) =>
                posicao === index ? { ...servico, [campo]: valor } : servico
            )
        }));
    }

    function adicionarServicoFormulario() {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: [...dadosAtuais.servicos, { id_servico: "", quantidade: "1" }]
        }));
    }

    function removerServicoFormulario(index) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            servicos: dadosAtuais.servicos.filter((_, posicao) => posicao !== index)
        }));
    }

    function limparFormulario() {
        setFormulario(formularioInicial());
        setBuscaVeiculo("");
        setMensagem(null);
    }

    function montarServicosPayload() {
        return formulario.servicos
            .filter((servico) => String(servico.id_servico).trim())
            .map((servico) => ({
                id_servico: Number(servico.id_servico),
                quantidade: Number(servico.quantidade || 1)
            }));
    }

    async function salvarManutencao(e) {
        e.preventDefault();
        setMensagem(null);

        const servicosPayload = montarServicosPayload();

        if (!String(formulario.id_veiculo).trim() || !formulario.data_manutencao || servicosPayload.length === 0) {
            setMensagem({
                tipo: "erro",
                texto: "Selecione um veiculo da lista, informe a data e escolha pelo menos um servico."
            });
            return;
        }

        const dataBr = inputParaDataBr(formulario.data_manutencao);
        const payload = {
            id_veiculo: Number(formulario.id_veiculo),
            data_manutencao: dataBr,
            data_nova: dataBr,
            servico: servicosPayload,
            servicos: servicosPayload
        };

        const estaEditando = Boolean(formulario.id_manutencao);
        const rota = estaEditando
            ? `${API}/editar_manutencao/${formulario.id_manutencao}`
            : `${API}/cadastrar_manutencao`;

        setSalvando(true);

        try {
            const resposta = await fetch(rota, {
                method: estaEditando ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel salvar a manutencao."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Manutencao salva com sucesso."
            });
            setFormulario(formularioInicial());
            setBuscaVeiculo("");
            await carregarManutencoes();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setSalvando(false);
        }
    }

    function editarManutencao(manutencao) {
        const veiculoEncontrado = veiculos.find((veiculo) =>
            veiculo.placa && manutencao.placa && String(veiculo.placa).toUpperCase() === String(manutencao.placa).toUpperCase()
        );

        const servicosManutencao = manutencao.servicos_realizados.length > 0
            ? manutencao.servicos_realizados.map((item) => {
                const servicoEncontrado = servicos.find((servico) =>
                    String(servico.nome).toLowerCase() === String(item.servico || item.nome_servico || "").toLowerCase()
                );

                return {
                    id_servico: servicoEncontrado?.id || "",
                    quantidade: String(item.quantidade || 1)
                };
            })
            : [{ id_servico: "", quantidade: "1" }];

        setFormulario({
            id_manutencao: manutencao.id_manutencao,
            id_veiculo: veiculoEncontrado?.id || "",
            data_manutencao: dataBrParaInput(manutencao.data),
            servicos: servicosManutencao
        });
        setBuscaVeiculo(veiculoEncontrado?.label || [manutencao.placa, manutencao.modelo, manutencao.marca].filter(Boolean).join(" - "));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function pedirExclusaoManutencao(idManutencao) {
        setConfirmacao({
            tipo: "manutencao",
            id: idManutencao,
            titulo: "Cancelar agendamento",
            texto: "Deseja cancelar este agendamento de manutencao?",
            textoConfirmar: "Cancelar agendamento"
        });
    }

    async function excluirManutencao(idManutencao) {
        setConfirmandoAcao(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/deletar_manutencao/${idManutencao}`, {
                method: "DELETE",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel excluir a manutencao."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Manutencao excluida com sucesso."
            });
            setManutencaoSelecionada((atual) =>
                atual?.id_manutencao === idManutencao ? null : atual
            );
            setConfirmacao(null);
            await carregarManutencoes();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setConfirmandoAcao(false);
        }
    }

    async function selecionarManutencao(manutencao) {
        setManutencaoSelecionada(manutencao);
        setItemFormulario(itemInicial);
        await carregarItens(manutencao.id_manutencao);
    }

    async function adicionarItem(e) {
        e.preventDefault();
        setMensagem(null);

        if (!manutencaoSelecionada || !String(itemFormulario.id_servico).trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Selecione uma manutencao e um servico para adicionar."
            });
            return;
        }

        setSalvandoItem(true);

        try {
            const resposta = await fetch(`${API}/adicionar_item_manutencao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    id_manutencao: Number(manutencaoSelecionada.id_manutencao),
                    id_servico: Number(itemFormulario.id_servico),
                    quantidade: Number(itemFormulario.quantidade || 1)
                })
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel adicionar o item."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item adicionado com sucesso."
            });
            setItemFormulario(itemInicial);
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setSalvandoItem(false);
        }
    }

    async function editarItem(idItem) {
        setMensagem(null);
        const quantidade = quantidadesItens[idItem];

        if (!quantidade || Number(quantidade) <= 0) {
            setMensagem({
                tipo: "erro",
                texto: "Informe uma quantidade valida para atualizar o item."
            });
            return;
        }

        try {
            const resposta = await fetch(`${API}/editar_item_manutencao/${idItem}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ quantidade: Number(quantidade) })
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel editar o item."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item atualizado com sucesso."
            });
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    function pedirExclusaoItem(idItem) {
        setConfirmacao({
            tipo: "item",
            id: idItem,
            titulo: "Excluir item",
            texto: "Deseja excluir este item da manutencao?",
            textoConfirmar: "Excluir item"
        });
    }

    async function excluirItem(idItem) {
        setConfirmandoAcao(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/excluir_item_manutencao/${idItem}`, {
                method: "DELETE",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel excluir o item."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Item excluido com sucesso."
            });
            setConfirmacao(null);
            await carregarItens(manutencaoSelecionada.id_manutencao);
            await carregarManutencoes();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setConfirmandoAcao(false);
        }
    }

    async function buscarHistorico(e) {
        e.preventDefault();
        setHistorico([]);
        setMensagem(null);

        if (!String(servicoHistorico).trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Informe um servico para consultar o historico."
            });
            return;
        }

        setCarregandoHistorico(true);

        try {
            const resposta = await fetch(`${API}/historico_servico/${servicoHistorico}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Nenhum historico encontrado."
                });
                return;
            }

            setHistorico(extrairLista(dados, ["historico"]).map(normalizarHistorico));
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setCarregandoHistorico(false);
        }
    }

    function classeStatus(data) {
        const dataAgendada = dataBrParaDate(data);

        if (!dataAgendada) {
            return css.status_agendada;
        }

        const agora = new Date();
        const seteDias = 7 * 24 * 60 * 60 * 1000;

        if (dataAgendada < agora) {
            return css.status_realizada;
        }

        if (dataAgendada.getTime() - agora.getTime() <= seteDias) {
            return css.status_proxima;
        }

        return css.status_agendada;
    }

    function textoStatus(data) {
        const dataAgendada = dataBrParaDate(data);

        if (dataAgendada && dataAgendada < new Date()) {
            return "Realizada";
        }

        if (classeStatus(data) === css.status_proxima) {
            return "Proxima";
        }

        return "Agendada";
    }

    return (
        <main className={css.container}>
            <header className={css.cabecalho}>
                <div>
                    <h1 className={css.titulo}>Manutencoes</h1>
                    <p className={css.subtitulo}>Agende servicos, acompanhe itens e consulte o historico de valores.</p>
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
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atencao"}</strong>
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
                            <span>Escolha a data, o horario e os servicos que serao feitos no veiculo.</span>
                        </div>
                        <strong>{formatarMoeda(totalFormulario)}</strong>
                    </div>

                    <div className={css.gridCampos}>
                        <div className={`${css.campo} ${css.campoAutocomplete}`}>
                            <span>Veiculo</span>
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
                                        <div className={css.autocompleteVazio}>Nenhum veiculo encontrado</div>
                                    )}
                                </div>
                            )}
                            {formulario.id_veiculo && (
                                <small className={css.campoAjuda}>Veiculo selecionado para este agendamento.</small>
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
                                        <span>Servico</span>
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
                                                <option>Nenhum servico carregado</option>
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
                            Adicionar servico
                        </button>
                        <button type="button" className={css.botaoSecundario} onClick={limparFormulario}>
                            Limpar
                        </button>
                        <button type="submit" className={css.botaoPrimario} disabled={salvando}>
                            {salvando ? "Salvando..." : formulario.id_manutencao ? "Salvar edicao" : "Agendar manutencao"}
                        </button>
                    </div>
                </form>

                <form className={css.painelHistorico} onSubmit={buscarHistorico}>
                    <h2>Historico de preco</h2>
                    <label className={css.campo}>
                        <span>Servico</span>
                        <select
                            value={servicoHistorico}
                            onChange={(e) => setServicoHistorico(e.target.value)}
                            disabled={servicos.length === 0}
                        >
                            <option value="">{servicos.length > 0 ? "Selecione um servico" : "Nenhum servico carregado"}</option>
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
                        placeholder="Buscar por placa, modelo, marca, data ou servico"
                        value={buscaTexto}
                        onChange={(e) => setBuscaTexto(e.target.value)}
                    />
                </div>
                <button type="button" className={css.botaoSecundario} onClick={() => setBuscaTexto("")}>
                    Limpar busca
                </button>
            </section>

            <section className={css.tabelaContainer}>
                <table className={css.tabela}>
                    <thead>
                    <tr>
                        <th>Veiculo</th>
                        <th>Placa</th>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Acoes</th>
                    </tr>
                    </thead>
                    <tbody>
                    {carregando && (
                        <tr>
                            <td colSpan="6" className={css.celulaVazia}>Carregando manutencoes...</td>
                        </tr>
                    )}

                    {!carregando && manutencoesFiltradas.length === 0 && (
                        <tr>
                            <td colSpan="6" className={css.celulaVazia}>Nenhuma manutencao encontrada</td>
                        </tr>
                    )}

                    {!carregando && manutencoesFiltradas.map((manutencao) => (
                        <tr key={manutencao.id_manutencao}>
                            <td>
                                <strong>{manutencao.modelo || "Veiculo"}</strong>
                                <span className={css.textoApoio}>{manutencao.marca}</span>
                            </td>
                            <td>{manutencao.placa || "-"}</td>
                            <td>{manutencao.data || "-"}</td>
                            <td className={css.valor}>{formatarMoeda(manutencao.valor_total)}</td>
                            <td>
                                <span className={`${css.status} ${classeStatus(manutencao.data)}`}>
                                    {textoStatus(manutencao.data)}
                                </span>
                            </td>
                            <td>
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

            {manutencaoSelecionada && (
                <section className={css.painelItens}>
                    <header className={css.painelItensCabecalho}>
                        <div>
                            <h2>Itens da manutencao</h2>
                            <span>{manutencaoSelecionada.modelo} {manutencaoSelecionada.placa ? `- ${manutencaoSelecionada.placa}` : ""}</span>
                        </div>
                        <button type="button" className={css.botaoSecundario} onClick={() => setManutencaoSelecionada(null)}>
                            Fechar
                        </button>
                    </header>

                    <form className={css.formItem} onSubmit={adicionarItem}>
                        <label className={css.campo}>
                            <span>Servico</span>
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
                                    <option>Nenhum servico carregado</option>
                                </select>
                            )}
                        </label>
                        <label className={css.campo}>
                            <span>Quantidade</span>
                            <input
                                type="number"
                                min="1"
                                value={itemFormulario.quantidade}
                                onChange={(e) => setItemFormulario((atual) => ({ ...atual, quantidade: e.target.value }))}
                            />
                        </label>
                        <button type="submit" className={css.botaoPrimario} disabled={salvandoItem || servicos.length === 0}>
                            {salvandoItem ? "Adicionando..." : "Adicionar item"}
                        </button>
                    </form>

                    <div className={css.tabelaItensContainer}>
                        <table className={css.tabela}>
                            <thead>
                            <tr>
                                <th>Servico</th>
                                <th>Quantidade</th>
                                <th>Unitario</th>
                                <th>Total</th>
                                <th>Acoes</th>
                            </tr>
                            </thead>
                            <tbody>
                            {carregandoItens && (
                                <tr>
                                    <td colSpan="5" className={css.celulaVazia}>Carregando itens...</td>
                                </tr>
                            )}

                            {!carregandoItens && itens.length === 0 && (
                                <tr>
                                    <td colSpan="5" className={css.celulaVazia}>Nenhum item cadastrado</td>
                                </tr>
                            )}

                            {!carregandoItens && itens.map((item) => (
                                <tr key={item.id_item}>
                                    <td>{item.nome_servico}</td>
                                    <td>
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
                                    <td>{formatarMoeda(item.valor_unitario)}</td>
                                    <td className={css.valor}>{formatarMoeda(item.total)}</td>
                                    <td>
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
