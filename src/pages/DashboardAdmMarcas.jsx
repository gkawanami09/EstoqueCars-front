// Importa hooks usados para estado, filtro, efeito e funcao estavel.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o CSS module da tela.
import css from "./DashboardAdmMarcas.module.css";
// Importa recursos de ../components/Paginacao/Paginacao.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Tela administrativa de marcas.
function DashboardAdmMarcas({ API }) {
    // Lista de marcas vindas da API.
    const [marcas, setMarcas] = useState([]);
    // Texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Pagina atual da lista.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Nome digitado no formulario.
    const [nomeMarca, setNomeMarca] = useState("");
    // Marca que esta sendo editada.
    const [marcaEditando, setMarcaEditando] = useState(null);
    // Carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Carregamento do botao salvar.
    const [salvando, setSalvando] = useState(false);
    // Mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);
   // Dados do modal de confirmacao.
    const [confirmacao, setConfirmacao] = useState({
        aberta: false,
        marca: null
    });

    // Declara a função cabecalhoAutorizacao usada por esta página.
    function cabecalhoAutorizacao() {
        // Declara token para uso neste fluxo.
        const token = localStorage.getItem("access_token");
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    // Pega o id da marca aceitando varios nomes possiveis da API.
    function idMarca(marca) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return marca?.id_marca || marca?.ID_MARCA || marca?.id || marca?.ID;
    }

    // Pega o nome da marca aceitando varios nomes possiveis da API.
    function textoMarca(marca) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return marca?.marca || marca?.MARCA || marca?.nome || marca?.NOME || "";
    }

    // Normaliza o nome para comparar duplicidade sem diferenca de caixa, acento ou espacos extras.
    function normalizarNomeMarca(nome) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return String(nome || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();
    }

    // Le resposta que pode vir vazia ou em JSON.
    async function lerResposta(resposta) {
        // Le primeiro como texto para evitar erro com corpo vazio.
        const texto = await resposta.text();

        // Se nao veio nada, retorna objeto vazio.
        if (!texto) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return {};
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Tenta transformar em JSON.
            return JSON.parse(texto);
        } catch {
            // Se nao for JSON valido, retorna objeto vazio.
            return {};
        }
    }

    // Lista as marcas cadastradas usando a rota de busca da API.
    const carregarMarcas = useCallback(async ({ limparMensagem = true } = {}) => {
        // Liga o carregamento da lista.
        setCarregando(true);
        // Limpa mensagem antiga quando precisa.
        if (limparMensagem) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem(null);
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Chama a API de buscar/listar marcas.
            const resposta = await fetch(`${API}/buscar_marca`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta com seguranca.
            const dados = await lerResposta(resposta);

            // Se a API retornou erro, mostra mensagem.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Não foi possível carregar as marcas."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return false;
            }

            // Aceita a lista em formatos diferentes.
            const lista = dados.marca || dados.marcas || dados;
            // Salva lista valida ou lista vazia.
            setMarcas(Array.isArray(lista) ? lista : []);
            // Indica que carregou com sucesso.
            return true;
        } catch {
            // Mostra erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        } finally {
            // Desliga carregamento da lista.
            setCarregando(false);
        }
    }, [API]);

    // Carrega as marcas quando a tela abre.
    useEffect(() => {
        // Executa carregarMarcas nesta etapa do fluxo.
        carregarMarcas();
    }, [carregarMarcas]);

    // Filtra marcas no front pelo nome digitado no campo de busca.
    const marcasFiltradas = useMemo(() => {
        // Normaliza o termo pesquisado.
        const termo = busca.trim().toLowerCase();

        // Sem busca, retorna todas as marcas.
        if (!termo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return marcas;
        }

        // Retorna apenas marcas que contem o termo.
        return marcas.filter((marca) => textoMarca(marca).toLowerCase().includes(termo));
    }, [busca, marcas]);

    // Total de paginas considerando a busca atual.
    const totalPaginas = Math.max(1, Math.ceil(marcasFiltradas.length / ITENS_POR_PAGINA));

    // Mantem a pagina atual dentro do limite quando a lista muda.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) {
            // Atualiza o estado por meio de setPaginaAtual.
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Mostra somente as marcas da pagina atual.
    const marcasPaginadas = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return marcasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [marcasFiltradas, paginaAtual]);

    // Limpa o formulario e sai do modo de edicao.
    function limparFormulario() {
        // Atualiza o estado por meio de setNomeMarca.
        setNomeMarca("");
        // Atualiza o estado por meio de setMarcaEditando.
        setMarcaEditando(null);
        // Atualiza o estado por meio de setSalvando.
        setSalvando(false);
    }

    // Coloca a marca escolhida no formulario para editar.
    function editarMarca(marca) {
        // Atualiza o estado por meio de setMarcaEditando.
        setMarcaEditando(marca);
        // Atualiza o estado por meio de setNomeMarca.
        setNomeMarca(textoMarca(marca));
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);
    }

    // Cadastra uma nova marca ou atualiza a marca que esta em edicao.
    async function salvarMarca(e) {
        // Evita refresh da pagina.
        e.preventDefault();
        // Limpa mensagem antiga.
        setMensagem(null);

        // Remove espacos extras do nome.
        const nome = nomeMarca.trim();
        // Valida campo obrigatorio.
        if (!nome) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Informe o nome da marca."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Define se esta editando.
        const editando = Boolean(marcaEditando);
        // Pega o id da marca se estiver editando.
        const id = idMarca(marcaEditando);
        // Impede cadastrar ou editar para um nome que ja existe em outra marca.
        const marcaDuplicada = marcas.some((marca) =>
            normalizarNomeMarca(textoMarca(marca)) === normalizarNomeMarca(nome) &&
            String(idMarca(marca)) !== String(id || "")
        );

        // Verifica esta condição antes de continuar o fluxo.
        if (marcaDuplicada) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Já existe uma marca cadastrada com esse nome."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Usa FormData porque o backend Flask le request.form.
        const formData = new FormData();
        // Campo principal para cadastro.
        formData.append("marca", nome);
        // Campo extra para compatibilidade.
        formData.append("nome", nome);
        // Campo usado em algumas rotas de edicao.
        formData.append("nova_marca", nome);

        // Monta a URL correta.
        const url = editando ? `${API}/editar_marca/${id}` : `${API}/cadastrar_marca`;

        // Liga carregamento do botao.
        setSalvando(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Envia POST para cadastrar ou PUT para editar.
            const resposta = await fetch(url, {
                method: editando ? "PUT" : "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            // Le a resposta.
            const dados = await lerResposta(resposta);

            // Se a API recusou, mostra erro.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || `Não foi possível ${editando ? "editar" : "cadastrar"} a marca.`
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Monta a mensagem de sucesso.
            const mensagemSucesso = {
                tipo: "sucesso",
                texto: dados.mensagem || `Marca ${editando ? "editada" : "cadastrada"} com sucesso.`
            };
            // Limpa o formulario.
            limparFormulario();
            // Recarrega a lista sem apagar a mensagem.
            const recarregou = await carregarMarcas({ limparMensagem: false });
            // Mostra sucesso somente se a lista recarregou.
            if (recarregou) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem(mensagemSucesso);
            }
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        } finally {
            // Desliga carregamento do botao.
            setSalvando(false);
        }
    }

    // Abre o modal de confirmacao.
    function abrirConfirmacaoExclusao(marca) {
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao({
            aberta: true,
            marca
        });
    }

    // Fecha o modal de confirmacao.
    function fecharConfirmacao() {
        // Atualiza o estado por meio de setConfirmacao.
        setConfirmacao({
            aberta: false,
            marca: null
        });
    }

    // Solicita a exclusao; a API deve impedir se houver veiculos vinculados.
    async function excluirMarca() {
        // Pega a marca que esta no modal.
        const marca = confirmacao.marca;

        // Sem marca nao tem o que excluir.
        if (!marca) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Limpa mensagem antiga.
        setMensagem(null);
        // Fecha o modal antes de chamar a API.
        fecharConfirmacao();

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Chama a rota DELETE da API.
            const resposta = await fetch(`${API}/deletar_marca/${idMarca(marca)}`, {
                method: "DELETE",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Le a resposta.
            const dados = await lerResposta(resposta);

            // Mostra erro se a API bloquear por veiculo vinculado.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Não foi possível excluir a marca."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Remove a marca da lista da tela.
            setMarcas((listaAtual) => listaAtual.filter((item) => idMarca(item) !== idMarca(marca)));
            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Marca excluida com sucesso."
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor."
            });
        }
    }

    // Renderiza a pagina.
    return (
        // Container principal.
        <main className={css.container}>
            {/* Cabecalho da pagina. */}
            <header className={css.cabecalho}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div>
                    {/* Exibe o título principal desta página. */}
                    <h1>Marcas</h1>
                    {/* Exibe esta mensagem ou informação. */}
                    <p>Cadastre, edite e remova as marcas usadas nos veículos.</p>
                </div>
            </header>

            {/* Mensagem de sucesso ou erro. */}
            {mensagem && (
                <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
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

            {/* Painel do formulario de marca. */}
            <section className={css.painel}>
                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formulario} onSubmit={salvarMarca}>
                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                    <label>
                        Nome da marca
                        {/* Exibe este campo de entrada de dados. */}
                        <input
                            type="text"
                            value={nomeMarca}
                            onChange={(e) => setNomeMarca(e.target.value)}
                            placeholder="Ex: Toyota"
                            maxLength="80"
                            required
                        />
                    </label>

                    {/* Botoes do formulario. */}
                    <div className={css.botoes_form}>
                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                        {marcaEditando && (
                            <button type="button" className={css.cancelar} onClick={limparFormulario}>
                                Cancelar
                            </button>
                        )}
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.salvar} disabled={salvando}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {salvando ? "Salvando..." : marcaEditando ? "Salvar edição" : "Cadastrar marca"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Area da lista de marcas. */}
            <section className={css.lista_area}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.lista_topo}>
                    {/* Exibe o título desta seção. */}
                    <h2>Marcas cadastradas</h2>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.busca}>
                        {/* Exibe esta imagem na interface. */}
                        <img src="/IconBusca.png" alt="Buscar" />
                        {/* Exibe este campo de entrada de dados. */}
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => {
                                // Atualiza o estado por meio de setBusca.
                                setBusca(e.target.value);
                                // Atualiza o estado por meio de setPaginaAtual.
                                setPaginaAtual(1);
                            }}
                            placeholder="Buscar marca"
                        />
                    </div>
                </div>

                {/* Estado de carregamento. */}
                {carregando && <div className={css.estado}>Carregando marcas...</div>}

                {/* Estado vazio. */}
                {!carregando && marcasFiltradas.length === 0 && (
                    <div className={css.estado}>Nenhuma marca encontrada</div>
                )}

                {/* Lista de marcas filtradas. */}
                {!carregando && marcasFiltradas.length > 0 && (
                    <>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.tabela}>
                            {/* Percorre os dados para renderizar os itens desta área. */}
                            {marcasPaginadas.map((marca) => (
                                <article key={idMarca(marca)} className={css.linha}>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Marca</span>
                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                        <strong>{textoMarca(marca)}</strong>
                                    </div>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.acoes}>
                                        {/* Exibe este botão de ação. */}
                                        <button type="button" className={css.editar} onClick={() => editarMarca(marca)}>
                                            Editar
                                        </button>
                                        {/* Exibe este botão de ação. */}
                                        <button type="button" className={css.excluir} onClick={() => abrirConfirmacaoExclusao(marca)}>
                                            Excluir
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.paginacao_area}>
                            {/* Renderiza o componente Paginacao nesta parte da página. */}
                            <Paginacao
                                paginaAtual={paginaAtual}
                                totalItens={marcasFiltradas.length}
                                onMudarPagina={setPaginaAtual}
                            />
                        </div>
                    </>
                )}
            </section>

            {/* Modal de confirmacao de exclusao. */}
            {confirmacao.aberta && (
                <div className={css.alert_overlay}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.alert_box} role="dialog" aria-modal="true" aria-labelledby="titulo-alerta-marca">
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.alert_icone}>!</div>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.alert_conteudo}>
                            {/* Renderiza o elemento h3 nesta parte da página. */}
                            <h3 id="titulo-alerta-marca">Excluir marca?</h3>
                            {/* Exibe esta mensagem ou informação. */}
                            <p>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                Deseja excluir a marca <strong>{textoMarca(confirmacao.marca)}</strong>? Essa ação não pode ser desfeita.
                            </p>
                        </div>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.alert_botoes}>
                            {/* Exibe este botão de ação. */}
                            <button type="button" className={css.alert_cancelar} onClick={fecharConfirmacao}>
                                Cancelar
                            </button>
                            {/* Exibe este botão de ação. */}
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

// Exporta a tela para as rotas.
export default DashboardAdmMarcas;
