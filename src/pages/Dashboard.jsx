// Importa hooks do React usados para estado, efeito, memoizacao e funcao estavel.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar entre rotas.
import { useNavigate } from "react-router-dom";
// Importa o CSS module exclusivo desta tela.
import css from "./Dashboard.module.css";

// Lista fixa de categorias exibidas nos botoes de filtro.
const categorias = ["Sedan", "Elétrico", "Esportivo", "Caminhonete", "SUV"];

// Tela principal do usuario comum, mostrando a vitrine de veiculos.
function Dashboard({ API }) {
    // Recebe a URL base da API Flask por props.
    // Guarda todos os carros retornados pela API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Guarda a categoria escolhida nos filtros.
    const [categoria, setCategoria] = useState("");
    // Controla o estado de carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda mensagens de erro da API ou conexao.
    const [erro, setErro] = useState("");
   // Cria a funcao para navegar para outras paginas.
    const navigate = useNavigate();
    // Cria um objeto vazio para receber o usuario salvo.
    let usuario = {};

    // Tenta recuperar o usuario logado do localStorage.
    try {
        // Converte o JSON salvo no login para objeto JavaScript.
        usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch {
        // Se o JSON estiver invalido, evita quebrar a tela.
        usuario = {};
    }

    // Define o nome exibido no cabecalho; usa fallback se nao existir nome.
    const nomeUsuario = usuario.nome || "Usuario";

    // Busca os carros da API para montar a vitrine do usuario.
    const carregarCarros = useCallback(async () => {
        // Liga o carregamento antes de chamar a API.
        setCarregando(true);
        // Limpa erro antigo antes de uma nova busca.
        setErro("");

        try {
            // Cria os parametros de query da URL.
            const params = new URLSearchParams();
            // Se o usuario escolheu categoria, envia como filtro.
            if (categoria) {
                // Adiciona categoria na query string.
                params.append("categoria", categoria);
            }

            // Chama a rota que lista carros no backend.
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                // Usa GET porque a rota apenas consulta dados.
                method: "GET",
                // Envia cookies se o backend precisar deles.
                credentials: "include"
            });
            // Converte a resposta da API para JSON.
            const dados = await resposta.json();

            // Trata respostas com status de erro.
            if (!resposta.ok) {
                // Mostra erro enviado pela API ou uma mensagem padrao.
                setErro(dados.erro || "Erro ao carregar veiculos.");
                // Limpa a lista para nao exibir dados antigos.
                setCarros([]);
                // Para a execucao da funcao.
                return;
            }

            // Salva os carros retornados; se nao vier lista, usa lista vazia.
            setCarros(dados.carros || []);
        } catch {
            // Mostra erro quando nao consegue conectar ao servidor.
            setErro("Erro de conexao com o servidor.");
            // Limpa a lista em caso de falha.
            setCarros([]);
        } finally {
            // Desliga o carregamento no sucesso ou erro.
            setCarregando(false);
        }
    }, [API, categoria]); // Recria a funcao quando API ou categoria mudarem.

    // Executa o carregamento inicial e recarrega ao trocar a categoria.
    useEffect(() => {
        // Chama a funcao que busca os carros.
        carregarCarros();
    }, [carregarCarros]); // Roda novamente quando carregarCarros for recriada.

    // Aplica a busca digitada sem fazer nova chamada para a API.
    const carrosFiltrados = useMemo(() => {
        // Normaliza o texto da busca para comparar sem diferenciar maiusculas.
        const termo = busca.trim().toLowerCase();

        // Se nao houver busca, retorna a lista completa.
        if (!termo) {
            return carros;
        }

        // Filtra os carros procurando o termo em varios campos.
        return carros.filter((carro) => {
            // Campos do carro que podem ser pesquisados.
            const campos = [
                // Nome alternativo do veiculo.
                carro.nome,
                // Modelo do veiculo.
                carro.modelo,
                // Marca do veiculo.
                carro.marca,
                // Placa do veiculo.
                carro.placa,
                // Cor do veiculo.
                carro.cor,
                // Ano de fabricacao.
                carro.ano_fabricacao,
                // Ano do modelo.
                carro.ano_modelo,
                // Categoria em formato simples.
                carro.categoria,
                // Categoria em formato alternativo vindo da API.
                carro.nome_categoria
            ];

            // Retorna true quando algum campo contem o termo pesquisado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, carros]); // Recalcula apenas quando busca ou carros mudarem.

    // Formata numero como moeda brasileira.
    function formatarPreco(valor) {
        // Converte valor para numero e aplica padrao pt-BR em BRL.
        return Number(valor || 0).toLocaleString("pt-BR", {
            // Define que o formato sera monetario.
            style: "currency",
            // Define real brasileiro como moeda.
            currency: "BRL"
        });
    }

    // Converte o valor de cambio para texto legivel.
    function formatarCambio(valor) {
        // Normaliza o valor para texto minusculo.
        const cambio = String(valor || "").toLowerCase();

        // Aceita codigo 1 ou texto que contenha automatico.
        if (cambio === "1" || cambio.includes("auto")) {
            return "Automatico";
        }

        // Aceita codigo 2 ou texto que contenha manual.
        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        // Se nao reconheceu, retorna o proprio valor ou traco.
        return valor || "-";
    }

    // Pega o ID do carro aceitando nomes diferentes vindos da API.
    function idCarro(carro) {
        // Tenta id, depois id_carro, depois id_veiculo.
        return carro?.id || carro?.id_carro || carro?.id_veiculo;
    }

    // Monta a URL da imagem salva no backend ou usa um icone padrao.
    function imagemCarro(carro) {
        // Aceita diferentes nomes possiveis para imagem.
        const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

        // Se nao existe imagem, usa icone padrao.
        if (!imagem) {
            return "/IconCar.png";
        }

        // Se a imagem ja veio com URL completa, usa direto.
        if (String(imagem).startsWith("http")) {
            return imagem;
        }

        // Se veio como caminho iniciado por barra, junta com a API.
        if (String(imagem).startsWith("/")) {
            return `${API}${imagem}`;
        }

        // Se veio como caminho relativo, adiciona barra entre API e caminho.
        return `${API}/${imagem}`;
    }

    // Renderiza a dashboard do usuario.
    return (
        // Container geral da pagina.
        <div className={css.layout_dashboard}>

            {/* Conteudo principal da dashboard. */}
            <main className={css.conteudo_principal}>

                {/* Cabecalho com saudacao do usuario. */}
                <header className={css.cabecalho}>
                    {/* Titulo de boas-vindas com nome do usuario. */}
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>{nomeUsuario}</span>
                    </h1>
                    {/* Area reservada para informacoes/avatar do usuario. */}
                    <div className={css.area_usuario}>
                        {/* Container do perfil; hoje esta vazio visualmente. */}
                        <div className={css.perfil_usuario}>

                        </div>
                    </div>
                </header>

                {/* Area de busca por texto. */}
                <div className={css.area_busca}>
                    {/* Icone visual dentro da busca. */}
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    {/* Input controlado pela variavel busca. */}
                    <input
                        type="text"
                        placeholder="Buscar veiculos"
                        className={css.input_busca}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                {/* Secao com botoes de filtro por categoria. */}
                <section className={css.secao_filtros}>
                    {/* Botao que limpa o filtro de categoria. */}
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>
                    {/* Cria um botao para cada categoria cadastrada na lista fixa. */}
                    {categorias.map((nomeCategoria) => (
                        <button
                            // Usa o nome da categoria como chave unica.
                            key={nomeCategoria}
                            type="button"
                            // Marca visualmente a categoria ativa.
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            // Atualiza a categoria e dispara novo carregamento pela API.
                            onClick={() => setCategoria(nomeCategoria)}
                        >
                            {/* Texto da categoria. */}
                            {nomeCategoria}
                        </button>
                    ))}
                </section>

                {/* Exibe erro quando houver mensagem no estado. */}
                {erro && <p className={css.mensagem_erro}>{erro}</p>}

                {/* Lista de cards dos carros. */}
                <section className={css.lista_carros}>
                    {/* Estado exibido enquanto a lista esta carregando. */}
                    {carregando && <div className={css.estado_lista}>Carregando veiculos...</div>}

                    {/* Estado vazio quando nao carregou, nao tem erro e nao tem carros filtrados. */}
                    {!carregando && !erro && carrosFiltrados.length === 0 && (
                        <div className={css.estado_lista}>Nenhum veículo encontrado.</div>
                    )}

                    {/* Renderiza um card para cada carro filtrado. */}
                    {!carregando && carrosFiltrados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            {/* Area da imagem do card. */}
                            <div className={css.area_imagem_card}>
                                {/* Imagem do carro vinda do backend ou icone padrao. */}
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veiculo"}
                                    onError={(e) => {
                                        // Se a imagem falhar, troca para icone padrao.
                                        e.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                            </div>

                            {/* Bloco de informacoes principais do carro. */}
                            <div className={css.info_carro}>
                                {/* Modelo ou nome do veiculo. */}
                                <h2>{carro.modelo || carro.nome || "Veiculo"}</h2>
                                {/* Grade com dados resumidos do carro. */}
                                <div className={css.grade_info}>
                                    {/* Marca do veiculo. */}
                                    <p><strong>Marca:</strong> {carro.marca || "-"}</p>
                                    {/* Ano de fabricacao e ano modelo. */}
                                    <p><strong>Ano:</strong> {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                                    {/* Cambio formatado. */}
                                    <p><strong>Cambio:</strong> {formatarCambio(carro.cambio)}</p>
                                    {/* Cor do veiculo. */}
                                    <p><strong>Cor:</strong> {carro.cor || "-"}</p>
                                </div>
                            </div>

                            {/* Rodape do card com preco e botao de detalhes. */}
                            <div className={css.area_preco}>
                                {/* Preco formatado como moeda. */}
                                <strong>{formatarPreco(carro.preco)}</strong>
                                {/* Botao navega para a pagina de detalhes do veiculo. */}
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
            </main>
        </div>
    );
}

export default Dashboard;