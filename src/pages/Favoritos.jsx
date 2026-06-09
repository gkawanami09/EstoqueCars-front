// Importa os hooks do React usados para estado, efeitos, memorização e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar para outra rota.
import { useNavigate } from "react-router-dom";
// Importa o modal de confirmação usado antes de limpar todos os favoritos.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";
// Importa as classes CSS module desta página.
import css from "./Favoritos.module.css";

// Monta o cabeçalho de autorização para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token de acesso salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se existir token, envia como Bearer; se não existir, retorna objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Descobre o ID do carro aceitando diferentes nomes possíveis vindos da API.
function idCarro(carro) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO;
}

// Monta o nome do carro para exibir no card.
function nomeCarro(carro) {
    // Usa o nome direto, junta marca e modelo, ou mostra um texto padrão.
    return carro?.nome || [carro?.marca, carro?.modelo].filter(Boolean).join(" ") || "Veículo";
}

// Formata um valor numérico como moeda brasileira.
function formatarMoeda(valor) {
    // Converte o valor para número e aplica o formato BRL.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Busca na API todos os carros favoritos do usuário.
async function listarFavoritos(API) {
    // Faz a requisição GET para a rota de favoritos.
    const resposta = await fetch(`${API}/listar_favoritos`, {
        // Define o método HTTP usado para listar dados.
        method: "GET",
        // Envia o token de autorização quando existir.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessão, caso a API também use cookies.
        credentials: "include"
    });
    // Tenta converter a resposta para JSON; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a API respondeu com erro, dispara uma exceção com mensagem amigável.
    if (!resposta.ok) {
        // Interrompe o fluxo informando o erro encontrado.
        throw new Error(dados.erro || dados.mensagem || "Não foi possível carregar seus favoritos.");
    }

    // Retorna a lista quando vier como array direto ou dentro da propriedade favoritos.
    return Array.isArray(dados) ? dados : dados.favoritos || [];
}

// Alterna o favorito de um veículo na API.
async function alternarFavorito(API, idVeiculo) {
    // Chama a rota que adiciona ou remove favorito para o ID informado.
    const resposta = await fetch(`${API}/favoritar_carro/${idVeiculo}`, {
        // Usa POST porque altera o estado do favorito.
        method: "POST",
        // Envia o token de autorização.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessão quando existirem.
        credentials: "include"
    });
    // Tenta ler o corpo da resposta como JSON.
    const dados = await resposta.json().catch(() => ({}));

    // Se não foi sucesso, mostra mensagem da API ou uma mensagem padrão.
    if (!resposta.ok) {
        // Interrompe o fluxo informando o erro encontrado.
        throw new Error(dados.erro || dados.mensagem || "Não foi possível atualizar este favorito.");
    }
}

// Remove todos os favoritos do usuário pela API.
async function limparFavoritosApi(API) {
    // Chama a rota responsável por limpar a lista de favoritos.
    const resposta = await fetch(`${API}/limpar_favoritos`, {
        // Usa DELETE porque a ação remove dados da lista.
        method: "DELETE",
        // Envia o token de autorização.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessão quando existirem.
        credentials: "include"
    });
    // Tenta converter a resposta para JSON; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a API retornou erro, dispara exceção com mensagem adequada.
    if (!resposta.ok) {
        // Interrompe o fluxo informando o erro encontrado.
        throw new Error(dados.erro || dados.mensagem || "Não foi possível limpar seus favoritos.");
    }
}

// Componente principal da página de favoritos.
function Favoritos({ API }) {
    // Cria a função para navegar entre rotas.
    const navigate = useNavigate();
    // Guarda a lista de carros favoritos.
    const [favoritos, setFavoritos] = useState([]);
    // Guarda o texto digitado na busca.
    const [busca, setBusca] = useState("");
    // Controla se a lista ainda está carregando.
    const [carregando, setCarregando] = useState(true);
    // Guarda a mensagem de erro exibida na tela.
    const [erro, setErro] = useState("");
    // Guarda o ID do favorito em remoção para bloquear cliques repetidos.
    const [removendoId, setRemovendoId] = useState("");
    // Controla se o modal de confirmação para limpar tudo está aberto.
    const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
    // Controla o carregamento da ação de limpar todos os favoritos.
    const [limpandoFavoritos, setLimpandoFavoritos] = useState(false);

    // Monta a URL da imagem do carro.
    function imagemCarro(carro) {
        // Busca a imagem em campos diferentes que podem vir da API.
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        // Se não houver imagem, retorna o ícone padrão.
        if (!imagem) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "/IconCar.png";
        }

        // Se a imagem já for uma URL completa, usa como veio.
        if (String(imagem).startsWith("http")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return imagem;
        }

        // Se o caminho começa com barra, junta direto com a URL base da API.
        if (String(imagem).startsWith("/")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return `${API}${imagem}`;
        }

        // Se for caminho relativo, adiciona uma barra entre API e imagem.
        return `${API}/${imagem}`;
    }

    // Carrega a lista de favoritos da API.
    const carregarFavoritos = useCallback(async () => {
        // Ativa o estado de carregamento.
        setCarregando(true);
        // Limpa erros antigos antes da nova requisição.
        setErro("");

        // Tenta buscar os favoritos.
        try {
            // Recebe a lista retornada pela API.
            const lista = await listarFavoritos(API);
            // Marca cada item como favorito no estado local.
            setFavoritos(lista.map((carro) => ({ ...carro, favorito: true })));
        } catch (erroAtual) {
            // Limpa a lista se a requisição falhar.
            setFavoritos([]);
            // Mostra a mensagem de erro retornada ou uma mensagem padrão.
            setErro(erroAtual.message || "Não foi possível carregar seus favoritos.");
        } finally {
            // Desliga o carregamento ao terminar.
            setCarregando(false);
        }
    }, [API]);

    // Carrega os favoritos quando a tela abre.
    useEffect(() => {
        // Executa carregarFavoritos nesta etapa do fluxo.
        carregarFavoritos();
    }, [carregarFavoritos]);

    // Filtra favoritos por marca ou modelo conforme a busca.
    const favoritosFiltrados = useMemo(() => {
        // Normaliza o termo digitado.
        const termo = busca.trim().toLowerCase();

        // Se não houver termo, retorna todos os favoritos.
        if (!termo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return favoritos;
        }

        // Filtra a lista procurando o termo em marca ou modelo.
        return favoritos.filter((carro) => {
            // Lê a marca aceitando campo minúsculo ou maiúsculo.
            const marca = String(carro?.marca || carro?.MARCA || "").toLowerCase();
            // Lê o modelo aceitando campo minúsculo ou maiúsculo.
            const modelo = String(carro?.modelo || carro?.MODELO || "").toLowerCase();
            // Mantém o carro se marca ou modelo contém o termo buscado.
            return marca.includes(termo) || modelo.includes(termo);
        });
    }, [busca, favoritos]);

    // Remove um carro específico da lista de favoritos.
    async function removerFavorito(carro) {
        // Descobre o ID do carro clicado.
        const id = idCarro(carro);

        // Se não houver ID ou já houver remoção em andamento, não faz nada.
        if (!id || removendoId) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Marca este ID como em remoção.
        setRemovendoId(String(id));
        // Limpa erros antigos.
        setErro("");

        // Tenta remover o favorito na API.
        try {
            // Alterna o favorito, removendo da lista do usuário.
            await alternarFavorito(API, id);
            // Remove o item do estado local sem precisar recarregar tudo.
            setFavoritos((listaAtual) => listaAtual.filter((item) => String(idCarro(item)) !== String(id)));
        } catch (erroAtual) {
            // Mostra mensagem de erro caso a remoção falhe.
            setErro(erroAtual.message || "Não foi possível remover este favorito.");
        } finally {
            // Libera os botões de remoção.
            setRemovendoId("");
        }
    }

    // Limpa todos os favoritos do usuário.
    async function limparFavoritos() {
        // Impede ação duplicada ou limpeza de uma lista vazia.
        if (limpandoFavoritos || favoritos.length === 0) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Ativa o carregamento da limpeza.
        setLimpandoFavoritos(true);
        // Limpa erros anteriores.
        setErro("");

        // Tenta limpar a lista na API.
        try {
            // Envia a requisição para remover todos os favoritos.
            await limparFavoritosApi(API);
            // Esvazia a lista local.
            setFavoritos([]);
            // Fecha o modal de confirmação.
            setConfirmarLimpeza(false);
        } catch (erroAtual) {
            // Mostra mensagem de erro se a limpeza falhar.
            setErro(erroAtual.message || "Não foi possível limpar seus favoritos.");
        } finally {
            // Desliga o carregamento da limpeza.
            setLimpandoFavoritos(false);
        }
    }

    // Renderiza a tela de favoritos.
    return (
        // Container principal da página.
        <main className={css.pagina}>
            {/* Cabeçalho com título e ações principais. */}
            <header className={css.cabecalho}>
                {/* Área de texto do cabeçalho. */}
                <div>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Área do cliente</span>
                    {/* Exibe o título principal desta página. */}
                    <h1>Favoritos</h1>
                </div>
                {/* Botão para limpar todos os favoritos. */}
                <div className={css.acoes_cabecalho}>
                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        className={css.limpar_favoritos}
                        onClick={() => setConfirmarLimpeza(true)}
                        disabled={carregando || limpandoFavoritos || favoritos.length === 0}
                    >
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {limpandoFavoritos ? "Limpando..." : "Limpar favoritos"}
                    </button>
                </div>
            </header>

            {/* Campo de busca dos favoritos. */}
            <div className={css.area_busca}>
                {/* Exibe esta imagem na interface. */}
                <img src="/IconBusca.png" alt="Buscar" className={css.icone_busca} />
                {/* Exibe este campo de entrada de dados. */}
                <input
                    type="text"
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar favorito por marca ou modelo"
                />
            </div>

            {/* Mostra mensagem de erro quando houver erro. */}
            {erro && <p className={css.mensagem_erro}>{erro}</p>}

            {/* Mostra carregamento enquanto busca favoritos. */}
            {carregando && <div className={css.estado}>Carregando favoritos...</div>}

            {/* Mostra mensagem quando não existe nenhum favorito salvo. */}
            {!carregando && !erro && favoritos.length === 0 && (
                <div className={css.estado}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>Nenhum favorito encontrado.</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Quando você favoritar um veículo, ele aparecerá aqui.</span>
                </div>
            )}

            {/* Mostra mensagem quando a busca não encontra favoritos. */}
            {!carregando && !erro && favoritos.length > 0 && favoritosFiltrados.length === 0 && (
                <div className={css.estado}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>Nenhum favorito encontrado para esta busca.</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Tente pesquisar por outra marca ou modelo.</span>
                </div>
            )}

            {/* Renderiza a lista quando existem favoritos filtrados. */}
            {!carregando && !erro && favoritosFiltrados.length > 0 && (
                <section className={css.lista}>
                    {/* Cria um card para cada favorito filtrado. */}
                    {favoritosFiltrados.map((carro) => {
                        // Guarda o ID para usar na key, nos botões e na navegação.
                        const id = idCarro(carro);

                        // Retorna o card visual do carro.
                        return (
                            <article key={id || nomeCarro(carro)} className={css.card}>
                                {/* Área da imagem do carro. */}
                                <div className={css.imagem_area}>
                                    {/* Exibe esta imagem na interface. */}
                                    <img
                                        src={imagemCarro(carro)}
                                        alt={nomeCarro(carro)}
                                        onError={(evento) => {
                                            // Executa esta etapa do fluxo.
                                            evento.currentTarget.src = "/IconCar.png";
                                        }}
                                    />
                                </div>

                                {/* Área com as informações do favorito. */}
                                <div className={css.info}>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Favorito</span>
                                    {/* Exibe o título desta seção. */}
                                    <h2>{nomeCarro(carro)}</h2>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.grade}>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Marca:</strong> {carro.marca || carro.MARCA || "-"}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Modelo:</strong> {carro.modelo || carro.MODELO || "-"}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Ano:</strong> {carro.ano_fabricacao || carro.ANO_FABRICACAO || "-"} / {carro.ano_modelo || carro.ANO_MODELO || "-"}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Preço:</strong> {formatarMoeda(carro.preco ?? carro.PRECO)}</p>
                                    </div>
                                </div>

                                {/* Área de ações do card. */}
                                <div className={css.acoes}>
                                    {/* Botão de detalhes aparece somente se houver ID. */}
                                    {id && (
                                        <button type="button" onClick={() => navigate(`/detalhesVeiculos/${id}`)}>
                                            Ver detalhes
                                        </button>
                                    )}
                                    {/* Exibe este botão de ação. */}
                                    <button
                                        type="button"
                                        className={css.remover}
                                        onClick={() => removerFavorito(carro)}
                                        disabled={!id || removendoId === String(id)}
                                    >
                                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                        {removendoId === String(id) ? "Removendo..." : "Remover"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {/* Modal que confirma a remoção de todos os favoritos. */}
            <ModalConfirmacao
                aberto={confirmarLimpeza}
                titulo="Limpar favoritos"
                texto="Deseja remover todos os veículos da sua lista de favoritos?"
                destaque={`${favoritos.length} favorito${favoritos.length === 1 ? "" : "s"}`}
                textoConfirmar="Limpar favoritos"
                carregando={limpandoFavoritos}
                onCancelar={() => setConfirmarLimpeza(false)}
                onConfirmar={limparFavoritos}
            />
        </main>
    );
}

// Exporta a página para ser usada nas rotas da aplicação.
export default Favoritos;
