// Importa hooks para estado, carregamento inicial e filtro.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o CSS module da tela de clientes.
import css from "./DashboardAdmClientes.module.css";

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
    // Lista de clientes carregada da API.
    const [clientes, setClientes] = useState([]);
    // Texto digitado na busca.
    const [busca, setBusca] = useState("");
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
        aberta: false,
        tipo: "",
        cliente: null,
        bloquear: false,
        texto: ""
    });

    // Monta o header X-Access-Token quando existe token.
    function cabecalhoAutorizacao() {
        // Busca token salvo no navegador.
        const token = localStorage.getItem("access_token");
        // Sem token, nao envia header.
        if (!token) {
            return undefined;
        }

        // Retorna o token no header customizado.
        return { "X-Access-Token": token };
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
                method: "GET",
                headers: cabecalhoAutorizacao(),
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
    }, [API]);

    // Carrega clientes quando a tela abre.
    useEffect(() => {
        carregarClientes();
    }, [carregarClientes]);

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
            const campos = [cliente.nome, cliente.email, cliente.telefone, cliente.cpf];
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, clientes]);

    // Abre modal de edicao com os dados do cliente.
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

    // Fecha modal e limpa formulario.
    function fecharEdicao() {
        setClienteEditando(null);
        setFormulario(clienteInicial);
        setSalvando(false);
    }

    // Atualiza um campo do formulario.
    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({
            ...atual,
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
            setMensagem({
                tipo: "erro",
                texto: "Preencha nome, email, telefone e CPF."
            });
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
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API recusou.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel editar o cliente."
                });
                return;
            }

            // Atualiza o cliente editado na lista local.
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
            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente editado com sucesso."
            });
            // Fecha modal.
            fecharEdicao();
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
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
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API bloquear.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel excluir o cliente."
                });
                return;
            }

            // Remove cliente da lista da tela.
            setClientes((listaAtual) => listaAtual.filter((item) => item.id_usuario !== cliente.id_usuario));
            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente removido com sucesso."
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
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
                method: "PUT",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Mostra erro se a API recusou.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || `Nao foi possivel ${acao} o cliente.`
                });
                return;
            }

            // Atualiza o status local do cliente.
            setSituacoes((atuais) => ({
                ...atuais,
                [cliente.id_usuario]: bloquear ? "bloqueado" : "ativo"
            }));
            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || `Cliente ${bloquear ? "bloqueado" : "desbloqueado"} com sucesso.`
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    // Abre confirmacao para excluir cliente.
    function abrirConfirmacaoExclusao(cliente) {
        setConfirmacao({
            aberta: true,
            tipo: "excluir",
            cliente,
            bloquear: false,
            texto: `Deseja excluir ${cliente.nome}?`
        });
    }

    // Abre confirmacao para bloquear ou desbloquear.
    function abrirConfirmacaoBloqueio(cliente, bloquear) {
        setConfirmacao({
            aberta: true,
            tipo: "bloqueio",
            cliente,
            bloquear,
            texto: `Deseja ${bloquear ? "bloquear" : "desbloquear"} ${cliente.nome}?`
        });
    }

    // Fecha a caixa de confirmacao.
    function fecharConfirmacao() {
        setConfirmacao({
            aberta: false,
            tipo: "",
            cliente: null,
            bloquear: false,
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
        return mascararTelefone(valor) || "-";
    }

    // Mostra CPF formatado ou traco.
    function formatarCpf(valor) {
        return mascararCpf(valor) || "-";
    }

    // Define o texto de situacao do cliente.
    function textoSituacao(cliente) {
        return situacoes[cliente.id_usuario] === "bloqueado" ? "Bloqueado" : "Ativo";
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

                {mensagem && (
                    <div
                        className={`${css.mensagem} ${
                            mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                        }`}
                    >
                        <div className={css.mensagem_info}>
                            <span className={css.mensagem_icone}>
                                {mensagem.tipo === "sucesso" ? "✓" : "!"}
                            </span>
                            <div className={css.mensagem_texto}>
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atencao"}</strong>
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                            x
                        </button>
                    </div>
                )}

                <div className={css.barra_acoes}>
                    <div className={css.area_busca}>
                        <span className={css.icone_busca}>⌕</span>
                        <input
                            type="text"
                            placeholder="Buscar clientes"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>

                </div> <br/>

                <section className={css.cards_container}>
                    {carregando && (
                        <div className={css.estado_lista}>Carregando clientes...</div>
                    )}

                    {!carregando && clientesFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum cliente encontrado</div>
                    )}

                    {!carregando && clientesFiltrados.map((cliente) => (
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

                                <span
                                    className={`${css.status} ${
                                        textoSituacao(cliente) === "Bloqueado" ? css.status_bloqueado : css.status_ativo
                                    }`}
                                >
                                    {textoSituacao(cliente)}
                                </span>
                            </div>

                            <div className={css.card_info_principal}>
                                <h2>{cliente.nome}</h2>
                                <p>{cliente.email}</p>
                            </div>

                            <div className={css.dados_cliente}>
                                <div>
                                    <span>Telefone</span>
                                    <strong className={css.telefone_valor}>{formatarTelefone(cliente.telefone)}</strong>
                                </div>
                                <div>
                                    <span>CPF</span>
                                    <strong className={css.cpf_valor}>{formatarCpf(cliente.cpf)}</strong>
                                </div>
                            </div>

                            <div className={css.acoes}>
                                <button type="button" className={css.btn_editar} onClick={() => abrirEdicao(cliente)}>
                                    <img src="/Editar.png" alt="Editar o perfil" />
                                    Editar
                                </button>
                                <button type="button" className={css.btn_bloquear} onClick={() => abrirConfirmacaoBloqueio(cliente, true)}>
                                    Bloquear
                                </button>
                                <button type="button" className={css.btn_desbloquear} onClick={() => abrirConfirmacaoBloqueio(cliente, false)}>
                                    Desbloquear
                                </button>
                                <button type="button" className={css.btn_excluir} onClick={() => abrirConfirmacaoExclusao(cliente)}>
                                    <img src="/Exculir.png" alt="Excluir perfil" />
                                    Excluir
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                {clienteEditando && (
                    <div className={css.modal_overlay}>
                        <form className={css.modal} onSubmit={salvarEdicao}>
                            <header className={css.modal_cabecalho}>
                                <h2>Editar cliente</h2>
                                <button type="button" onClick={fecharEdicao} aria-label="Fechar modal">x</button>
                            </header>

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

                            <footer className={css.modal_botoes}>
                                <button type="button" className={css.btn_cancelar} onClick={fecharEdicao}>
                                    Cancelar
                                </button>
                                <button type="submit" className={css.btn_salvar} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar alteracoes"}
                                </button>
                            </footer>
                        </form>
                    </div>
                )}

                {confirmacao.aberta && (
                    <div className={css.confirm_overlay}>
                        <div className={css.confirm_box}>
                            <h3>Confirmar ação</h3>
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
