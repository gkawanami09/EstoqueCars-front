import { useEffect, useMemo, useState } from "react";
import css from "./DashboardAdmMarcas.module.css";

function DashboardAdmMarcas({ API }) {
    const [marcas, setMarcas] = useState([]);
    const [busca, setBusca] = useState("");
    const [nomeMarca, setNomeMarca] = useState("");
    const [marcaEditando, setMarcaEditando] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    const [confirmacao, setConfirmacao] = useState({
        aberta: false,
        marca: null
    });

    useEffect(() => {
        carregarMarcas();
    }, []);

    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    function idMarca(marca) {
        return marca?.id_marca || marca?.ID_MARCA || marca?.id || marca?.ID;
    }

    function textoMarca(marca) {
        return marca?.marca || marca?.MARCA || marca?.nome || marca?.NOME || "";
    }

    async function lerResposta(resposta) {
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

    async function carregarMarcas({ limparMensagem = true } = {}) {
        setCarregando(true);
        if (limparMensagem) {
            setMensagem(null);
        }

        try {
            const resposta = await fetch(`${API}/buscar_marca`, {
                method: "POST",
                credentials: "include"
            });
            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel carregar as marcas."
                });
                return false;
            }

            const lista = dados.marca || dados.marcas || dados;
            setMarcas(Array.isArray(lista) ? lista : []);
            return true;
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
            return false;
        } finally {
            setCarregando(false);
        }
    }

    const marcasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return marcas;
        }

        return marcas.filter((marca) => textoMarca(marca).toLowerCase().includes(termo));
    }, [busca, marcas]);

    function limparFormulario() {
        setNomeMarca("");
        setMarcaEditando(null);
        setSalvando(false);
    }

    function editarMarca(marca) {
        setMarcaEditando(marca);
        setNomeMarca(textoMarca(marca));
        setMensagem(null);
    }

    async function salvarMarca(e) {
        e.preventDefault();
        setMensagem(null);

        const nome = nomeMarca.trim();
        if (!nome) {
            setMensagem({
                tipo: "erro",
                texto: "Informe o nome da marca."
            });
            return;
        }

        const formData = new FormData();
        formData.append("marca", nome);
        formData.append("nome", nome);
        formData.append("nova_marca", nome);

        const editando = Boolean(marcaEditando);
        const id = idMarca(marcaEditando);
        const url = editando ? `${API}/editar_marca/${id}` : `${API}/cadastrar_marca`;

        setSalvando(true);

        try {
            const resposta = await fetch(url, {
                method: editando ? "PUT" : "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || `Não foi possivel ${editando ? "editar" : "cadastrar"} a marca.`
                });
                return;
            }

            const mensagemSucesso = {
                tipo: "sucesso",
                texto: dados.mensagem || `Marca ${editando ? "editada" : "cadastrada"} com sucesso.`
            };
            limparFormulario();
            const recarregou = await carregarMarcas({ limparMensagem: false });
            if (recarregou) {
                setMensagem(mensagemSucesso);
            }
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Não foi possivel conectar ao servidor."
            });
        } finally {
            setSalvando(false);
        }
    }

    function abrirConfirmacaoExclusao(marca) {
        setConfirmacao({
            aberta: true,
            marca
        });
    }

    function fecharConfirmacao() {
        setConfirmacao({
            aberta: false,
            marca: null
        });
    }

    async function excluirMarca() {
        const marca = confirmacao.marca;

        if (!marca) {
            return;
        }

        setMensagem(null);
        fecharConfirmacao();

        try {
            const resposta = await fetch(`${API}/deletar_marca/${idMarca(marca)}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await lerResposta(resposta);

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Nao foi possivel excluir a marca."
                });
                return;
            }

            setMarcas((listaAtual) => listaAtual.filter((item) => idMarca(item) !== idMarca(marca)));
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Marca excluida com sucesso."
            });
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        }
    }

    return (
        <main className={css.container}>
            <header className={css.cabecalho}>
                <div>
                    <h1>Marcas</h1>
                    <p>Cadastre, edite e remova as marcas usadas nos veiculos.</p>
                </div>
            </header>

            {mensagem && (
                <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
                    <div>
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atencao"}</strong>
                        <span>{mensagem.texto}</span>
                    </div>
                    <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                        x
                    </button>
                </div>
            )}

            <section className={css.painel}>
                <form className={css.formulario} onSubmit={salvarMarca}>
                    <label>
                        Nome da marca
                        <input
                            type="text"
                            value={nomeMarca}
                            onChange={(e) => setNomeMarca(e.target.value)}
                            placeholder="Ex: Toyota"
                            maxLength="80"
                            required
                        />
                    </label>

                    <div className={css.botoes_form}>
                        {marcaEditando && (
                            <button type="button" className={css.cancelar} onClick={limparFormulario}>
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className={css.salvar} disabled={salvando}>
                            {salvando ? "Salvando..." : marcaEditando ? "Salvar edicao" : "Cadastrar marca"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={css.lista_area}>
                <div className={css.lista_topo}>
                    <h2>Marcas cadastradas</h2>
                    <div className={css.busca}>
                        <img src="/IconBusca.png" alt="Buscar" />
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Buscar marca"
                        />
                    </div>
                </div>

                {carregando && <div className={css.estado}>Carregando marcas...</div>}

                {!carregando && marcasFiltradas.length === 0 && (
                    <div className={css.estado}>Nenhuma marca encontrada</div>
                )}

                {!carregando && marcasFiltradas.length > 0 && (
                    <div className={css.tabela}>
                        {marcasFiltradas.map((marca) => (
                            <article key={idMarca(marca)} className={css.linha}>
                                <div>
                                    <span>Marca</span>
                                    <strong>{textoMarca(marca)}</strong>
                                </div>
                                <div className={css.acoes}>
                                    <button type="button" className={css.editar} onClick={() => editarMarca(marca)}>
                                        Editar
                                    </button>
                                    <button type="button" className={css.excluir} onClick={() => abrirConfirmacaoExclusao(marca)}>
                                        Excluir
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {confirmacao.aberta && (
                <div className={css.alert_overlay}>
                    <div className={css.alert_box} role="dialog" aria-modal="true" aria-labelledby="titulo-alerta-marca">
                        <div className={css.alert_icone}>!</div>
                        <div className={css.alert_conteudo}>
                            <h3 id="titulo-alerta-marca">Excluir marca?</h3>
                            <p>
                                Deseja excluir a marca <strong>{textoMarca(confirmacao.marca)}</strong>? Essa acao nao pode ser desfeita.
                            </p>
                        </div>
                        <div className={css.alert_botoes}>
                            <button type="button" className={css.alert_cancelar} onClick={fecharConfirmacao}>
                                Cancelar
                            </button>
                            <button type="button" className={css.alert_excluir} onClick={excluirMarca}>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default DashboardAdmMarcas;
