// Importa os hooks do React usados para estado, efeitos, memoizacao e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegacao para trocar de rota pelo JavaScript.
import { useNavigate } from "react-router-dom";
// Importa as classes CSS module usadas apenas neste componente.
import css from "./Dashboard.module.css";
// Importa o componente de paginacao e a quantidade fixa de itens por pagina.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Monta o cabecalho de autorizacao para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador depois do login.
    const token = localStorage.getItem("access_token");
    // Se existir token, retorna Authorization Bearer; senao, retorna um objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Verifica se o usuario logado pode usar a funcao de favoritar carros.
function usuarioPodeFavoritar() {
    // Busca os dados do usuario salvo, aceitando tambem uma chave antiga com acento quebrado.
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuÃ¡rio_logado");

    // Se nao existe usuario salvo, ele nao pode favoritar.
    if (!usuarioSalvo) {
        return false;
    }

    // Tenta converter o texto salvo no localStorage para objeto JavaScript.
    try {
        // Transforma o JSON do usuario em objeto.
        const usuario = JSON.parse(usuarioSalvo);
        // Le o tipo do usuario, aceitando duas formas de nome do campo.
        const tipoUsuario = Number(usuario.tipo_usuario ?? usuario["tipo_usuÃ¡rio"]);
        // Permite favoritar apenas para os tipos 0, 1 e 2.
        return [0, 1, 2].includes(tipoUsuario);
    } catch {
        // Se o JSON estiver invalido, por seguranca nao permite favoritar.
        return false;
    }
}

// Descobre se um carro ja esta marcado como favorito.
function carroEstaFavoritado(carro) {
    // Procura o valor de favorito em varios nomes possiveis vindos da API.
    const valor = carro?.favorito ?? carro?.FAVORITO ?? carro?.favoritado ?? carro?.FAVORITADO ?? carro?.is_favorito ?? carro?.IS_FAVORITO ?? carro?.id_favorito ?? carro?.ID_FAVORITO;
    // Considera favorito se vier como booleano true, numero 1 ou texto "true".
    return valor === true || valor === 1 || String(valor).toLowerCase() === "true";
}

// Envia para a API a solicitacao de adicionar ou remover um carro dos favoritos.
async function alternarFavorito(API, idVeiculo) {
    // Chama a rota de favorito usando o id do veiculo.
    const resposta = await fetch(`${API}/favoritar_carro/${idVeiculo}`, {
        // Usa POST porque a API altera o estado do favorito.
        method: "POST",
        // Envia o token de autenticacao quando ele existir.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessao, caso a API use cookies tambem.
        credentials: "include"
    });
    // Tenta ler o JSON de resposta; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a resposta nao foi sucesso, mostra a mensagem da API ou uma mensagem padrao.
    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "NÃ£o foi possÃ­vel atualizar este favorito.");
    }
}

// Lista de categorias exibidas nos botoes de filtro.
const categorias = ["Sedan", "ElÃ©trico", "Esportivo", "Caminhonete", "SUV"];

// Componente principal da tela de dashboard.
function Dashboard({ API }) {
    // Cria a funcao usada para navegar para outras telas.
    const navigate = useNavigate();
    // Guarda a lista de carros recebida da API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Guarda a categoria selecionada no filtro.
    const [categoria, setCategoria] = useState("");
    // Guarda a pagina atual da lista.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Controla o estado de carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda mensagens de erro para exibir na tela.
    const [erro, setErro] = useState("");
    // Guarda o id do carro que esta sendo favoritado para evitar cliques duplicados.
    const [favoritandoId, setFavoritandoId] = useState("");
    // Define se o botao de favorito deve aparecer para o usuario atual.
    const mostrarFavorito = usuarioPodeFavoritar();

    // Cria um objeto vazio para receber os dados do usuario logado.
    let usuario = {};

    // Tenta carregar o usuario salvo no navegador.
    try {
        // Converte o JSON salvo no localStorage para objeto.
        usuario = JSON.parse(localStorage.getItem("usuario_logado") || localStorage.getItem("usuario_logado")) || {};
    } catch {
        // Se houver erro no JSON, mantem o usuario como objeto vazio.
        usuario = {};
    }

    // Define o nome mostrado no cabecalho, usando "Usuario" como fallback.
    const nomeUsuario = usuario.nome || "Usuario";

    // Le o status de estoque do carro aceitando diferentes nomes de campo da API.
    function statusEstoqueCarro(carro) {
        return carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.statusEstoque ?? carro?.status ?? "";
    }

    // Converte o status vindo da API para um dos tipos usados na interface.
    function tipoStatusEstoque(carro) {
        // Normaliza o status para texto minusculo sem espacos nas pontas.
        const status = String(statusEstoqueCarro(carro) || "").trim().toLowerCase();

        // Identifica carros em estoque por codigo ou texto.
        if (status === "1" || status.includes("estoque") || (status.includes("dispon") && !status.includes("indispon"))) {
            return "estoque";
        }

        // Identifica carros vendidos por codigo ou texto.
        if (status === "2" || status.includes("vend")) {
            return "vendido";
        }

        // Identifica carros indisponiveis por codigo ou texto.
        if (status === "3" || status.includes("indispon")) {
            return "indisponivel";
        }

        // Quando nao reconhece o status, trata como indisponivel.
        return "indisponivel";
    }

    // Retorna o texto amigavel do status para aparecer no card.
    function textoStatusEstoque(carro) {
        // Reaproveita a funcao que normaliza o status.
        const status = tipoStatusEstoque(carro);

        // Texto exibido para veiculo vendido.
        if (status === "vendido") {
            return "Vendido";
        }

        // Texto exibido para veiculo indisponivel.
        if (status === "indisponivel") {
            return "Indisponivel";
        }

        // Texto exibido para veiculo em estoque.
        return "Em estoque";
    }

    // Escolhe a classe CSS correta de acordo com o status do estoque.
    function classeStatusEstoque(carro) {
        // Normaliza o status antes de escolher a classe.
        const status = tipoStatusEstoque(carro);
        // Retorna a classe visual correspondente ao status.
        return status === "estoque" ? css.status_estoque : status === "vendido" ? css.status_vendido : css.status_indisponivel;
    }

    // Busca os carros na API; useCallback evita recriar a funcao sem necessidade.
    const carregarCarros = useCallback(async () => {
        // Liga o estado de carregamento.
        setCarregando(true);
        // Limpa erros anteriores antes de uma nova busca.
        setErro("");

        // Tenta fazer a requisicao para a API.
        try {
            // Cria os parametros de query string.
            const params = new URLSearchParams();

            // Se uma categoria foi escolhida, adiciona ela na URL.
            if (categoria) {
                params.append("categoria", categoria);
            }

            // Faz a chamada GET para listar carros.
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                // Define o metodo HTTP da requisicao.
                method: "GET",
                // Envia o cabecalho de autorizacao.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies de sessao quando existirem.
                credentials: "include"
            });
            // Converte a resposta da API em JSON.
            const dados = await resposta.json();

            // Trata respostas de erro da API.
            if (!resposta.ok) {
                // Mostra a mensagem de erro retornada ou uma mensagem padrao.
                setErro(dados.erro || "Erro ao carregar veiculos.");
                // Limpa a lista para nao exibir dados antigos.
                setCarros([]);
                // Para a execucao da funcao.
                return;
            }

            // Salva os carros retornados; se nao vier lista, usa lista vazia.
            setCarros(dados.carros || []);
        } catch {
            // Mostra erro quando a API nao responde ou ocorre falha de rede.
            setErro("Erro de conexao com o servidor.");
            // Limpa a lista em caso de falha.
            setCarros([]);
        } finally {
            // Desliga o carregamento ao final, com sucesso ou erro.
            setCarregando(false);
        }
    }, [API, categoria]);

    // Executa a busca de carros quando o componente abre ou quando a funcao muda.
    useEffect(() => {
        carregarCarros();
    }, [carregarCarros]);

    // Mantem na vitrine apenas os carros que estao em estoque.
    const carrosDisponiveis = carros.filter((carro) => tipoStatusEstoque(carro) === "estoque");
    // Normaliza o texto digitado para facilitar a busca.
    const termoBusca = busca.trim().toLowerCase();

    // Filtra os carros disponiveis pelo termo de busca, quando houver busca.
    const carrosFiltrados = termoBusca
        // Se existe busca, verifica varios campos do carro.
        ? carrosDisponiveis.filter((carro) => {
            // Campos pesquisaveis no card do carro.
            const campos = [
                carro.nome,
                carro.modelo,
                carro.marca,
                carro.placa,
                carro.cor,
                carro.ano_fabricacao,
                carro.ano_modelo,
                `${carro.ano_fabricacao || ""}/${carro.ano_modelo || ""}`,
                carro.categoria,
                carro.nome_categoria,
                carro.quilometragem
            ];

            // Retorna true se qualquer campo contem o termo buscado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termoBusca));
        })
        // Se nao existe busca, usa todos os carros disponiveis.
        : carrosDisponiveis;

    // Calcula o total de paginas, garantindo no minimo 1 pagina.
    const totalPaginas = Math.max(1, Math.ceil(carrosFiltrados.length / ITENS_POR_PAGINA));

    // Volta para a primeira pagina quando a busca ou categoria mudam.
    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, categoria]);

    // Corrige a pagina atual caso ela fique maior que o total de paginas.
    useEffect(() => {
        // Se a pagina atual passou do limite, volta para a ultima pagina disponivel.
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Calcula apenas os carros que devem aparecer na pagina atual.
    const carrosPaginados = useMemo(() => {
        // Descobre o indice inicial da pagina atual.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Recorta a lista filtrada usando o limite de itens por pagina.
        return carrosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [carrosFiltrados, paginaAtual]);

    // Define a mensagem que aparece quando nao ha carros para mostrar.
    const mensagemListaVazia = carros.length === 0
        // Caso nao exista nenhum veiculo cadastrado.
        ? {
            titulo: "Nenhum veiculo cadastrado no momento.",
            texto: "Assim que novos veiculos forem adicionados, eles aparecerao aqui."
        }
        // Caso existam veiculos, mas nenhum esteja disponivel em estoque.
        : carrosDisponiveis.length === 0
            ? {
                titulo: "Nenhum veiculo disponivel em estoque.",
                texto: "Os veiculos vendidos ou indisponiveis ficam escondidos da vitrine do cliente."
            }
            // Caso existam veiculos disponiveis, mas nenhum combine com o filtro/busca.
            : {
                titulo: "Nenhum veiculo disponivel encontrado.",
                texto: "Tente buscar por outra marca, modelo, cor, categoria ou ano."
            };

    // Formata o preco para moeda brasileira.
    function formatarPreco(valor) {
        // Converte o valor para numero e aplica formato BRL.
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Converte o valor do cambio para um texto amigavel.
    function formatarCambio(valor) {
        // Normaliza o cambio para comparacao.
        const cambio = String(valor || "").toLowerCase();

        // Retorna Automatico quando vier codigo 1 ou texto contendo "auto".
        if (cambio === "1" || cambio.includes("auto")) {
            return "Automatico";
        }

        // Retorna Manual quando vier codigo 2 ou texto contendo "manual".
        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        // Se nao reconhecer, mostra o valor original ou um hifen.
        return valor || "-";
    }

    // Descobre o id do carro aceitando varios nomes possiveis vindos da API.
    function idCarro(carro) {
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
    }

    // Alterna o favorito de um carro clicado.
    async function favoritarCarro(carro) {
        // Pega o id do carro usando a funcao auxiliar.
        const id = idCarro(carro);

        // Se nao houver id ou ja houver favoritando em andamento, nao faz nada.
        if (!id || favoritandoId) {
            return;
        }

        // Marca este carro como em processamento.
        setFavoritandoId(String(id));
        // Limpa qualquer erro anterior.
        setErro("");

        // Tenta atualizar o favorito na API.
        try {
            // Envia a requisicao de favoritar/desfavoritar.
            await alternarFavorito(API, id);
            // Atualiza a lista local sem precisar recarregar toda a tela.
            setCarros((listaAtual) => listaAtual.map((item) => (
                // Se for o carro clicado, inverte o valor de favorito.
                String(idCarro(item)) === String(id) ? { ...item, favorito: !carroEstaFavoritado(item) } : item
            )));
        } catch (erroAtual) {
            // Mostra o erro retornado ou uma mensagem padrao.
            setErro(erroAtual.message || "NÃ£o foi possÃ­vel atualizar este favorito.");
        } finally {
            // Libera o botao de favorito depois da tentativa.
            setFavoritandoId("");
        }
    }

    // Monta a URL da imagem do carro.
    function imagemCarro(carro) {
        // Busca a imagem em diferentes campos possiveis.
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        // Se nao tiver imagem, usa o icone padrao.
        if (!imagem) {
            return "/IconCar.png";
        }

        // Se ja for URL completa, usa do jeito que veio.
        if (String(imagem).startsWith("http")) {
            return imagem;
        }

        // Se vier com barra inicial, junta com a base da API.
        if (String(imagem).startsWith("/")) {
            return `${API}${imagem}`;
        }

        // Se vier caminho relativo, adiciona a barra entre API e imagem.
        return `${API}/${imagem}`;
    }

    // Renderiza o HTML/JSX da tela.
    return (
        // Container geral da pagina de dashboard.
        <div className={css.layout_dashboard}>
            {/* Conteudo principal da tela. */}
            <main className={css.conteudo_principal}>
                {/* Cabecalho com saudacao e area do usuario. */}
                <header className={css.cabecalho}>
                    {/* Titulo de boas-vindas com o nome do usuario. */}
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>{nomeUsuario}</span>
                    </h1>
                    {/* Area visual do usuario no canto do cabecalho. */}
                    <div className={css.area_usuario}>
                        {/* Avatar/icone de perfil estilizado pelo CSS. */}
                        <div className={css.perfil_usuario} />
                    </div>
                </header>

                {/* Campo de busca dos veiculos. */}
                <div className={css.area_busca}>
                    {/* Icone da lupa da busca. */}
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    {/* Input controlado pelo estado busca. */}
                    <input
                        type="text"
                        placeholder="Buscar por marca, modelo, cor, categoria ou ano"
                        className={css.input_busca}
                        value={busca}
                        onChange={(evento) => setBusca(evento.target.value)}
                    />
                </div>

                {/* Botoes de filtro por categoria. */}
                <section className={css.secao_filtros}>
                    {/* Botao que remove o filtro de categoria. */}
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>
                    {/* Cria um botao para cada categoria cadastrada no array. */}
                    {categorias.map((nomeCategoria) => (
                        <button
                            key={nomeCategoria}
                            type="button"
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            onClick={() => setCategoria(nomeCategoria)}
                        >
                            {nomeCategoria}
                        </button>
                    ))}
                </section>

                {/* Exibe mensagem de erro quando existir erro. */}
                {erro && <p className={css.mensagem_erro}>{erro}</p>}

                {/* Lista de cards dos carros. */}
                <section className={css.lista_carros}>
                    {/* Mostra estado de carregamento enquanto busca os carros. */}
                    {carregando && <div className={css.estado_lista}>Carregando veiculos...</div>}

                    {/* Mostra mensagem vazia quando terminou de carregar e nao encontrou carros. */}
                    {!carregando && !erro && carrosFiltrados.length === 0 && (
                        <div className={css.estado_lista}>
                            <strong>{mensagemListaVazia.titulo}</strong>
                            <span>{mensagemListaVazia.texto}</span>
                        </div>
                    )}

                    {/* Renderiza um card para cada carro da pagina atual. */}
                    {!carregando && carrosPaginados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            {/* Area da imagem e do botao de favorito. */}
                            <div className={css.area_imagem_card}>
                                {/* Mostra o botao de favorito somente para usuarios permitidos. */}
                                {mostrarFavorito && (
                                    <button
                                        type="button"
                                        className={`${css.botao_favorito} ${carroEstaFavoritado(carro) ? css.favorito_ativo : ""}`}
                                        onClick={(evento) => {
                                            evento.stopPropagation();
                                            favoritarCarro(carro);
                                        }}
                                        disabled={favoritandoId === String(idCarro(carro))}
                                        aria-pressed={carroEstaFavoritado(carro)}
                                        aria-label={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                        title={carroEstaFavoritado(carro) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    >
                                        <span aria-hidden="true">{carroEstaFavoritado(carro) ? "â™¥" : "â™¡"}</span>
                                    </button>
                                )}
                                {/* Imagem principal do carro. */}
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veiculo"}
                                    onError={(evento) => {
                                        evento.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                            </div>

                            {/* Informacoes textuais do carro. */}
                            <div className={css.info_carro}>
                                {/* Titulo do carro e selo de status. */}
                                <div className={css.titulo_status}>
                                    <h2>{carro.modelo || carro.nome || "Veiculo"}</h2>
                                    <span className={`${css.status_veiculo} ${classeStatusEstoque(carro)}`}>
                                        {textoStatusEstoque(carro)}
                                    </span>
                                </div>
                                {/* Grade com dados principais do veiculo. */}
                                <div className={css.grade_info}>
                                    <p><strong>Marca:</strong> {carro.marca || "-"}</p>
                                    <p><strong>Ano:</strong> {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                                    <p><strong>Cambio:</strong> {formatarCambio(carro.cambio)}</p>
                                    <p><strong>Cor:</strong> {carro.cor || "-"}</p>
                                </div>
                            </div>

                            {/* Area com preco e botao de detalhes. */}
                            <div className={css.area_preco}>
                                <strong>{formatarPreco(carro.preco)}</strong>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/detalhesVeiculos/${idCarro(carro)}`)}
                                >
                                    Ver detalhes
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                {/* Mostra a paginacao somente quando ha carros filtrados para navegar. */}
                {!carregando && !erro && carrosFiltrados.length > 0 && (
                    <div className={css.paginacao_area}>
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={carrosFiltrados.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}

// Exporta o componente para ser usado nas rotas da aplicacao.
export default Dashboard;
