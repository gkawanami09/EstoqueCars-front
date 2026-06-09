// Importa hooks para estado, carregamento inicial e filtro.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegação do react-router-dom.
import { useNavigate } from "react-router-dom";
// Importa o CSS module da tela de clientes.
import css from "./DashboardAdmClientes.module.css";
// Importa recursos de ../components/Paginacao/Paginacao.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Objeto usado para iniciar e limpar o formulario de cliente.
const clienteInicial = {
    id_usuario: "",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: ""
};

// Tela administrativa de clientes.
function DashboardAdmClientes({ API }) {
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();

    // Declara os dados usados neste fluxo.
    const [clientes, setClientes] = useState([]);
    // Declara os dados usados neste fluxo.
    const [busca, setBusca] = useState("");
    // Declara os dados usados neste fluxo.
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    // Declara os dados usados neste fluxo.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Declara os dados usados neste fluxo.
    const [carregando, setCarregando] = useState(true);
    // Declara os dados usados neste fluxo.
    const [mensagem, setMensagem] = useState(null);

    // Cliente aberto no modal de edicao.
    const [clienteEditando, setClienteEditando] = useState(null);
    // Declara os dados usados neste fluxo.
    const [formulario, setFormulario] = useState(clienteInicial);
    // Declara os dados usados neste fluxo.
    const [situacoes, setSituacoes] = useState({});
    // Declara os dados usados neste fluxo.
    const [salvando, setSalvando] = useState(false);

    // Declara os dados usados neste fluxo.
    const [confirmacao, setConfirmacao] = useState({
        aberta: false,
        tipo: "",
        cliente: null,
        bloquear: false,
        texto: "",
        motivo: ""
    });

    // Declara a função cabecalhoAutorizacao usada por esta página.
    function cabecalhoAutorizacao() {
        // Declara token para uso neste fluxo.
        const token = localStorage.getItem("access_token");
        // Verifica esta condição antes de continuar o fluxo.
        if (!token) return undefined;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return { Authorization: `Bearer ${token}` };
    }

    // Declara carregarClientes para uso neste fluxo.
    const carregarClientes = useCallback(async () => {
        // Atualiza o estado por meio de setCarregando.
        setCarregando(true);
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/listar_usuario`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });

            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível carregar os clientes."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Declara somenteClientes para uso neste fluxo.
            const somenteClientes = (Array.isArray(dados) ? dados : []).filter(
                (usuario) => Number(usuario.tipo_usuario) !== 2
            );

            // Atualiza o estado por meio de setClientes.
            setClientes(somenteClientes);
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Atualiza o estado por meio de setCarregando.
            setCarregando(false);
        }
    }, [API]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Executa carregarClientes nesta etapa do fluxo.
        carregarClientes();
    }, [carregarClientes]);

    // Declara clientesFiltrados para uso neste fluxo.
    const clientesFiltrados = useMemo(() => {
        // Declara listaFiltrada para uso neste fluxo.
        let listaFiltrada = clientes;

        // Verifica esta condição antes de continuar o fluxo.
        if (filtroTipo === "Cliente") {
            // Executa esta etapa do fluxo.
            listaFiltrada = listaFiltrada.filter((cliente) => Number(cliente.tipo_usuario) === 0);
        } else if (filtroTipo === "Vendedor") {
            // Executa esta etapa do fluxo.
            listaFiltrada = listaFiltrada.filter((cliente) => Number(cliente.tipo_usuario) === 1);
        }

        // Declara termo para uso neste fluxo.
        const termo = busca.trim().toLowerCase();
        // Verifica esta condição antes de continuar o fluxo.
        if (!termo) return listaFiltrada;

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return listaFiltrada.filter((cliente) => {
            // Declara campos para uso neste fluxo.
            const campos = [cliente.nome, cliente.email, cliente.telefone, cliente.cpf];
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, clientes, filtroTipo]);

    // Declara totalPaginas para uso neste fluxo.
    const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA));

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
    }, [paginaAtual, totalPaginas]);

    // Declara clientesPaginados para uso neste fluxo.
    const clientesPaginados = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return clientesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [clientesFiltrados, paginaAtual]);

    // Declara a função abrirEdicao usada por esta página.
    function abrirEdicao(cliente) {
        // Atualiza o estado por meio de setClienteEditando.
        setClienteEditando(cliente);
        // Atualiza o estado por meio de setFormulario.
        setFormulario({
            id_usuario: cliente.id_usuario,
            nome: cliente.nome || "",
            email: cliente.email || "",
            telefone: mascararTelefone(cliente.telefone),
            cpf: mascararCpf(cliente.cpf),
            senha: ""
        });
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);
    }

    // Declara a função fecharEdicao usada por esta página.
    function fecharEdicao() {
        // Atualiza o estado por meio de setClienteEditando.
        setClienteEditando(null);
        // Atualiza o estado por meio de setFormulario.
        setFormulario(clienteInicial);
        // Atualiza o estado por meio de setSalvando.
        setSalvando(false);
    }

    // Declara a função atualizarCampo usada por esta página.
    function atualizarCampo(campo, valor) {
        // Atualiza o estado por meio de setFormulario.
        setFormulario((atual) => ({
            ...atual,
            [campo]: valor
        }));
    }

    // Declara a função salvarEdicao usada por esta página.
    async function salvarEdicao(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Verifica esta condição antes de continuar o fluxo.
        if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.telefone.trim() || !formulario.cpf.trim()) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Preencha nome, email, telefone e CPF."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara formData para uso neste fluxo.
        const formData = new FormData();
        // Executa append nesta etapa do fluxo.
        formData.append("nome", formulario.nome);
        // Executa append nesta etapa do fluxo.
        formData.append("email", formulario.email);
        // Executa append nesta etapa do fluxo.
        formData.append("telefone", formulario.telefone.replace(/\D/g, ""));
        // Executa append nesta etapa do fluxo.
        formData.append("cpf", formulario.cpf.replace(/\D/g, ""));

        // Verifica esta condição antes de continuar o fluxo.
        if (formulario.senha.trim()) {
            // Executa append nesta etapa do fluxo.
            formData.append("senha", formulario.senha);
        }

        // Atualiza o estado por meio de setSalvando.
        setSalvando(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/editar_usuario/${formulario.id_usuario}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });

            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível editar o cliente."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setClientes.
            setClientes((listaAtual) =>
                listaAtual.map((cliente) =>
                    cliente.id_usuario === formulario.id_usuario
                        ? {
                            ...cliente,
                            nome: formulario.nome,
                            email: formulario.email,
                            telefone: formulario.telefone.replace(/\D/g, ""),
                            cpf: formulario.cpf.replace(/\D/g, "")
                        }
                        : cliente
                )
            );

            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente editado com sucesso."
            });

            // Executa fecharEdicao nesta etapa do fluxo.
            fecharEdicao();
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Atualiza o estado por meio de setSalvando.
            setSalvando(false);
        }
    }

    // Declara a função excluirCliente usada por esta página.
    async function excluirCliente(cliente) {
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/excluir_usuario/${cliente.id_usuario}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });

            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível excluir o cliente."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setClientes.
            setClientes((listaAtual) =>
                listaAtual.filter((item) => item.id_usuario !== cliente.id_usuario)
            );

            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente removido com sucesso."
            });
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        }
    }

    // Declara a função alterarBloqueio usada por esta página.
    async function alterarBloqueio(cliente, bloquear, motivo = "") {
        // Declara rota para uso neste fluxo.
        const rota = bloquear ? "bloquear_usuario" : "desbloquear_usuario";
        // Declara acao para uso neste fluxo.
        const acao = bloquear ? "bloquear" : "desbloquear";
        // Declara headers para uso neste fluxo.
        const headers = cabecalhoAutorizacao() || {};

        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/${rota}/${cliente.id_usuario}`, {
                method: "PUT",
                headers: bloquear ? { ...headers, "Content-Type": "application/json" } : headers,
                credentials: "include",
                body: bloquear ? JSON.stringify({ mensagem: motivo.trim() }) : undefined
            });

            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || `Não foi possível ${acao} o cliente.`
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setSituacoes.
            setSituacoes((atuais) => ({
                ...atuais,
                [cliente.id_usuario]: bloquear ? "bloqueado" : "ativo"
            }));

            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || `Cliente ${bloquear ? "bloqueado" : "desbloqueado"} com sucesso.`
            });
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        }
    }

    // Declara a função abrirConfirmacaoExclusao usada por esta página.
    function abrirConfirmacaoExclusao(cliente) {
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao({
            aberta: true,
            tipo: "excluir",
            cliente,
            bloquear: false,
            texto: `Deseja excluir ${cliente.nome}?`,
            motivo: ""
        });
    }

    // Declara a função abrirConfirmacaoBloqueio usada por esta página.
    function abrirConfirmacaoBloqueio(cliente, bloquear) {
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao({
            aberta: true,
            tipo: "bloqueio",
            cliente,
            bloquear,
            texto: `Deseja ${bloquear ? "bloquear" : "desbloquear"} ${cliente.nome}?`,
            motivo: ""
        });
    }

    // Declara a função fecharConfirmacao usada por esta página.
    function fecharConfirmacao() {
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao({
            aberta: false,
            tipo: "",
            cliente: null,
            bloquear: false,
            texto: "",
            motivo: ""
        });
    }

    // Declara a função confirmarAcao usada por esta página.
    async function confirmarAcao() {
        // Declara os dados usados neste fluxo.
        const { tipo, cliente, bloquear, motivo } = confirmacao;

        // Verifica esta condição antes de continuar o fluxo.
        if (bloquear && !motivo.trim()) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Informe o motivo da ação."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Executa fecharConfirmacao nesta etapa do fluxo.
        fecharConfirmacao();

        // Verifica esta condição antes de continuar o fluxo.
        if (!cliente) return;

        // Verifica esta condição antes de continuar o fluxo.
        if (tipo === "excluir") {
            // Executa excluirCliente nesta etapa do fluxo.
            await excluirCliente(cliente);
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipo === "bloqueio") {
            // Executa alterarBloqueio nesta etapa do fluxo.
            await alterarBloqueio(cliente, bloquear, motivo);
        }
    }

    // Declara a função somenteNumeros usada por esta página.
    function somenteNumeros(valor, limite) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return String(valor || "").replace(/\D/g, "").slice(0, limite);
    }

    // Declara a função mascararTelefone usada por esta página.
    function mascararTelefone(valor) {
        // Declara n para uso neste fluxo.
        const n = somenteNumeros(valor, 11);
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 2) return n ? `(${n}` : "";
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    }

    // Declara a função mascararCpf usada por esta página.
    function mascararCpf(valor) {
        // Declara n para uso neste fluxo.
        const n = somenteNumeros(valor, 11);
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 3) return n;
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
        // Verifica esta condição antes de continuar o fluxo.
        if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
    }

    // Declara a função clienteBloqueado usada por esta página.
    function clienteBloqueado(cliente) {
        // Verifica esta condição antes de continuar o fluxo.
        if (situacoes[cliente.id_usuario]) return situacoes[cliente.id_usuario] === "bloqueado";
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Number(cliente.situacao) === 1;
    }

    // Declara a função fotoPerfil usada por esta página.
    function fotoPerfil(cliente) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${API}/uploads/${cliente.id_usuario}.jpg`;
    }

    // Declara a função trocarFotoPerfil usada por esta página.
    function trocarFotoPerfil(e, cliente) {
        // Declara img para uso neste fluxo.
        const img = e.currentTarget;
        // Declara tentativa para uso neste fluxo.
        const tentativa = Number(img.dataset.tentativa || 0);
        // Declara extensoes para uso neste fluxo.
        const extensoes = ["png", "pgn"];

        // Verifica esta condição antes de continuar o fluxo.
        if (tentativa < extensoes.length) {
            // Executa esta etapa do fluxo.
            img.dataset.tentativa = String(tentativa + 1);
            // Executa esta etapa do fluxo.
            img.src = `${API}/uploads/${cliente.id_usuario}.${extensoes[tentativa]}`;
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Executa esta etapa do fluxo.
        img.src = "/IconPerfil.png";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <div className={css.layout_dashboard}>
            {/* Abre o conteúdo principal desta página. */}
            <main className={css.conteudo_principal}>
                {/* Exibe o cabeçalho desta área. */}
                <header className={css.cabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título principal desta página. */}
                        <h1 className={css.titulo}>Usuários</h1>
                    </div>
                </header>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {mensagem && (
                    <div
                       className={`${css.mensagem} ${
                            mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                        }`}
                    >
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.mensagem_info}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span className={css.mensagem_icone}>{mensagem.tipo === "sucesso" ? "✓" : "!"}</span>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.mensagem_texto}>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atenção"}</strong>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        {/* Exibe este botão de ação. */}
                        <button type="button" onClick={() => setMensagem(null)}>x</button>
                    </div>
                )}

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.barra_acoes}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_busca}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span className={css.icone_busca}>⌕</span>
                        {/* Exibe este campo de entrada de dados. */}
                        <input
                            type="text"
                            placeholder="Buscar clientes"
                            value={busca}
                            onChange={(e) => {
                                // Atualiza o estado por meio de setBusca.
                                setBusca(e.target.value);
                                // Atualiza o estado por meio de setPaginaAtual.
                                setPaginaAtual(1);
                            }}
                        />
                    </div>

                    {/* Exibe este botão de ação. */}
                    <button type="button" className={css.btn_add} onClick={() => navigate("/CadastroCliente")}>
                        Cadastrar Usuário
                    </button>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.area_filtros}>
                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        onClick={() => {
                            // Atualiza o estado por meio de setFiltroTipo.
                            setFiltroTipo("Todos");
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Todos" ? css.btn_filtro_ativo : ""}`}
                    >
                        Todos
                    </button>

                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        onClick={() => {
                            // Atualiza o estado por meio de setFiltroTipo.
                            setFiltroTipo("Cliente");
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Cliente" ? css.btn_filtro_ativo : ""}`}
                    >
                        Cliente
                    </button>

                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        onClick={() => {
                            // Atualiza o estado por meio de setFiltroTipo.
                            setFiltroTipo("Vendedor");
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Vendedor" ? css.btn_filtro_ativo : ""}`}
                    >
                        Vendedor
                    </button>
                </div>

                {/* Agrupa esta seção de conteúdo. */}
                <section className={css.cards_container}>
                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {carregando && <div className={css.estado_lista}>Carregando clientes...</div>}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && clientesFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum cliente encontrado</div>
                    )}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && clientesPaginados.map((cliente) => (
                        <article key={cliente.id_usuario} className={css.card_cliente}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.card_topo}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div className={css.avatar}>
                                    {/* Exibe esta imagem na interface. */}
                                    <img
                                        src={fotoPerfil(cliente)}
                                        alt={`Foto de ${cliente.nome}`}
                                        data-tentativa="0"
                                        onError={(e) => trocarFotoPerfil(e, cliente)}
                                    />
                                </div>

                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={`${css.status} ${clienteBloqueado(cliente) ? css.status_bloqueado : css.status_ativo}`}>
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {clienteBloqueado(cliente) ? "Bloqueado" : "Ativo"}
                                </span>
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.card_info_principal}>
                                {/* Exibe o título desta seção. */}
                                <h2>{cliente.nome}</h2>
                                {/* Exibe esta mensagem ou informação. */}
                                <p>{cliente.email}</p>
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.dados_cliente}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Telefone</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong className={css.telefone_valor}>
                                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                        {mascararTelefone(cliente.telefone) || "-"}
                                    </strong>
                                </div>

                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>CPF</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong className={css.cpf_valor}>
                                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                        {mascararCpf(cliente.cpf) || "-"}
                                    </strong>
                                </div>
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.acoes}>
                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {!clienteBloqueado(cliente) && (
                                    <button type="button" className={css.btn_editar} onClick={() => abrirEdicao(cliente)}>
                                        {/* Exibe esta imagem na interface. */}
                                        <img src="/Editar.png" alt="Editar" /> Editar
                                    </button>
                                )}

                                {/* Exibe este botão de ação. */}
                                <button
                                    type="button"
                                    className={clienteBloqueado(cliente) ? css.btn_desbloquear : css.btn_bloquear}
                                    onClick={() => abrirConfirmacaoBloqueio(cliente, !clienteBloqueado(cliente))}
                                >
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {clienteBloqueado(cliente) ? "Desbloquear" : "Bloquear"}
                                </button>

                                {/* Exibe este botão de ação. */}
                                <button type="button" className={css.btn_excluir} onClick={() => abrirConfirmacaoExclusao(cliente)}>
                                    {/* Exibe esta imagem na interface. */}
                                    <img src="/Exculir.png" alt="Excluir" /> Excluir
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregando && clientesFiltrados.length > 0 && (
                    <div className={css.paginacao_area}>
                        {/* Renderiza o componente Paginacao nesta parte da página. */}
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={clientesFiltrados.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {clienteEditando && (
                    <div className={css.modal_overlay}>
                        {/* Agrupa os campos e ações deste formulário. */}
                        <form className={css.modal} onSubmit={salvarEdicao}>
                            {/* Exibe o cabeçalho desta área. */}
                            <header className={css.modal_cabecalho}>
                                {/* Exibe o título desta seção. */}
                                <h2>Editar cliente</h2>
                                {/* Exibe este botão de ação. */}
                                <button type="button" onClick={fecharEdicao} aria-label="Fechar modal">x</button>
                            </header>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.form_grid}>
                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label>
                                    Nome
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="text"
                                        value={formulario.nome}
                                        onChange={(e) => atualizarCampo("nome", e.target.value)}
                                        required
                                    />
                                </label>

                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label>
                                    Email
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="email"
                                        value={formulario.email}
                                        onChange={(e) => atualizarCampo("email", e.target.value)}
                                        required
                                    />
                                </label>

                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label>
                                    Telefone
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="tel"
                                        value={formulario.telefone}
                                        onChange={(e) => atualizarCampo("telefone", mascararTelefone(e.target.value))}
                                        inputMode="numeric"
                                        maxLength="15"
                                        required
                                    />
                                </label>

                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label>
                                    CPF
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="text"
                                        value={formulario.cpf}
                                        onChange={(e) => atualizarCampo("cpf", mascararCpf(e.target.value))}
                                        inputMode="numeric"
                                        maxLength="14"
                                        required
                                    />
                                </label>

                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label className={css.campo_inteiro}>
                                    Nova senha
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="password"
                                        value={formulario.senha}
                                        onChange={(e) => atualizarCampo("senha", e.target.value)}
                                        placeholder="Deixe vazio para manter a senha atual"
                                    />
                                </label>
                            </div>

                            {/* Renderiza o elemento footer nesta parte da página. */}
                            <footer className={css.modal_botoes}>
                                {/* Exibe este botão de ação. */}
                                <button type="button" className={css.btn_cancelar} onClick={fecharEdicao}>
                                    Cancelar
                                </button>

                                {/* Exibe este botão de ação. */}
                                <button type="submit" className={css.btn_salvar} disabled={salvando}>
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {salvando ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </footer>
                        </form>
                    </div>
                )}

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {confirmacao.aberta && (
                    <div className={css.confirm_overlay}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.confirm_box}>
                            {/* Renderiza o elemento h3 nesta parte da página. */}
                            <h3>Confirmar ação</h3>

                            {/* Exibe esta mensagem ou informação. */}
                            <p>{confirmacao.texto}</p>

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {confirmacao.bloquear && (
                                <textarea
                                    className={css.textarea_motivo}
                                    placeholder="Descreva o motivo"
                                    rows="4"
                                    value={confirmacao.motivo}
                                    onChange={(e) =>
                                        setConfirmacao({
                                            ...confirmacao,
                                            motivo: e.target.value
                                        })
                                    }
                                />
                            )}

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.confirm_botoes}>
                                {/* Exibe este botão de ação. */}
                                <button type="button" className={css.confirm_ok} onClick={confirmarAcao}>
                                    OK
                                </button>

                                {/* Exibe este botão de ação. */}
                                <button type="button" className={css.confirm_cancel} onClick={fecharConfirmacao}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default DashboardAdmClientes;
