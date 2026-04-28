import { useEffect, useMemo, useState } from "react";
import css from "./DashboardAdmClientes.module.css";

const clienteInicial = {
    id_usuario: "",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    senha: ""
};

function DashboardAdmClientes({ API }) {
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState(null);
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

    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        if (!token) {
            return undefined;
        }

        return { Authorization: `Bearer ${token}` };
    }

    useEffect(() => {
        carregarClientes();
    }, []);

    async function carregarClientes() {
        setCarregando(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/listar_usuario`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel carregar os clientes."
                });
                return;
            }

            const somenteClientes = (Array.isArray(dados) ? dados : []).filter(
                (usuario) => Number(usuario.tipo_usuario) !== 2
            );

            setClientes(somenteClientes);
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setCarregando(false);
        }
    }

    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) {
            return clientes;
        }

        return clientes.filter((cliente) => {
            const campos = [cliente.nome, cliente.email, cliente.telefone, cliente.cpf];
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, clientes]);

    function abrirEdicao(cliente) {
        setClienteEditando(cliente);
        setFormulario({
            id_usuario: cliente.id_usuario,
            nome: cliente.nome || "",
            email: cliente.email || "",
            telefone: cliente.telefone || "",
            cpf: cliente.cpf || "",
            senha: ""
        });
        setMensagem(null);
    }

    function fecharEdicao() {
        setClienteEditando(null);
        setFormulario(clienteInicial);
        setSalvando(false);
    }

    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({
            ...atual,
            [campo]: valor
        }));
    }

    async function salvarEdicao(e) {
        e.preventDefault();
        setMensagem(null);

        if (!formulario.nome.trim() || !formulario.email.trim() || !formulario.telefone.trim() || !formulario.cpf.trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Preencha nome, email, telefone e CPF."
            });
            return;
        }

        const formData = new FormData();
        formData.append("nome", formulario.nome);
        formData.append("email", formulario.email);
        formData.append("telefone", formulario.telefone.replace(/\D/g, ""));
        formData.append("cpf", formulario.cpf.replace(/\D/g, ""));
        if (formulario.senha.trim()) {
            formData.append("senha", formulario.senha);
        }

        setSalvando(true);

        try {
            const resposta = await fetch(`${API}/editar_usuario/${formulario.id_usuario}`, {
                method: "POST",
                credentials: "include",
                body: formData
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel editar o cliente."
                });
                return;
            }

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
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente editado com sucesso."
            });
            fecharEdicao();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setSalvando(false);
        }
    }

    async function excluirCliente(cliente) {
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/excluir_usuario/${cliente.id_usuario}`, {
                method: "DELETE",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel excluir o cliente."
                });
                return;
            }

            setClientes((listaAtual) => listaAtual.filter((item) => item.id_usuario !== cliente.id_usuario));
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente removido com sucesso."
            });
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    async function alterarBloqueio(cliente, bloquear) {
        const rota = bloquear ? "bloquear_usuario" : "desbloquear_usuario";
        const acao = bloquear ? "bloquear" : "desbloquear";

        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/${rota}/${cliente.id_usuario}`, {
                method: "PUT",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || `Nao foi possivel ${acao} o cliente.`
                });
                return;
            }

            setSituacoes((atuais) => ({
                ...atuais,
                [cliente.id_usuario]: bloquear ? "bloqueado" : "ativo"
            }));
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || `Cliente ${bloquear ? "bloqueado" : "desbloqueado"} com sucesso.`
            });
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    function abrirConfirmacaoExclusao(cliente) {
        setConfirmacao({
            aberta: true,
            tipo: "excluir",
            cliente,
            bloquear: false,
            texto: `Deseja excluir ${cliente.nome}?`
        });
    }

    function abrirConfirmacaoBloqueio(cliente, bloquear) {
        setConfirmacao({
            aberta: true,
            tipo: "bloqueio",
            cliente,
            bloquear,
            texto: `Deseja ${bloquear ? "bloquear" : "desbloquear"} ${cliente.nome}?`
        });
    }

    function fecharConfirmacao() {
        setConfirmacao({
            aberta: false,
            tipo: "",
            cliente: null,
            bloquear: false,
            texto: ""
        });
    }

    async function confirmarAcao() {
        const { tipo, cliente, bloquear } = confirmacao;
        fecharConfirmacao();

        if (!cliente) {
            return;
        }

        if (tipo === "excluir") {
            await excluirCliente(cliente);
            return;
        }

        if (tipo === "bloqueio") {
            await alterarBloqueio(cliente, bloquear);
        }
    }

    function formatarTelefone(valor) {
        const numeros = String(valor || "").replace(/\D/g, "");

        if (numeros.length === 11) {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }

        if (numeros.length === 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }

        return valor || "-";
    }

    function formatarCpf(valor) {
        const numeros = String(valor || "").replace(/\D/g, "");

        if (numeros.length === 11) {
            return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        }

        return valor || "-";
    }

    function textoSituacao(cliente) {
        return situacoes[cliente.id_usuario] === "bloqueado" ? "Bloqueado" : "Ativo";
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
                                        onChange={(e) => atualizarCampo("telefone", e.target.value)}
                                        required
                                    />
                                </label>

                                <label>
                                    CPF
                                    <input
                                        type="text"
                                        value={formulario.cpf}
                                        onChange={(e) => atualizarCampo("cpf", e.target.value)}
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
