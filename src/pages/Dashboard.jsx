// Importa os hooks do React usados para estado, efeitos, memorização e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegação para trocar de rota pelo JavaScript.
import { useNavigate } from "react-router-dom";
// Importa as classes CSS module usadas apenas neste componente.
import css from "./Dashboard.module.css";
// Importa o componente de paginação e a quantidade fixa de itens por página.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Monta o cabeçalho de autorização para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador depois do login.
    const token = localStorage.getItem("access_token");
    // Se existir token, retorna Authorization Bearer; senão, retorna um objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Verifica se o usuário logado pode usar a função de favoritar carros.
function usuarioPodeFavoritar() {
    // Busca os dados do usuário salvo.
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado");

    // Se não existe usuário salvo, ele não pode favoritar.
    if (!usuarioSalvo) {
        return false;
    }

    // Tenta converter o texto salvo no localStorage para objeto JavaScript.
    try {
        // Transforma o JSON do usuário em objeto.
        const usuario = JSON.parse(usuarioSalvo);
        // Lê o tipo do usuário, aceitando duas formas de nome do campo.
        const tipoUsuario = Number(usuario.tipo_usuario ?? usuario["tipo_usuário"]);
        // Permite favoritar apenas para os tipos 0, 1 e 2.
        return [0, 1, 2].includes(tipoUsuario);
    } catch {
        // Se o JSON estiver inválido, por segurança não permite favoritar.
        return false;
    }
}

// Descobre se um carro já está marcado como favorito.
function carroEstaFavoritado(carro) {
    // Procura o valor de favorito em vários nomes possíveis vindos da API.
    const valor = carro?.favorito ?? carro?.FAVORITO ?? carro?.favoritado ?? carro?.FAVORITADO ?? carro?.is_favorito ?? carro?.IS_FAVORITO ?? carro?.id_favorito ?? carro?.ID_FAVORITO;
    // Considera favorito se vier como booleano true, número 1 ou texto "true".
    return valor === true || valor === 1 || String(valor).toLowerCase() === "true";
}

// Envia para a API a solicitação de adicionar ou remover um carro dos favoritos.
async function alternarFavorito(API, idVeiculo) {
    // Chama a rota de favorito usando o ID do veículo.
    const resposta = await fetch(`${API}/favoritar_carro/${idVeiculo}`, {
        // Usa POST porque a API altera o estado do favorito.
        method: "POST",
        // Envia o token de autenticação quando ele existir.
        headers: cabecalhoAutorizacao(),
        // Inclui cookies da sessão, caso a API use cookies também.
        credentials: "include"
    });
    // Tenta ler o JSON de resposta; se falhar, usa objeto vazio.
    const dados = await resposta.json().catch(() => ({}));

    // Se a resposta não foi sucesso, mostra a mensagem da API ou uma mensagem padrão.
    if (!resposta.ok) {
        throw new Error(dados.erro || dados.mensagem || "Não foi possível atualizar este favorito.");
    }
}

// Lista de categorias exibidas nos botões de filtro.
const categorias = ["Sedan", "Elétrico", "Esportivo", "Caminhonete", "SUV"];

// Componente principal da tela de dashboard.
function Dashboard({ API }) {
    // Cria a função usada para navegar para outras telas.
    const navigate = useNavigate();
    // Guarda a lista de carros recebida da API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Guarda a categoria selecionada no filtro.
    const [categoria, setCategoria] = useState("");
    // Guarda a página atual da lista.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Controla o estado de carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda mensagens de erro para exibir na tela.
    const [erro, setErro] = useState("");
    // Guarda o ID do carro que está sendo favoritado para evitar cliques duplicados.
    const [favoritandoId, setFavoritandoId] = useState("");
    // Define se o botão de favorito deve aparecer para o usuário atual.
    const mostrarFavorito = usuarioPodeFavoritar();

    // Cria um objeto vazio para receber os dados do usuário logado.
    let usuario = {};

    // Tenta carregar o usuário salvo no navegador.
    try {
        // Converte o JSON salvo no localStorage para objeto.
        usuario = JSON.parse(localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado")) || {};
    } catch {
        // Se houver erro no JSON, mantém o usuário como objeto vazio.
        usuario = {};
    }

    // Define o nome mostrado no cabeçalho, usando "Usuário" como fallback.
    const nomeUsuario = usuario.nome || "Usuário";

    // Lê o status de estoque do carro aceitando diferentes nomes de campo da API.
    function statusEstoqueCarro(carro) {
        return carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.statusEstoque ?? carro?.status ?? "";
    }

    // Converte o status vindo da API para um dos tipos usados na interface.
    function tipoStatusEstoque(carro) {
        // Normaliza o status para texto minúsculo sem espaços nas pontas.
        const status = String(statusEstoqueCarro(carro) || "").trim().toLowerCase();

        // Identifica carros em estoque por código ou texto.
        if (status === "1" || status.includes("estoque") || (status.includes("dispon") && !status.includes("indispon"))) {
            return "estoque";
        }

        // Identifica carros vendidos por código ou texto.
        if (status === "2" || status.includes("vend")) {
            return "vendido";
        }

        // Identifica carros indisponíveis por código ou texto.
        if (status === "3" || status.includes("indispon")) {
            return "indisponivel";
        }

        // Quando não reconhece o status, trata como indisponível.
        return "indisponivel";
    }

    // Retorna o texto amigável do status para aparecer no card.
    function textoStatusEstoque(carro) {
        // Reaproveita a função que normaliza o status.
        const status = tipoStatusEstoque(carro);

        // Texto exibido para veículo vendido.
        if (status === "vendido") {
            return "Vendido";
        }

        // Texto exibido para veículo indisponível.
        if (status === "indisponivel") {
            return "Indisponível";
        }

        // Texto exibido para veículo em estoque.
        return "Em estoque";
    }

    // Escolhe a classe CSS correta de acordo com o status do estoque.
    function classeStatusEstoque(carro) {
        // Normaliza o status antes de escolher a classe.
        const status = tipoStatusEstoque(carro);
        // Retorna a classe visual correspondente ao status.
        return status === "estoque" ? css.status_estoque : status === "vendido" ? css.status_vendido : css.status_indisponivel;
    }

    // Busca os carros na API; useCallback evita recriar a função sem necessidade.
    const carregarCarros = useCallback(async () => {
        // Liga o estado de carregamento.
        setCarregando(true);
        // Limpa erros anteriores antes de uma nova busca.
        setErro("");

        // Tenta fazer a requisição para a API.
        try {
            // Cria os parâmetros de query string.
            const params = new URLSearchParams();

            // Se uma categoria foi escolhida, adiciona ela na URL.
            if (categoria) {
                params.append("categoria", categoria);
            }

            // Faz a chamada GET para listar carros.
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                // Define o método HTTP da requisição.
                method: "GET",
                // Envia o cabeçalho de autorização.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies de sessão quando existirem.
                credentials: "include"
            });
            // Converte a resposta da API em JSON.
            const dados = await resposta.json();

            // Trata respostas de erro da API.
            if (!resposta.ok) {
                // Mostra a mensagem de erro retornada ou uma mensagem padrão.
                setErro(dados.erro || "Erro ao carregar veículos.");
                // Limpa a lista para não exibir dados antigos.
                setCarros([]);
                // Para a execução da função.
                return;
            }

            // Salva os carros retornados; se não vier lista, usa lista vazia.
            setCarros(dados.carros || []);
        } catch {
            // Mostra erro quando a API não responde ou ocorre falha de rede.
            setErro("Erro de conexão com o servidor.");
            // Limpa a lista em caso de falha.
            setCarros([]);
        } finally {
            // Desliga o carregamento ao final, com sucesso ou erro.
            setCarregando(false);
        }
    }, [API, categoria]);

    // Executa a busca de carros quando o componente abre ou quando a função muda.
    useEffect(() => {
        carregarCarros();
    }, [carregarCarros]);

    // Mantém na vitrine apenas os carros que estão em estoque.
    const carrosDisponiveis = carros.filter((carro) => tipoStatusEstoque(carro) === "estoque");
    // Normaliza o texto digitado para facilitar a busca.
    const termoBusca = busca.trim().toLowerCase();

    // Filtra os carros disponíveis pelo termo de busca, quando houver busca.
    const carrosFiltrados = termoBusca
        // Se existe busca, verifica vários campos do carro.
        ? carrosDisponiveis.filter((carro) => {
            // Campos pesquisáveis no card do carro.
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

            // Retorna true se qualquer campo contém o termo buscado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termoBusca));
        })
        // Se não existe busca, usa todos os carros disponíveis.
        : carrosDisponiveis;

    // Calcula o total de páginas, garantindo no mínimo 1 página.
    const totalPaginas = Math.max(1, Math.ceil(carrosFiltrados.length / ITENS_POR_PAGINA));

    // Volta para a primeira página quando a busca ou categoria mudam.
    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, categoria]);

    // Corrige a página atual caso ela fique maior que o total de páginas.
    useEffect(() => {
        // Se a página atual passou do limite, volta para a última página disponível.
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Calcula apenas os carros que devem aparecer na página atual.
    const carrosPaginados = useMemo(() => {
        // Descobre o índice inicial da página atual.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Recorta a lista filtrada usando o limite de itens por página.
        return carrosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [carrosFiltrados, paginaAtual]);

    // Define a mensagem que aparece quando não há carros para mostrar.
    const mensagemListaVazia = carros.length === 0
        // Caso não exista nenhum veículo cadastrado.
        ? {
            titulo: "Nenhum veículo cadastrado no momento.",
            texto: "Assim que novos veículos forem adicionados, eles aparecerão aqui."
        }
        // Caso existam veículos, mas nenhum esteja disponível em estoque.
        : carrosDisponiveis.length === 0
            ? {
                titulo: "Nenhum veículo disponível em estoque.",
                texto: "Os veículos vendidos ou indisponíveis ficam escondidos da vitrine do cliente."
            }
            // Caso existam veículos disponíveis, mas nenhum combine com o filtro/busca.
            : {
                titulo: "Nenhum veículo disponível encontrado.",
                texto: "Tente buscar por outra marca, modelo, cor, categoria ou ano."
            };

    // Formata o preço para moeda brasileira.
    function formatarPreco(valor) {
        // Converte o valor para número e aplica formato BRL.
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Converte o valor do câmbio para um texto amigável.
    function formatarCambio(valor) {
        // Normaliza o câmbio para comparação.
        const cambio = String(valor || "").toLowerCase();

        // Retorna Automático quando vier código 1 ou texto contendo "auto".
        if (cambio === "1" || cambio.includes("auto")) {
            return "Automático";
        }

        // Retorna Manual quando vier código 2 ou texto contendo "manual".
        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        // Se não reconhecer, mostra o valor original ou um hífen.
        return valor || "-";
    }

    // Descobre o ID do carro aceitando vários nomes possíveis vindos da API.
    function idCarro(carro) {
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
    }

    // Alterna o favorito de um carro clicado.
    async function favoritarCarro(carro) {
        // Pega o ID do carro usando a função auxiliar.
        const id = idCarro(carro);

        // Se não houver ID ou já houver favoritando em andamento, não faz nada.
        if (!id || favoritandoId) {
            return;
        }

        // Marca este carro como em processamento.
        setFavoritandoId(String(id));
        // Limpa qualquer erro anterior.
        setErro("");

        // Tenta atualizar o favorito na API.
        try {
            // Envia a requisição de favoritar/desfavoritar.
            await alternarFavorito(API, id);
            // Atualiza a lista local sem precisar recarregar toda a tela.
            setCarros((listaAtual) => listaAtual.map((item) => (
                // Se for o carro clicado, inverte o valor de favorito.
                String(idCarro(item)) === String(id) ? { ...item, favorito: !carroEstaFavoritado(item) } : item
            )));
        } catch (erroAtual) {
            // Mostra o erro retornado ou uma mensagem padrão.
            setErro(erroAtual.message || "Não foi possível atualizar este favorito.");
        } finally {
            // Libera o botão de favorito depois da tentativa.
            setFavoritandoId("");
        }
    }

    // Monta a URL da imagem do carro.
    function imagemCarro(carro) {
        // Busca a imagem em diferentes campos possíveis.
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        // Se não tiver imagem, usa o ícone padrão.
        if (!imagem) {
            return "/IconCar.png";
        }

        // Se já for URL completa, usa do jeito que veio.
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
        // Container geral da página de dashboard.
        <div className={css.layout_dashboard}>
            {/* Conteúdo principal da tela. */}
            <main className={css.conteudo_principal}>
                {/* Cabeçalho com saudação e área do usuário. */}
                <header className={css.cabecalho}>
                    {/* Título de boas-vindas com o nome do usuário. */}
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>{nomeUsuario}</span>
                    </h1>
                    {/* Área visual do usuário no canto do cabeçalho. */}
                    <div className={css.area_usuario}>
                        {/* Avatar/ícone de perfil estilizado pelo CSS. */}
                        <div className={css.perfil_usuario} />
                    </div>
                </header>

                {/* Campo de busca dos veículos. */}
                <div className={css.area_busca}>
                    {/* Ícone da lupa da busca. */}
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

                {/* Botões de filtro por categoria. */}
                <section className={css.secao_filtros}>
                    {/* Botão que remove o filtro de categoria. */}
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>
                    {/* Cria um botão para cada categoria cadastrada no array. */}
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
                    {carregando && <div className={css.estado_lista}>Carregando veículos...</div>}

                    {/* Mostra mensagem vazia quando terminou de carregar e não encontrou carros. */}
                    {!carregando && !erro && carrosFiltrados.length === 0 && (
                        <div className={css.estado_lista}>
                            <strong>{mensagemListaVazia.titulo}</strong>
                            <span>{mensagemListaVazia.texto}</span>
                        </div>
                    )}

                    {/* Renderiza um card para cada carro da página atual. */}
                    {!carregando && carrosPaginados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            {/* Área da imagem e do botão de favorito. */}
                            <div className={css.area_imagem_card}>
                                {/* Mostra o botão de favorito somente para usuários permitidos. */}
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
                                        <span aria-hidden="true">{carroEstaFavoritado(carro) ? "♥" : "♡"}</span>
                                    </button>
                                )}
                                {/* Imagem principal do carro. */}
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veículo"}
                                    onError={(evento) => {
                                        evento.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                            </div>

                            {/* Informações textuais do carro. */}
                            <div className={css.info_carro}>
                                {/* Título do carro e selo de status. */}
                                <div className={css.titulo_status}>
                                    <h2>{carro.modelo || carro.nome || "Veículo"}</h2>
                                    <span className={`${css.status_veiculo} ${classeStatusEstoque(carro)}`}>
                                        {textoStatusEstoque(carro)}
                                    </span>
                                </div>
                                {/* Grade com dados principais do veículo. */}
                                <div className={css.grade_info}>
                                    <p><strong>Marca:</strong> {carro.marca || "-"}</p>
                                    <p><strong>Ano:</strong> {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                                    <p><strong>Câmbio:</strong> {formatarCambio(carro.cambio)}</p>
                                    <p><strong>Cor:</strong> {carro.cor || "-"}</p>
                                </div>
                            </div>

                            {/* Área com preço e botão de detalhes. */}
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

                {/* Mostra a paginação somente quando há carros filtrados para navegar. */}
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

// Exporta o componente para ser usado nas rotas da aplicação.
export default Dashboard;
