// Importa os hooks do React usados para estado, efeitos, memoizacao e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar para outra rota.
import { useNavigate } from "react-router-dom";
// Importa o modal de confirmacao usado antes de limpar todos os favoritos.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";
// Importa as classes CSS module desta pagina.
import css from "./Favoritos.module.css";

// Monta o cabecalho de autorizacao para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token de acesso salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se existir token, envia como Bearer; se nao existir, retorna objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Descobre o id do carro aceitando diferentes nomes possiveis vindos da API.
function idCarro(carro) {
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO;
}

// Monta o nome do carro para exibir no card.
function nomeCarro(carro) {
    // Usa o nome direto, ou junta marca e modelo, ou mostra um texto padrao.
    return carro?.nome || [carro?.marca, carro?.modelo].filter(Boolean).join(" ") || "VeÃ­culo";
}

// Formata um valor numerico como moeda brasileira.
function formatarMoeda(valor) {
    // Converte o valor para numero e aplica o formato BRL.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Busca na API todos os carros favoritados pelo usuario.
async function listarFavoritos(API) {
    // Faz a requisicao GET para a rota de favoritos.
    const resposta = await fetch(`${API}/listar_favoritos`, {
        // Define o metodo HTTP usado para listar dados.
        method: "GET",
        // Envia o token de autorizacao quando existir.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessao, caso a API tambem use cookies.
        credentials: "include"
    });
    // Tenta converter a resposta para JSON; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a API respondeu com erro, dispara uma excecao com mensagem amigavel.
    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "NÃ£o foi possÃ­vel carregar seus favoritos.");
    }

    // Retorna a lista quando vier como array direto ou dentro da propriedade favoritos.
    return Array.isArray(dados) ? dados : dados.favoritos || [];
}

// Alterna o favorito de um veiculo na API.
async function alternarFavorito(API, idVeiculo) {
    // Chama a rota que adiciona ou remove favorito para o id informado.
    const resposta = await fetch(`${API}/favoritar_carro/${idVeiculo}`, {
        // Usa POST porque altera o estado do favorito.
        method: "POST",
        // Envia o token de autorizacao.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessao quando existirem.
        credentials: "include"
    });
    // Tenta ler o corpo da resposta como JSON.
    const dados = await resposta.json().catch(() => ({}));

    // Se nao foi sucesso, mostra mensagem da API ou uma mensagem padrao.
    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "NÃ£o foi possÃ­vel atualizar este favorito.");
    }
}

// Remove todos os favoritos do usuario pela API.
async function limparFavoritosApi(API) {
    // Chama a rota responsavel por limpar a lista de favoritos.
    const resposta = await fetch(`${API}/limpar_favoritos`, {
        // Usa DELETE porque a acao remove dados da lista.
        method: "DELETE",
        // Envia o token de autorizacao.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessao quando existirem.
        credentials: "include"
    });
    // Tenta converter a resposta para JSON; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a API retornou erro, dispara excecao com mensagem adequada.
    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "NÃ£o foi possÃ­vel limpar seus favoritos.");
    }
}

// Componente principal da pagina de favoritos.
function Favoritos({ API }) {
    // Cria a funcao para navegar entre rotas.
    const navigate = useNavigate();
    // Guarda a lista de carros favoritos.
    const [favoritos, setFavoritos] = useState([]);
    // Guarda o texto digitado na busca.
    const [busca, setBusca] = useState("");
    // Controla se a lista ainda esta carregando.
    const [carregando, setCarregando] = useState(true);
    // Guarda a mensagem de erro exibida na tela.
    const [erro, setErro] = useState("");
    // Guarda o id do favorito em remocao para bloquear cliques repetidos.
    const [removendoId, setRemovendoId] = useState("");
    // Controla se o modal de confirmacao para limpar tudo esta aberto.
    const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
    // Controla o carregamento da acao de limpar todos os favoritos.
    const [limpandoFavoritos, setLimpandoFavoritos] = useState(false);

    // Monta a URL da imagem do carro.
    function imagemCarro(carro) {
        // Busca a imagem em campos diferentes que podem vir da API.
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        // Se nao houver imagem, retorna o icone padrao.
        if (!imagem) {
            return "/IconCar.png";
        }

        // Se a imagem ja for uma URL completa, usa como veio.
        if (String(imagem).startsWith("http")) {
            return imagem;
        }

        // Se o caminho comeca com barra, junta direto com a URL base da API.
        if (String(imagem).startsWith("/")) {
            return `${API}${imagem}`;
        }

        // Se for caminho relativo, adiciona uma barra entre API e imagem.
        return `${API}/${imagem}`;
    }

    // Carrega a lista de favoritos da API.
    const carregarFavoritos = useCallback(async () => {
        // Ativa o estado de carregamento.
        setCarregando(true);
        // Limpa erros antigos antes da nova requisicao.
        setErro("");

        // Tenta buscar os favoritos.
        try {
            // Recebe a lista retornada pela API.
            const lista = await listarFavoritos(API);
            // Marca cada item como favorito no estado local.
            setFavoritos(lista.map((carro) => ({ ...carro, favorito: true })));
        } catch (erroAtual) {
            // Limpa a lista se a requisicao falhar.
            setFavoritos([]);
            // Mostra a mensagem de erro retornada ou uma mensagem padrao.
            setErro(erroAtual.message || "NÃ£o foi possÃ­vel carregar seus favoritos.");
        } finally {
            // Desliga o carregamento ao terminar.
            setCarregando(false);
        }
    }, [API]);

    // Carrega os favoritos quando a tela abre.
    useEffect(() => {
        carregarFavoritos();
    }, [carregarFavoritos]);

    // Filtra favoritos por marca ou modelo conforme a busca.
    const favoritosFiltrados = useMemo(() => {
        // Normaliza o termo digitado.
        const termo = busca.trim().toLowerCase();

        // Se nao houver termo, retorna todos os favoritos.
        if (!termo) {
            return favoritos;
        }

        // Filtra a lista procurando o termo em marca ou modelo.
        return favoritos.filter((carro) => {
            // Le a marca aceitando campo minusculo ou maiusculo.
            const marca = String(carro?.marca || carro?.MARCA || "").toLowerCase();
            // Le o modelo aceitando campo minusculo ou maiusculo.
            const modelo = String(carro?.modelo || carro?.MODELO || "").toLowerCase();
            // Mantem o carro se marca ou modelo contem o termo buscado.
            return marca.includes(termo) || modelo.includes(termo);
        });
    }, [busca, favoritos]);

    // Remove um carro especifico da lista de favoritos.
    async function removerFavorito(carro) {
        // Descobre o id do carro clicado.
        const id = idCarro(carro);

        // Se nao houver id ou ja houver remocao em andamento, nao faz nada.
        if (!id || removendoId) {
            return;
        }

        // Marca este id como em remocao.
        setRemovendoId(String(id));
        // Limpa erros antigos.
        setErro("");

        // Tenta remover o favorito na API.
        try {
            // Alterna o favorito, removendo da lista do usuario.
            await alternarFavorito(API, id);
            // Remove o item do estado local sem precisar recarregar tudo.
            setFavoritos((listaAtual) => listaAtual.filter((item) => String(idCarro(item)) !== String(id)));
        } catch (erroAtual) {
            // Mostra mensagem de erro caso a remocao falhe.
            setErro(erroAtual.message || "NÃ£o foi possÃ­vel remover este favorito.");
        } finally {
            // Libera os botoes de remocao.
            setRemovendoId("");
        }
    }

    // Limpa todos os favoritos do usuario.
    async function limparFavoritos() {
        // Impede acao duplicada ou limpeza de uma lista vazia.
        if (limpandoFavoritos || favoritos.length === 0) {
            return;
        }

        // Ativa o carregamento da limpeza.
        setLimpandoFavoritos(true);
        // Limpa erros anteriores.
        setErro("");

        // Tenta limpar a lista na API.
        try {
            // Envia a requisicao para remover todos os favoritos.
            await limparFavoritosApi(API);
            // Esvazia a lista local.
            setFavoritos([]);
            // Fecha o modal de confirmacao.
            setConfirmarLimpeza(false);
        } catch (erroAtual) {
            // Mostra mensagem de erro se a limpeza falhar.
            setErro(erroAtual.message || "NÃ£o foi possÃ­vel limpar seus favoritos.");
        } finally {
            // Desliga o carregamento da limpeza.
            setLimpandoFavoritos(false);
        }
    }

    // Renderiza a tela de favoritos.
    return (
        // Container principal da pagina.
        <main className={css.pagina}>
            {/* Cabecalho com titulo e acoes principais. */}
            <header className={css.cabecalho}>
                {/* Area de texto do cabecalho. */}
                <div>
                    <span>Ãrea do cliente</span>
                    <h1>Favoritos</h1>
                </div>
                {/* Botoes de atualizar e limpar favoritos. */}
                <div className={css.acoes_cabecalho}>
                    <button type="button" onClick={carregarFavoritos} disabled={carregando || limpandoFavoritos}>
                        {carregando ? "Atualizando..." : "Atualizar"}
                    </button>
                    <button
                        type="button"
                        className={css.limpar_favoritos}
                        onClick={() => setConfirmarLimpeza(true)}
                        disabled={carregando || limpandoFavoritos || favoritos.length === 0}
                    >
                        {limpandoFavoritos ? "Limpando..." : "Limpar favoritos"}
                    </button>
                </div>
            </header>

            {/* Campo de busca dos favoritos. */}
            <div className={css.area_busca}>
                <img src="/IconBusca.png" alt="Buscar" className={css.icone_busca} />
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

            {/* Mostra mensagem quando nao existe nenhum favorito salvo. */}
            {!carregando && !erro && favoritos.length === 0 && (
                <div className={css.estado}>
                    <strong>Nenhum favorito encontrado.</strong>
                    <span>Quando vocÃª favoritar um veÃ­culo, ele aparecerÃ¡ aqui.</span>
                </div>
            )}

            {/* Mostra mensagem quando a busca nao encontra favoritos. */}
            {!carregando && !erro && favoritos.length > 0 && favoritosFiltrados.length === 0 && (
                <div className={css.estado}>
                    <strong>Nenhum favorito encontrado para essa busca.</strong>
                    <span>Tente pesquisar por outra marca ou modelo.</span>
                </div>
            )}

            {/* Renderiza a lista quando existem favoritos filtrados. */}
            {!carregando && !erro && favoritosFiltrados.length > 0 && (
                <section className={css.lista}>
                    {/* Cria um card para cada favorito filtrado. */}
                    {favoritosFiltrados.map((carro) => {
                        // Guarda o id para usar na key, nos botoes e na navegacao.
                        const id = idCarro(carro);

                        // Retorna o card visual do carro.
                        return (
                            <article key={id || nomeCarro(carro)} className={css.card}>
                                {/* Area da imagem do carro. */}
                                <div className={css.imagem_area}>
                                    <img
                                        src={imagemCarro(carro)}
                                        alt={nomeCarro(carro)}
                                        onError={(evento) => {
                                            evento.currentTarget.src = "/IconCar.png";
                                        }}
                                    />
                                </div>

                                {/* Area com as informacoes do favorito. */}
                                <div className={css.info}>
                                    <span>Favorito</span>
                                    <h2>{nomeCarro(carro)}</h2>
                                    <div className={css.grade}>
                                        <p><strong>Marca:</strong> {carro.marca || carro.MARCA || "-"}</p>
                                        <p><strong>Modelo:</strong> {carro.modelo || carro.MODELO || "-"}</p>
                                        <p><strong>Ano:</strong> {carro.ano_fabricacao || carro.ANO_FABRICACAO || "-"} / {carro.ano_modelo || carro.ANO_MODELO || "-"}</p>
                                        <p><strong>PreÃ§o:</strong> {formatarMoeda(carro.preco ?? carro.PRECO)}</p>
                                    </div>
                                </div>

                                {/* Area de acoes do card. */}
                                <div className={css.acoes}>
                                    {/* Botao de detalhes aparece somente se houver id. */}
                                    {id && (
                                        <button type="button" onClick={() => navigate(`/detalhesVeiculos/${id}`)}>
                                            Ver detalhes
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={css.remover}
                                        onClick={() => removerFavorito(carro)}
                                        disabled={!id || removendoId === String(id)}
                                    >
                                        {removendoId === String(id) ? "Removendo..." : "Remover"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {/* Modal que confirma a remocao de todos os favoritos. */}
            <ModalConfirmacao
                aberto={confirmarLimpeza}
                titulo="Limpar favoritos"
                texto="Deseja remover todos os veÃ­culos da sua lista de favoritos?"
                destaque={`${favoritos.length} favorito${favoritos.length === 1 ? "" : "s"}`}
                textoConfirmar="Limpar favoritos"
                carregando={limpandoFavoritos}
                onCancelar={() => setConfirmarLimpeza(false)}
                onConfirmar={limparFavoritos}
            />
        </main>
    );
}

// Exporta a pagina para ser usada nas rotas da aplicacao.
export default Favoritos;
