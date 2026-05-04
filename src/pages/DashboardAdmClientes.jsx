// Importa hooks para estado, carregamento inicial e filtro.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o CSS module da tela de clientes.
import css from "./DashboardAdmClientes.module.css";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Objeto usado para iniciar e limpar o formulario de cliente.
const clienteInicial = {
    // Guarda o ID do usuario quando o formulario esta editando alguem.
    id_usuario: "",
    // Guarda o nome digitado no campo de nome.
    nome: "",
    // Guarda o email digitado no campo de email.
    email: "",
    // Guarda o telefone com mascara visual no formulario.
    telefone: "",
    // Guarda o CPF com mascara visual no formulario.
    cpf: "",
    // Guarda a nova senha apenas quando o admin quiser alterar.
    senha: ""
};

// Tela administrativa de clientes.
function DashboardAdmClientes({ API }) {
    // Recebe a URL base da API Flask por props.
    // Lista de clientes carregada da API.
    const [clientes, setClientes] = useState([]);
    // Texto digitado na busca.
    const [busca, setBusca] = useState("");
    // Pagina atual da lista de clientes.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Controla carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);
    // Cliente aberto no modal de edicao.
    const [clienteEditando, setClienteEditando] = useState(null);
    // Dados do formulario de edicao.
    const [formulario, setFormulario] = useState(clienteInicial);
    // Situacoes alteradas na tela, como ativo/bloqueado.
    const [situacoes, setSituacoes] = useState({});
    // Controla carregamento do botao salvar.
    const [salvando, setSalvando] = useState(false);
    // Dados do modal de confirmacao.
    const [confirmacao, setConfirmacao] = useState({
        // Informa se o modal de confirmacao esta aberto.
        aberta: false,
        // Guarda qual tipo de acao sera confirmada: excluir ou bloqueio.
        tipo: "",
        // Guarda o cliente selecionado para a acao.
        cliente: null,
        // Guarda se a acao de bloqueio sera bloquear ou desbloquear.
        bloquear: false,
        // Texto exibido dentro do modal de confirmacao.
        texto: ""
    });

    // Monta o header Authorization quando existe token.
    function cabecalhoAutorizacao() {
        // Busca token salvo no navegador.
        const token = localStorage.getItem("access_token");
        // Sem token, nao envia header.
        if (!token) {
            return undefined;
        }

        // Retorna o token no formato Bearer.
        return { Authorization: `Bearer ${token}` };
    }

    // Carrega clientes quando a tela abre.
    // Carrega os usuarios/clientes cadastrados para montar a lista.
    const carregarClientes = useCallback(async () => {
        // Liga carregamento da lista.
        setCarregando(true);
        // Limpa mensagem antiga.
        setMensagem(null);

        try {
            // Chama a rota que lista usuarios.
            const resposta = await fetch(`${API}/listar_usuario`, {
                // Define que a rota sera chamada por GET.
                method: "GET",
                // Envia o token no header Authorization quando ele existir.
                headers: cabecalhoAutorizacao(),
                // Mantem tambem o envio de cookies para compatibilidade com o backend.
                credentials: "include"
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Se a API retornar erro, mostra mensagem.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel carregar os clientes."
                });
                return;
            }

            // Remove administradores da lista, deixando apenas clientes.
            const somenteClientes = (Array.isArray(dados) ? dados : []).filter(
                // Remove usuarios admin, pois tipo_usuario 2 representa administrador.
                (usuario) => Number(usuario.tipo_usuario) !== 2
            );

            // Salva clientes no estado.
            setClientes(somenteClientes);
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            // Desliga carregamento.
            setCarregando(false);
        }
    }, [API]); // Recria a funcao apenas quando a URL da API mudar.

    // Carrega clientes quando a tela abre.
    useEffect(() => {
        carregarClientes();
    }, [carregarClientes]); // Executa novamente se a funcao de carregamento mudar.

    // Cria a lista filtrada pelo campo de busca.
    const clientesFiltrados = useMemo(() => {
        // Normaliza termo pesquisado.
        const termo = busca.trim().toLowerCase();
        // Sem termo, retorna todos.
        if (!termo) {
            return clientes;
        }

        // Procura no nome, email, telefone e CPF.
        return clientes.filter((cliente) => {
            // Junta os campos pesquisaveis do cliente.
            const campos = [cliente.nome, cliente.email, cliente.telefone, cliente.cpf];
            // Verifica se algum campo contem o texto buscado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, clientes]); // Recalcula filtro quando busca ou lista mudarem.

    // Total de paginas considerando a busca atual.
    const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA));

    // Garante que a pagina atual continue valida quando a lista muda.
    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Lista apenas os clientes da pagina atual.
    const clientesPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return clientesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [clientesFiltrados, paginaAtual]);

    // Abre modal de edicao com os dados do cliente.
    function abrirEdicao(cliente) {
        // Guarda o cliente escolhido para abrir o modal.
        setClienteEditando(cliente);
        // Preenche o formulario com os dados atuais do cliente.
        setFormulario({
            // ID usado para montar a rota de edicao.
            id_usuario: cliente.id_usuario,
            // Nome atual ou vazio caso a API nao mande nome.
            nome: cliente.nome || "",
            // Email atual ou vazio caso a API nao mande email.
            email: cliente.email || "",
            // Telefone formatado para aparecer com mascara.
            telefone: mascararTelefone(cliente.telefone),
            // CPF formatado para aparecer com mascara.
            cpf: mascararCpf(cliente.cpf),
            // Senha sempre inicia vazia para nao expor senha.
            senha: ""
        });
        // Limpa mensagens anteriores ao abrir o modal.
        setMensagem(null);
    }

    // Fecha modal e limpa formulario.
    function fecharEdicao() {
        // Remove o cliente do estado de edicao.
        setClienteEditando(null);
        // Volta o formulario para o estado inicial.
        setFormulario(clienteInicial);
        // Garante que o botao salvar nao fique preso em carregamento.
        setSalvando(false);
    }

    // Atualiza um campo do formulario.
    function atualizarCampo(campo, valor) {
        // Atualiza o formulario usando o estado anterior como base.
        setFormulario((atual) => ({
            // Mantem todos os campos que nao foram alterados.
            ...atual,
            // Atualiza dinamicamente apenas o campo recebido.
            [campo]: valor
        }));
    }

    // Envia os campos editados do cliente para a API.
    async function salvarEdicao(e) {
        // Impede refresh da pagina.
        e.preventDefault();
        // Limpa mensagem antiga.
        setMensagem(null);

        // Valida campos obrigatorios.
        if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.telefone.trim() || !formulario.cpf.trim()) {
            // Mostra erro quando algum dado principal nao foi preenchido.
            setMensagem({
                // Define a mensagem como visual de erro.
                tipo: "erro",
                // Texto exibido para o usuario.
                texto: "Preencha nome, email, telefone e CPF."
            });
            // Interrompe o envio para a API.
            return;
        }

        // Usa FormData porque a API Flask le request.form.
        const formData = new FormData();
        // Envia nome.
        formData.append("nome", formulario.nome);
        // Envia email.
        formData.append("email", formulario.email);
        // Envia telefone somente com numeros.
        formData.append("telefone", formulario.telefone.replace(/\D/g, ""));
        // Envia CPF somente com numeros.
        formData.append("cpf", formulario.cpf.replace(/\D/g, ""));
        // So envia senha se o admin preencheu.
        if (formulario.senha.trim()) {
            formData.append("senha", formulario.senha);
        }

        // Liga carregamento do botao.
        setSalvando(true);

        try {
            // Chama a rota de editar usuario.
            const resposta = await fetch(`${API}/editar_usuario/${formulario.id_usuario}`, {
                // A rota Flask de editar usuario usa POST.
                method: "POST",
                // Envia token para permitir a operacao autenticada.
                headers: cabecalhoAutorizacao(),
                // Envia cookies junto se o backend estiver usando cookie.
                credentials: "include",
                // Envia os dados no formato multipart/form-data.
                body: formData
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API recusou.
            if (!resposta.ok) {
                setMensagem({
                    // Marca a mensagem como erro.
                    tipo: "erro",
                    // Usa erro da API ou texto padrao.
                    texto: dados.erro || "Nao foi possivel editar o cliente."
                });
                // Sai sem atualizar a lista local.
                return;
            }

            // Atualiza o cliente editado na lista local.
            setClientes((listaAtual) =>
                listaAtual.map((cliente) =>
                    // Procura o cliente editado pelo ID.
                    cliente.id_usuario === formulario.id_usuario
                        ? {
                            // Mantem campos que nao foram alterados.
                            ...cliente,
                            // Atualiza nome com o valor do formulario.
                            nome: formulario.nome,
                            // Atualiza email com o valor do formulario.
                            email: formulario.email,
                            // Salva telefone sem mascara na lista.
                            telefone: formulario.telefone.replace(/\D/g, ""),
                            // Salva CPF sem mascara na lista.
                            cpf: formulario.cpf.replace(/\D/g, "")
                        }
                        // Mantem clientes que nao foram editados.
                        : cliente
                )
            );
            // Mostra sucesso.
            setMensagem({
                // Marca a mensagem como sucesso.
                tipo: "sucesso",
                // Usa mensagem da API ou texto padrao.
                texto: dados.mensagem || "Cliente editado com sucesso."
            });
            // Fecha modal.
            fecharEdicao();
        } catch {
            // Erro de conexao.
            setMensagem({
                // Marca a mensagem como erro de conexao.
                tipo: "erro",
                // Texto exibido quando fetch falha.
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do botao.
            setSalvando(false);
        }
    }

    // Exclui o cliente selecionado depois da confirmacao visual.
    async function excluirCliente(cliente) {
        // Limpa mensagem antiga.
        setMensagem(null);

        try {
            // Chama a rota DELETE do usuario.
            const resposta = await fetch(`${API}/excluir_usuario/${cliente.id_usuario}`, {
                // DELETE remove o usuario escolhido.
                method: "DELETE",
                // Envia o token do administrador.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies por compatibilidade com a autenticacao do Flask.
                credentials: "include"
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API bloquear.
            if (!resposta.ok) {
                setMensagem({
                    // Mensagem visual de erro.
                    tipo: "erro",
                    // Prioriza a mensagem enviada pela API.
                    texto: dados.erro || "Nao foi possivel excluir o cliente."
                });
                // Para sem remover o cliente da tela.
                return;
            }

            // Remove cliente da lista da tela.
            // Mantem somente os clientes com ID diferente do excluido.
            setClientes((listaAtual) => listaAtual.filter((item) => item.id_usuario !== cliente.id_usuario));
            // Mostra sucesso.
            setMensagem({
                // Mensagem visual de sucesso.
                tipo: "sucesso",
                // Texto vindo da API ou fallback local.
                texto: dados.mensagem || "Cliente removido com sucesso."
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                // Mensagem visual de erro.
                tipo: "erro",
                // Texto padrao para falha de conexao.
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    // Alterna a situacao do cliente entre bloqueado e liberado.
    async function alterarBloqueio(cliente, bloquear) {
        // Define a rota conforme a acao.
        const rota = bloquear ? "bloquear_usuario" : "desbloquear_usuario";
        // Texto usado nas mensagens.
        const acao = bloquear ? "bloquear" : "desbloquear";

        // Limpa mensagem antiga.
        setMensagem(null);

        try {
            // Chama a rota de bloquear/desbloquear usuario.
            const resposta = await fetch(`${API}/${rota}/${cliente.id_usuario}`, {
                // PUT altera a situacao do usuario.
                method: "PUT",
                // Envia token do administrador.
                headers: cabecalhoAutorizacao(),
                // Mantem cookies da sessao.
                credentials: "include"
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API recusou.
            if (!resposta.ok) {
                setMensagem({
                    // Mensagem visual de erro.
                    tipo: "erro",
                    // Usa erro da API ou mensagem baseada na acao.
                    texto: dados.erro || `Nao foi possivel ${acao} o cliente.`
                });
                // Para sem alterar o status local.
                return;
            }

            // Atualiza o status local do cliente.
            setSituacoes((atuais) => ({
                // Mantem as situacoes ja alteradas de outros clientes.
                ...atuais,
                // Atualiza apenas o cliente clicado.
                [cliente.id_usuario]: bloquear ? "bloqueado" : "ativo"
            }));
            // Mostra sucesso.
            setMensagem({
                // Mensagem visual de sucesso.
                tipo: "sucesso",
                // Texto vindo da API ou fallback local.
                texto: dados.mensagem || `Cliente ${bloquear ? "bloqueado" : "desbloqueado"} com sucesso.`
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                // Mensagem visual de erro.
                tipo: "erro",
                // Texto padrao para erro de rede.
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    // Abre confirmacao para excluir cliente.
    function abrirConfirmacaoExclusao(cliente) {
        // Abre o modal de confirmacao.
        setConfirmacao({
            // Deixa o modal visivel.
            aberta: true,
            // Informa que a acao confirmada sera exclusao.
            tipo: "excluir",
            // Guarda o cliente que sera excluido.
            cliente,
            // Nao usa bloqueio nessa acao.
            bloquear: false,
            // Texto personalizado com o nome do cliente.
            texto: `Deseja excluir ${cliente.nome}?`
        });
    }

    // Abre confirmacao para bloquear ou desbloquear.
    function abrirConfirmacaoBloqueio(cliente, bloquear) {
        // Abre o modal de confirmacao.
        setConfirmacao({
            // Deixa o modal visivel.
            aberta: true,
            // Informa que a acao confirmada sera bloqueio/desbloqueio.
            tipo: "bloqueio",
            // Guarda o cliente que sera alterado.
            cliente,
            // Guarda se a acao e bloquear ou desbloquear.
            bloquear,
            // Monta o texto conforme a acao escolhida.
            texto: `Deseja ${bloquear ? "bloquear" : "desbloquear"} ${cliente.nome}?`
        });
    }

    // Fecha a caixa de confirmacao.
    function fecharConfirmacao() {
        // Volta o modal para o estado inicial fechado.
        setConfirmacao({
            // Fecha o modal.
            aberta: false,
            // Limpa o tipo de acao.
            tipo: "",
            // Remove o cliente selecionado.
            cliente: null,
            // Reseta a flag de bloqueio.
            bloquear: false,
            // Limpa o texto exibido.
            texto: ""
        });
    }

    // Executa a acao confirmada pelo usuario.
    async function confirmarAcao() {
        // Pega dados atuais da confirmacao.
        const { tipo, cliente, bloquear } = confirmacao;
        // Fecha o modal antes de executar.
        fecharConfirmacao();

        // Sem cliente, nao executa nada.
        if (!cliente) {
            return;
        }

        // Se o tipo e excluir, chama exclusao.
        if (tipo === "excluir") {
            await excluirCliente(cliente);
            return;
        }

        // Se o tipo e bloqueio, chama bloquear/desbloquear.
        if (tipo === "bloqueio") {
            await alterarBloqueio(cliente, bloquear);
        }
    }

    // Mantem somente numeros e limita o tamanho.
    function somenteNumeros(valor, limite) {
        // Converte qualquer valor para texto, remove nao-digitos e corta no limite.
        return String(valor || "").replace(/\D/g, "").slice(0, limite);
    }

    // Aplica mascara visual de telefone.
    function mascararTelefone(valor) {
        // Pega apenas numeros.
        const numeros = somenteNumeros(valor, 11);

        // Enquanto tem ate DDD incompleto.
        if (numeros.length <= 2) {
            return numeros ? `(${numeros}` : "";
        }

        // Formata telefone curto ainda sem hifen.
        if (numeros.length <= 6) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        }

        // Formata telefone fixo.
        if (numeros.length <= 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }

        // Formata celular com 9 digitos.
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }

    // Aplica mascara visual de CPF.
    function mascararCpf(valor) {
        // Pega apenas numeros.
        const numeros = somenteNumeros(valor, 11);

        // Primeiro bloco.
        if (numeros.length <= 3) {
            return numeros;
        }

        // Segundo bloco.
        if (numeros.length <= 6) {
            return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
        }

        // Terceiro bloco.
        if (numeros.length <= 9) {
            return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
        }

        // CPF completo.
        return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
    }

    // Mostra telefone formatado ou traco.
    function formatarTelefone(valor) {
        // Aplica a mascara e, se nao houver valor, exibe traco.
        return mascararTelefone(valor) || "-";
    }

    // Mostra CPF formatado ou traco.
    function formatarCpf(valor) {
        // Aplica a mascara e, se nao houver valor, exibe traco.
        return mascararCpf(valor) || "-";
    }

    // Verifica se o cliente esta bloqueado.
    function clienteBloqueado(cliente) {
        // Usa primeiro o status alterado localmente nesta tela.
        if (situacoes[cliente.id_usuario]) {
            // Retorna true quando o status local esta como bloqueado.
            return situacoes[cliente.id_usuario] === "bloqueado";
        }

        // Se nao houve alteracao local, usa a situacao que veio da API.
        return Number(cliente.situacao) === 1;
    }

    // Define o texto de situacao do cliente.
    function textoSituacao(cliente) {
        return clienteBloqueado(cliente) ? "Bloqueado" : "Ativo";
    }

    // Monta a primeira tentativa de foto de perfil.
    function fotoPerfil(cliente) {
        return `${API}/uploads/${cliente.id_usuario}.jpg`;
    }

    // Tenta outras extensoes quando a imagem falha.
    function trocarFotoPerfil(e, cliente) {
        // Pega o elemento img que deu erro.
        const img = e.currentTarget;
        // Lembra qual tentativa ja foi feita.
        const tentativa = Number(img.dataset.tentativa || 0);
        // Extensoes alternativas usadas no upload.
        const extensoes = ["png", "pgn"];

        // Se ainda tem extensao para tentar, troca o src.
        if (tentativa < extensoes.length) {
            img.dataset.tentativa = String(tentativa + 1);
            img.src = `${API}/uploads/${cliente.id_usuario}.${extensoes[tentativa]}`;
            return;
        }

        // Se nada funcionou, usa icone padrao.
        img.src = "/IconPerfil.png";
    }

    // Renderiza a tela.
    return (
        // Container principal.
        <div className={css.layout_dashboard}>
            {/* Conteudo principal. */}
            <main className={css.conteudo_principal}>
                {/* Cabecalho da tela. */}
                <header className={css.cabecalho}>
                    <div>
                        <h1 className={css.titulo}>Clientes</h1>
                        <p className={css.subtitulo}>Gerencie cadastro, acesso e status dos clientes.</p>
                    </div>
                </header>

                {/* Mostra o alerta apenas quando existir mensagem no estado. */}
                {mensagem && (
                    <div
                        className={`${css.mensagem} ${
                            mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                        }`}
                    >
                        {/* Agrupa icone e textos da mensagem. */}
                        <div className={css.mensagem_info}>
                            {/* Mostra check para sucesso e exclamação para erro. */}
                            <span className={css.mensagem_icone}>
                                {mensagem.tipo === "sucesso" ? "✓" : "!"}
                            </span>
                            {/* Conteudo textual do alerta. */}
                            <div className={css.mensagem_texto}>
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atenção"}</strong>
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        {/* Botao para fechar/limpar o alerta. */}
                        <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                            x
                        </button>
                    </div>
                )}

                {/* Barra superior com o campo de busca. */}
                <div className={css.barra_acoes}>
                    {/* Caixa visual do input de busca. */}
                    <div className={css.area_busca}>
                        <span className={css.icone_busca}>⌕</span>
                        {/* Campo controlado pela variavel busca. */}
                        <input
                            type="text"
                            placeholder="Buscar clientes"
                            value={busca}
                            onChange={(e) => {
                                setBusca(e.target.value);
                                setPaginaAtual(1);
                            }}
                        />
                    </div>

                </div> <br/>

                {/* Lista de cards de clientes. */}
                <section className={css.cards_container}>
                    {/* Estado de carregamento enquanto a API responde. */}
                    {carregando && (
                        <div className={css.estado_lista}>Carregando clientes...</div>
                    )}

                    {/* Estado vazio quando terminou de carregar e nao ha resultados. */}
                    {!carregando && clientesFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum cliente encontrado</div>
                    )}

                    {/* Renderiza um card para cada cliente filtrado. */}
                    {!carregando && clientesPaginados.map((cliente) => (
                        <article key={cliente.id_usuario} className={css.card_cliente}>
                            {/* Topo do card com foto e etiqueta de status. */}
                            <div className={css.card_topo}>
                                {/* Area circular da foto do cliente. */}
                                <div className={css.avatar}>
                                    {/* Imagem tenta carregar a foto do backend. */}
                                    <img
                                        src={fotoPerfil(cliente)}
                                        alt={`Foto de ${cliente.nome}`}
                                        data-tentativa="0"
                                        onError={(e) => trocarFotoPerfil(e, cliente)}
                                    />
                                </div>

                                {/* Etiqueta visual de ativo ou bloqueado. */}
                                <span
                                    className={`${css.status} ${
                                        textoSituacao(cliente) === "Bloqueado" ? css.status_bloqueado : css.status_ativo
                                    }`}
                                >
                                    {/* Texto do status calculado pela funcao. */}
                                    {textoSituacao(cliente)}
                                </span>
                            </div>

                            {/* Bloco principal com nome e email. */}
                            <div className={css.card_info_principal}>
                                {/* Nome do cliente. */}
                                <h2>{cliente.nome}</h2>
                                {/* Email do cliente. */}
                                <p>{cliente.email}</p>
                            </div>

                            {/* Bloco com telefone e CPF. */}
                            <div className={css.dados_cliente}>
                                {/* Campo visual de telefone. */}
                                <div>
                                    <span>Telefone</span>
                                    <strong className={css.telefone_valor}>{formatarTelefone(cliente.telefone)}</strong>
                                </div>
                                {/* Campo visual de CPF. */}
                                <div>
                                    <span>CPF</span>
                                    <strong className={css.cpf_valor}>{formatarCpf(cliente.cpf)}</strong>
                                </div>
                            </div>

                            {/* Se estiver bloqueado, mostra apenas desbloquear e excluir. */}
                            {clienteBloqueado(cliente) ? (
                                <div className={`${css.acoes} ${css.acoes_bloqueado}`}>
                                    {/* Botao abre confirmacao para desbloquear. */}
                                    <button type="button" className={css.btn_desbloquear} onClick={() => abrirConfirmacaoBloqueio(cliente, false)}>
                                        Desbloquear
                                    </button>
                                    {/* Botao abre confirmacao para excluir. */}
                                    <button type="button" className={css.btn_excluir} onClick={() => abrirConfirmacaoExclusao(cliente)}>
                                        <img src="/Exculir.png" alt="Excluir perfil" />
                                        Excluir
                                    </button>
                                </div>
                            ) : (
                                <div className={css.acoes}>
                                    {/* Botao abre modal de edicao. */}
                                    <button type="button" className={css.btn_editar} onClick={() => abrirEdicao(cliente)}>
                                        <img src="/Editar.png" alt="Editar o perfil" />
                                        Editar
                                    </button>
                                    {/* Botao abre confirmacao para bloquear. */}
                                    <button type="button" className={css.btn_bloquear} onClick={() => abrirConfirmacaoBloqueio(cliente, true)}>
                                        Bloquear
                                    </button>
                                    {/* Botao abre confirmacao para excluir. */}
                                    <button type="button" className={css.btn_excluir} onClick={() => abrirConfirmacaoExclusao(cliente)}>
                                        <img src="/Exculir.png" alt="Excluir perfil" />
                                        Excluir
                                    </button>
                                </div>
                            )}
                        </article>
                    ))}
                </section>

                {!carregando && clientesFiltrados.length > 0 && (
                    <div className={css.paginacao_area}>
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={clientesFiltrados.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}

                {/* Mostra o modal apenas quando existe um cliente em edicao. */}
                {clienteEditando && (
                    <div className={css.modal_overlay}>
                        {/* Fundo escuro do modal. */}
                        {/* Formulario de edicao enviado pela funcao salvarEdicao. */}
                        <form className={css.modal} onSubmit={salvarEdicao}>
                            {/* Cabecalho do modal. */}
                            <header className={css.modal_cabecalho}>
                                {/* Titulo do modal. */}
                                <h2>Editar cliente</h2>
                                {/* Botao para fechar o modal sem salvar. */}
                                <button type="button" onClick={fecharEdicao} aria-label="Fechar modal">x</button>
                            </header>

                            {/* Grid com os campos editaveis. */}
                            <div className={css.form_grid}>
                                {/* Campo de nome. */}
                                <label>
                                    Nome
                                    <input
                                        type="text"
                                        value={formulario.nome}
                                        onChange={(e) => atualizarCampo("nome", e.target.value)}
                                        required
                                    />
                                </label>

                                {/* Campo de email. */}
                                <label>
                                    Email
                                    <input
                                        type="email"
                                        value={formulario.email}
                                        onChange={(e) => atualizarCampo("email", e.target.value)}
                                        required
                                    />
                                </label>

                                {/* Campo de telefone com mascara. */}
                                <label>
                                    Telefone
                                    <input
                                        type="tel"
                                        value={formulario.telefone}
                                        onChange={(e) => atualizarCampo("telefone", mascararTelefone(e.target.value))}
                                        inputMode="numeric"
                                        maxLength="15"
                                        required
                                    />
                                </label>

                                {/* Campo de CPF com mascara. */}
                                <label>
                                    CPF
                                    <input
                                        type="text"
                                        value={formulario.cpf}
                                        onChange={(e) => atualizarCampo("cpf", mascararCpf(e.target.value))}
                                        inputMode="numeric"
                                        maxLength="14"
                                        required
                                    />
                                </label>

                                {/* Campo opcional de nova senha. */}
                                <label className={css.campo_inteiro}>
                                    Nova senha
                                    <input
                                        type="password"
                                        value={formulario.senha}
                                        onChange={(e) => atualizarCampo("senha", e.target.value)}
                                        placeholder="Deixe vazio para manter a senha atual"
                                    />
                                </label>
                            </div>

                            {/* Rodape com botoes do modal. */}
                            <footer className={css.modal_botoes}>
                                {/* Botao cancela a edicao e fecha o modal. */}
                                <button type="button" className={css.btn_cancelar} onClick={fecharEdicao}>
                                    Cancelar
                                </button>
                                {/* Botao envia o formulario; fica desabilitado enquanto salva. */}
                                <button type="submit" className={css.btn_salvar} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar alteracoes"}
                                </button>
                            </footer>
                        </form>
                    </div>
                )}

                {/* Mostra o modal de confirmacao apenas quando ele estiver aberto. */}
                {confirmacao.aberta && (
                    <div className={css.confirm_overlay}>
                        {/* Caixa central de confirmacao. */}
                        <div className={css.confirm_box}>
                            <h3>Confirmar ação</h3>
                            {/* Texto dinamico com a acao escolhida. */}
                            <p>{confirmacao.texto}</p>
                            {/* Botoes para confirmar ou cancelar. */}
                            <div className={css.confirm_botoes}>
                                {/* Executa a acao guardada no estado confirmacao. */}
                                <button type="button" className={css.confirm_ok} onClick={confirmarAcao}>
                                    OK
                                </button>
                                {/* Fecha o modal sem executar nada. */}
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

export default DashboardAdmClientes;
