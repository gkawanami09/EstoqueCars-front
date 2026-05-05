// Importa hooks para estado, carregamento inicial e filtro.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegação do react-router-dom.
import { useNavigate } from "react-router-dom";
// Importa o CSS module da tela de clientes.
import css from "./DashboardAdmClientes.module.css";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";
import useScrollMensagem from "../hooks/useScrollMensagem";

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
    const navigate = useNavigate();


    // Estados da aplicação

    // Recebe a URL base da API Flask por props.
    // Lista de clientes carregada da API.

    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState(null);


    // Referencia do alerta para rolar a tela ate ele quando houver retorno da API.
    const mensagemRef = useScrollMensagem(mensagem);
    // Cliente aberto no modal de edicao.

    const [clienteEditando, setClienteEditando] = useState(null);
    const [formulario, setFormulario] = useState(clienteInicial);
    const [situacoes, setSituacoes] = useState({});
    const [salvando, setSalvando] = useState(false);

    const [confirmacao, setConfirmacao] = useState({
        aberta: false,
        tipo: "",
        cliente: null,
        bloquear: false,
        texto: ""
    });

    // Função para cabeçalho de autenticação
    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        if (!token) return undefined;
        return { Authorization: `Bearer ${token}` };
    }

    // Carrega os usuários da API
    const carregarClientes = useCallback(async () => {
        setCarregando(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/listar_usuario`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {

                setMensagem({ tipo: "erro", texto: dados.erro || "Não foi possível carregar os clientes." });

                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possivel carregar os clientes."
                });

                return;
            }

            // Filtra para não mostrar Admins (tipo 2)
            const somenteClientes = (Array.isArray(dados) ? dados : []).filter(
                (usuario) => Number(usuario.tipo_usuario) !== 2
            );

            setClientes(somenteClientes);
        } catch {

            setMensagem({ tipo: "erro", texto: "Não foi possível conectar ao servidor." });
           // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possivel conectar ao servidor."
            });

        } finally {
            setCarregando(false);
        }
    }, [API]);

    useEffect(() => {
        carregarClientes();
    }, [carregarClientes]);

    // Lógica de Filtro (Botões + Busca)
    const clientesFiltrados = useMemo(() => {
        let listaFiltrada = clientes;

        // Filtro por tipo de usuário
        if (filtroTipo === "Cliente") {
            listaFiltrada = listaFiltrada.filter((cliente) => Number(cliente.tipo_usuario) === 0);
        } else if (filtroTipo === "Vendedor") {
            listaFiltrada = listaFiltrada.filter((cliente) => Number(cliente.tipo_usuario) === 1);
        }

        const termo = busca.trim().toLowerCase();
        if (!termo) return listaFiltrada;

        return listaFiltrada.filter((cliente) => {
            const campos = [cliente.nome, cliente.email, cliente.telefone, cliente.cpf];
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, clientes, filtroTipo]);

    // Lógica de Paginação
    const totalPaginas = Math.max(1, Math.ceil(clientesFiltrados.length / ITENS_POR_PAGINA));

    useEffect(() => {
        if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
    }, [paginaAtual, totalPaginas]);

    const clientesPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return clientesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [clientesFiltrados, paginaAtual]);


    function abrirEdicao(cliente) {
        setClienteEditando(cliente);
        setFormulario({
            id_usuario: cliente.id_usuario,
            nome: cliente.nome || "",
            email: cliente.email || "",
            telefone: mascararTelefone(cliente.telefone),
            cpf: mascararCpf(cliente.cpf),
            senha: ""
        });
        setMensagem(null);
    }

    function fecharEdicao() {
        setClienteEditando(null);
        setFormulario(clienteInicial);
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
                    texto: dados.erro || "Não foi possivel editar o cliente."
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
                texto: "Não foi possivel conectar ao servidor."
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
                    texto: dados.erro || "Não foi possivel excluir o cliente."
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
                texto: "Não foi possivel conectar ao servidor."
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
                    texto: dados.erro || `Não foi possivel ${acao} o cliente.`
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
                texto: "Não foi possivel conectar ao servidor."
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
        return String(valor || "").replace(/\D/g, "").slice(0, limite);
    }

    function mascararTelefone(valor) {
        const n = somenteNumeros(valor, 11);
        if (n.length <= 2) return n ? `(${n}` : "";
        if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
        if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
        return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    }

    function mascararCpf(valor) {
        const n = somenteNumeros(valor, 11);
        if (n.length <= 3) return n;
        if (n.length <= 6) return `${n.slice(0, 3)}.${n.slice(3)}`;
        if (n.length <= 9) return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6)}`;
        return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
    }

    function clienteBloqueado(cliente) {
        if (situacoes[cliente.id_usuario]) return situacoes[cliente.id_usuario] === "bloqueado";
        return Number(cliente.situacao) === 1;
    }

    function fotoPerfil(cliente) {
        return `${API}/uploads/${cliente.id_usuario}.jpg`;
    }

    function trocarFotoPerfil(e, cliente) {
        const img = e.currentTarget;
        const tentativa = Number(img.dataset.tentativa || 0);
        const extensoes = ["png", "pgn"];
        if (tentativa < extensoes.length) {
            img.dataset.tentativa = String(tentativa + 1);
            img.src = `${API}/uploads/${cliente.id_usuario}.${extensoes[tentativa]}`;
            return;
        }
        img.src = "/IconPerfil.png";
    }


    return (
        <div className={css.layout_dashboard}>
            <main className={css.conteudo_principal}>
                <header className={css.cabecalho}>
                    <div>
                        <h1 className={css.titulo}>Usuários</h1>
                    </div>
                </header>

                {mensagem && (
                    <div
                        ref={mensagemRef}
                        className={`${css.mensagem} ${
                            mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                        }`}
                    >
                        {/* Agrupa icone e textos da mensagem. */}

                        <div className={css.mensagem_info}>
                            <span className={css.mensagem_icone}>{mensagem.tipo === "sucesso" ? "✓" : "!"}</span>
                            <div className={css.mensagem_texto}>
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atenção"}</strong>
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        <button type="button" onClick={() => setMensagem(null)}>x</button>
                    </div>
                )}

                <div className={css.barra_acoes}>
                    <div className={css.area_busca}>
                        <span className={css.icone_busca}>⌕</span>
                        <input
                            type="text"
                            placeholder="Buscar clientes"
                            value={busca}
                            onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
                        />
                    </div>

                    <button type="button" className={css.btn_add} onClick={() => navigate("/CadastroCliente")}>
                        Cadastrar Usuário
                    </button>
                </div>
                {/* AREA DE FILTROS */}
                <div className={css.area_filtros}>
                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Todos"); setPaginaAtual(1); }}
                        className={`${css.btn_filtro} ${filtroTipo === "Todos" ? css.btn_filtro_ativo : ""}`}
                    >
                        Todos
                    </button>

                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Cliente"); setPaginaAtual(1); }}
                        className={`${css.btn_filtro} ${filtroTipo === "Cliente" ? css.btn_filtro_ativo : ""}`}
                    >
                        Cliente
                    </button>

                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Vendedor"); setPaginaAtual(1); }}
                        className={`${css.btn_filtro} ${filtroTipo === "Vendedor" ? css.btn_filtro_ativo : ""}`}
                    >
                        Vendedor
                    </button>
                </div>

                <section className={css.cards_container}>
                    {carregando && <div className={css.estado_lista}>Carregando clientes...</div>}
                    {!carregando && clientesFiltrados.length === 0 && <div className={css.estado_lista}>Nenhum cliente encontrado</div>}

                    {!carregando && clientesPaginados.map((cliente) => (
                        <article key={cliente.id_usuario} className={css.card_cliente}>
                            <div className={css.card_topo}>
                                <div className={css.avatar}>
                                    <img
                                        src={fotoPerfil(cliente)}
                                        alt={`Foto de ${cliente.nome}`}
                                        data-tentativa="0"
                                        onError={(e) => trocarFotoPerfil(e, cliente)}
                                    />
                                </div>
                                <span className={`${css.status} ${clienteBloqueado(cliente) ? css.status_bloqueado : css.status_ativo}`}>
                                    {clienteBloqueado(cliente) ? "Bloqueado" : "Ativo"}
                                </span>
                            </div>

                            <div className={css.card_info_principal}>
                                <h2>{cliente.nome}</h2>
                                <p>{cliente.email}</p>
                            </div>

                            <div className={css.dados_cliente}>
                                <div>
                                    <span>Telefone</span>
                                    <strong className={css.telefone_valor}>{mascararTelefone(cliente.telefone) || "-"}</strong>
                                </div>
                                <div>
                                    <span>CPF</span>
                                    <strong className={css.cpf_valor}>{mascararCpf(cliente.cpf) || "-"}</strong>
                                </div>
                            </div>

                            <div className={css.acoes}>
                                {!clienteBloqueado(cliente) && (
                                    <button type="button" className={css.btn_editar} onClick={() => abrirEdicao(cliente)}>
                                        <img src="/Editar.png" alt="Editar" /> Editar
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className={clienteBloqueado(cliente) ? css.btn_desbloquear : css.btn_bloquear}
                                    onClick={() => abrirConfirmacaoBloqueio(cliente, !clienteBloqueado(cliente))}
                                >
                                    {clienteBloqueado(cliente) ? "Desbloquear" : "Bloquear"}
                                </button>

                                <button type="button" className={css.btn_excluir} onClick={() => abrirConfirmacaoExclusao(cliente)}>
                                    <img src="/Exculir.png" alt="Excluir" /> Excluir
                                </button>
                            </div>
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
                        {/* Formulario de edicao enviado pela funcao salvarEdicao. */}
                        <form className={css.modal} onSubmit={salvarEdicao}>
                            {/* Cabecalho do modal. */}
                            <header className={css.modal_cabecalho}>
                                <h2>Editar cliente</h2>
                                <button type="button" onClick={fecharEdicao} aria-label="Fechar modal">x</button>
                            </header>

                            {/* Grid com os campos editaveis. */}
                            <div className={css.form_grid}>
                                <label>
                                    Nome
                                    <input
                                        type="text"
                                        value={formulario.nome}
                                        onChange={(e) => atualizarCampo("nome", e.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    Email
                                    <input
                                        type="email"
                                        value={formulario.email}
                                        onChange={(e) => atualizarCampo("email", e.target.value)}
                                        required
                                    />
                                </label>

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
                                <button type="button" className={css.btn_cancelar} onClick={fecharEdicao}>
                                    Cancelar
                                </button>
                                <button type="submit" className={css.btn_salvar} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </footer>
                        </form>
                    </div>
                )}

                {/* Mostra o modal de confirmacao apenas quando ele estiver aberto. */}
                {confirmacao.aberta && (
                    <div className={css.confirm_overlay}>
                        <div className={css.confirm_box}>
                            <h3>Confirmar ação</h3> <br></br>                            
                            <p>{confirmacao.texto}</p>
                            <div className={css.confirm_botoes}>
                                <button type="button" className={css.confirm_ok} onClick={confirmarAcao}>
                                    OK
                                </button>
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
