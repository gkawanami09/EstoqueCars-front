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

    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [mensagem, setMensagem] = useState(null);

    const mensagemRef = useScrollMensagem(mensagem);

    const [clienteEditando, setClienteEditando] = useState(null);
    const [formulario, setFormulario] = useState(clienteInicial);
    const [situacoes, setSituacoes] = useState({});
    const [salvando, setSalvando] = useState(false);

    const [confirmacao, setConfirmacao] = useState({
        aberta: false,
        tipo: "",
        cliente: null,
        bloquear: false,
        texto: "",
        motivo: ""
    });

    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        if (!token) return undefined;
        return { Authorization: `Bearer ${token}` };
    }

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
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possivel carregar os clientes."
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
                texto: "Não foi possivel conectar ao servidor."
            });
        } finally {
            setCarregando(false);
        }
    }, [API]);

    useEffect(() => {
        carregarClientes();
    }, [carregarClientes]);

    const clientesFiltrados = useMemo(() => {
        let listaFiltrada = clientes;

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
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possivel editar o cliente."
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
                texto: "Não foi possivel conectar ao servidor."
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
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possivel excluir o cliente."
                });
                return;
            }

            setClientes((listaAtual) =>
                listaAtual.filter((item) => item.id_usuario !== cliente.id_usuario)
            );

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Cliente removido com sucesso."
            });
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Não foi possivel conectar ao servidor."
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
                    texto: dados.erro || `Não foi possivel ${acao} o cliente.`
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
                texto: "Não foi possivel conectar ao servidor."
            });
        }
    }

    function abrirConfirmacaoExclusao(cliente) {
        setConfirmacao({
            aberta: true,
            tipo: "excluir",
            cliente,
            bloquear: false,
            texto: `Deseja excluir ${cliente.nome}?`,
            motivo: ""
        });
    }

    function abrirConfirmacaoBloqueio(cliente, bloquear) {
        setConfirmacao({
            aberta: true,
            tipo: "bloqueio",
            cliente,
            bloquear,
            texto: `Deseja ${bloquear ? "bloquear" : "desbloquear"} ${cliente.nome}?`,
            motivo: ""
        });
    }

    function fecharConfirmacao() {
        setConfirmacao({
            aberta: false,
            tipo: "",
            cliente: null,
            bloquear: false,
            texto: "",
            motivo: ""
        });
    }

    async function confirmarAcao() {
        const { tipo, cliente, bloquear, motivo } = confirmacao;

        if (bloquear && !motivo.trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Informe o motivo da ação."
            });
            return;
        }

        fecharConfirmacao();

        if (!cliente) return;

        if (tipo === "excluir") {
            await excluirCliente(cliente);
            return;
        }

        if (tipo === "bloqueio") {
            await alterarBloqueio(cliente, bloquear);
        }
    }

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
                            onChange={(e) => {
                                setBusca(e.target.value);
                                setPaginaAtual(1);
                            }}
                        />
                    </div>

                    <button type="button" className={css.btn_add} onClick={() => navigate("/CadastroCliente")}>
                        Cadastrar Usuário
                    </button>
                </div>

                <div className={css.area_filtros}>
                    <button
                        type="button"
                        onClick={() => {
                            setFiltroTipo("Todos");
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Todos" ? css.btn_filtro_ativo : ""}`}
                    >
                        Todos
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFiltroTipo("Cliente");
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Cliente" ? css.btn_filtro_ativo : ""}`}
                    >
                        Cliente
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setFiltroTipo("Vendedor");
                            setPaginaAtual(1);
                        }}
                        className={`${css.btn_filtro} ${filtroTipo === "Vendedor" ? css.btn_filtro_ativo : ""}`}
                    >
                        Vendedor
                    </button>
                </div>

                <section className={css.cards_container}>
                    {carregando && <div className={css.estado_lista}>Carregando clientes...</div>}

                    {!carregando && clientesFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum cliente encontrado</div>
                    )}

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
                                    <strong className={css.telefone_valor}>
                                        {mascararTelefone(cliente.telefone) || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>CPF</span>
                                    <strong className={css.cpf_valor}>
                                        {mascararCpf(cliente.cpf) || "-"}
                                    </strong>
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
                                    {salvando ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </footer>
                        </form>
                    </div>
                )}

                {confirmacao.aberta && (
                    <div className={css.confirm_overlay}>
                        <div className={css.confirm_box}>
                            <h3>Confirmar ação</h3>
                            <br />

                            <p>{confirmacao.texto}</p>

                            {confirmacao.bloquear && (
                                <textarea
                                    className={css.textarea_motivo}
                                    placeholder="Descreva o motivo"
                                    value={confirmacao.motivo}
                                    onChange={(e) =>
                                        setConfirmacao({
                                            ...confirmacao,
                                            motivo: e.target.value
                                        })
                                    }
                                />
                            )}

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