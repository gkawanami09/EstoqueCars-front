// Importa hooks para estado, carregamento inicial e filtro.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegação do react-router-dom.
import { useNavigate } from "react-router-dom";
// Importa o CSS module da tela de clientes.
import css from "./DashboardAdmClientes.module.css";
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
    const navigate = useNavigate();

    // Estados da aplicação
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [paginaAtual, setPaginaAtual] = useState(1);
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
                return;
            }

            // Filtra para não mostrar Admins (tipo 2)
            const somenteClientes = (Array.isArray(dados) ? dados : []).filter(
                (usuario) => Number(usuario.tipo_usuario) !== 2
            );

            setClientes(somenteClientes);
        } catch {
            setMensagem({ tipo: "erro", texto: "Não foi possível conectar ao servidor." });
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

    // Auxiliares de Máscara
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
                    <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
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
                <div
                    className={css.area_filtros}
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '35px',       /* Aumentado o espaço entre os botões */
                        marginTop: '40px', /* Aumentado para descer mais os botões */
                        marginBottom: '40px', /* Espaço em relação aos cards abaixo */
                        flexWrap: 'wrap'
                    }}
                >
                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Todos"); setPaginaAtual(1); }}
                        style={{
                            backgroundColor: filtroTipo === "Todos" ? '#F45B5B' : '#000000',
                            color: '#FFFFFF',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '15px',
                            transition: 'background-color 0.2s ease'
                        }}
                    >
                        Todos
                    </button>

                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Cliente"); setPaginaAtual(1); }}
                        style={{
                            backgroundColor: filtroTipo === "Cliente" ? '#F45B5B' : '#000000',
                            color: '#FFFFFF',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '15px',
                            transition: 'background-color 0.2s ease'
                        }}
                    >
                        Cliente
                    </button>

                    <button
                        type="button"
                        onClick={() => { setFiltroTipo("Vendedor"); setPaginaAtual(1); }}
                        style={{
                            backgroundColor: filtroTipo === "Vendedor" ? '#F45B5B' : '#000000',
                            color: '#FFFFFF',
                            padding: '12px 32px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '15px',
                            transition: 'background-color 0.2s ease'
                        }}
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
                                >
                                    {clienteBloqueado(cliente) ? "Desbloquear" : "Bloquear"}
                                </button>

                                <button type="button" className={css.btn_excluir}>
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
                            onChange={(pagina) => setPaginaAtual(pagina)}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

export default DashboardAdmClientes;