// Importa hooks do React usados para estado, efeito, memoizacao e funcao estavel.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar entre rotas.
import { useNavigate } from "react-router-dom";
// Importa o CSS module exclusivo desta tela.
import css from "./Dashboard.module.css";
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

const CHAVE_FAVORITOS = "carros_favoritos";

function lerFavoritos() {
    try {
        const favoritos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || "[]");
        return Array.isArray(favoritos) ? favoritos : [];
    } catch {
        return [];
    }
}

function salvarFavoritos(favoritos) {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
    window.dispatchEvent(new Event("favoritos-carros-atualizados"));
}

function idFavorito(carro) {
    return String(carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO || "");
}

function carroEstaFavoritado(id) {
    const idAtual = String(id || "");
    return Boolean(idAtual && lerFavoritos().some((carro) => idFavorito(carro) === idAtual));
}

function alternarFavoritoCarro(carro) {
    const id = idFavorito(carro);

    if (!id) {
        return false;
    }

    const favoritos = lerFavoritos();
    const jaFavoritado = favoritos.some((item) => idFavorito(item) === id);

    if (jaFavoritado) {
        salvarFavoritos(favoritos.filter((item) => idFavorito(item) !== id));
        return false;
    }

    salvarFavoritos([{ ...carro, id }, ...favoritos]);
    return true;
}

// Lista fixa de categorias exibidas nos botoes de filtro.
const categorias = ["Sedan", "Elétrico", "Esportivo", "Caminhonete", "SUV"];

function idPeloToken() {
    const token = localStorage.getItem("access_token");

    if (!token || !token.includes(".")) {
        return "";
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        return "";
    }
}

// Tela principal do usuario comum, mostrando a vitrine de veiculos.
function Dashboard({ API }) {
    // Recebe a URL base da API Flask por props.
    // Guarda todos os carros retornados pela API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Guarda a categoria escolhida nos filtros.
    const [categoria, setCategoria] = useState("");
    // Guarda a pagina atual dos cards da vitrine.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Controla o estado de carregamento da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda mensagens de erro da API ou conexao.
    const [erro, setErro] = useState("");
    // Guarda as compras do cliente logado.
    const [compras, setCompras] = useState([]);
    // Controla o carregamento da area de minhas compras.
    const [carregandoCompras, setCarregandoCompras] = useState(true);
    // Guarda erro separado para nao atrapalhar a vitrine.
    const [erroCompras, setErroCompras] = useState("");
    const [pixParcelas, setPixParcelas] = useState({});
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    const [parcelaPixSelecionada, setParcelaPixSelecionada] = useState({});
    const [versaoFavoritos, setVersaoFavoritos] = useState(0);
   // Cria a funcao para navegar para outras paginas.
    const navigate = useNavigate();
    // Cria um objeto vazio para receber o usuario salvo.
    let usuario = {};

    // Tenta recuperar o usuario logado do localStorage.
    try {
        // Converte o JSON salvo no login para objeto JavaScript.
        usuario = JSON.parse(localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado")) || {};
    } catch {
        // Se o JSON estiver invalido, evita quebrar a tela.
        usuario = {};
    }

    // Define o nome exibido no cabecalho; usa fallback se nao existir nome.
    const nomeUsuario = usuario.nome || "Usuário";
    // Pega o ID do usuario logado para buscar suas compras.
    const idUsuario = usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken();

    // Lê o status do estoque aceitando nomes diferentes vindos da API.
    function statusEstoqueCarro(carro) {
        return carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.statusEstoque ?? carro?.status ?? "";
    }

    // Normaliza o status para usar nas regras da vitrine e no selo visual.
    function tipoStatusEstoque(carro) {
        const status = String(statusEstoqueCarro(carro) || "").trim().toLowerCase();

        if (status === "1" || status.includes("estoque") || (status.includes("dispon") && !status.includes("indispon"))) {
            return "estoque";
        }

        if (status === "2" || status.includes("vend")) {
            return "vendido";
        }

        if (status === "3" || status.includes("indispon")) {
            return "indisponivel";
        }

        return "indisponivel";
    }

    // Texto exibido no card para o status do veículo.
    function textoStatusEstoque(carro) {
        const status = tipoStatusEstoque(carro);

        if (status === "vendido") {
            return "Vendido";
        }

        if (status === "indisponivel") {
            return "Indisponível";
        }

        return "Em estoque";
    }

    // Classe visual do selo de status.
    function classeStatusEstoque(carro) {
        const status = tipoStatusEstoque(carro);
        return status === "estoque" ? css.status_estoque : status === "vendido" ? css.status_vendido : css.status_indisponivel;
    }

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
                setErro(dados.erro || "Erro ao carregar veículos.");
                // Limpa a lista para nao exibir dados antigos.
                setCarros([]);
                // Para a execucao da funcao.
                return;
            }

            // Salva os carros retornados; se nao vier lista, usa lista vazia.
            setCarros(dados.carros || []);
        } catch {
            // Mostra erro quando nao consegue conectar ao servidor.
            setErro("Erro de conexão com o servidor.");
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

    // Busca as compras do cliente logado para exibir no resumo do dashboard.
    const carregarCompras = useCallback(async () => {
        if (!idUsuario) {
            setCompras([]);
            setCarregandoCompras(false);
            return;
        }

        setCarregandoCompras(true);
        setErroCompras("");

        const rotas = [
            `/listar_vendas_usuario?id_usuario=${idUsuario}`,
            `/listar_compras_usuario?id_usuario=${idUsuario}`,
            `/minhas_compras?id_usuario=${idUsuario}`
        ];

        for (const rota of rotas) {
            try {
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    credentials: "include"
                });

                if (!resposta.ok) {
                    continue;
                }

                const dados = await resposta.json();
                const lista = Array.isArray(dados)
                    ? dados
                    : dados.compras || dados.vendas || dados.pedidos || [];

                setCompras(Array.isArray(lista) ? lista : []);
                setCarregandoCompras(false);
                return;
            } catch {
                // Tenta a proxima rota conhecida.
            }
        }

        setCompras([]);
        setErroCompras("Ainda não foi possível carregar suas compras.");
        setCarregandoCompras(false);
    }, [API, idUsuario]);

    // Executa o carregamento das compras do cliente.
    useEffect(() => {
        carregarCompras();
    }, [carregarCompras]);

    useEffect(() => {
        function atualizarFavoritos() {
            setVersaoFavoritos((versao) => versao + 1);
        }

        window.addEventListener("favoritos-carros-atualizados", atualizarFavoritos);
        return () => window.removeEventListener("favoritos-carros-atualizados", atualizarFavoritos);
    }, []);

    // Mostra na vitrine do cliente apenas veículos disponíveis para compra.
    const carrosDisponiveis = carros.filter((carro) => tipoStatusEstoque(carro) === "estoque");

    // Normaliza o texto da busca para comparar sem diferenciar maiusculas.
    const termoBusca = busca.trim().toLowerCase();

    // Aplica a busca digitada sem fazer nova chamada para a API.
    const carrosFiltrados = termoBusca
        ? carrosDisponiveis.filter((carro) => {
            // Campos do carro que podem ser pesquisados.
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

            // Retorna true quando algum campo contem o termo pesquisado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termoBusca));
        })
        : carrosDisponiveis;

    // Total de paginas considerando a busca e a categoria atual.
    const totalPaginas = Math.max(1, Math.ceil(carrosFiltrados.length / ITENS_POR_PAGINA));

    // Volta para a primeira pagina quando o cliente muda busca ou categoria.
    useEffect(() => {
        setPaginaAtual(1);
    }, [busca, categoria]);

    // Mantem a pagina atual dentro do limite quando a lista muda.
    useEffect(() => {
        if (paginaAtual > totalPaginas) {
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Mostra somente os carros da pagina atual.
    const carrosPaginados = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        return carrosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [carrosFiltrados, paginaAtual]);

    // Mensagem exibida quando a vitrine nao tem cards para mostrar.
    const mensagemListaVazia = carros.length === 0
        ? {
            titulo: "Nenhum veículo cadastrado no momento.",
            texto: "Assim que novos veículos forem adicionados, eles aparecerão aqui."
        }
        : carrosDisponiveis.length === 0
            ? {
                titulo: "Nenhum veículo disponível em estoque.",
                texto: "Os veículos vendidos ou indisponíveis ficam escondidos da vitrine do cliente."
            }
            : {
                titulo: "Nenhum veículo disponível encontrado.",
                texto: "Tente buscar por outra marca, modelo, cor, categoria ou ano."
            };

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
            return "Automático";
        }

        // Aceita codigo 2 ou texto que contenha manual.
        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        // Se nao reconheceu, retorna o proprio valor ou traco.
        return valor || "-";
    }

    // Formata datas vindas da API para o padrao brasileiro.
    function formatarData(valor) {
        if (!valor) {
            return "-";
        }

        const texto = String(valor);
        const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

        if (dataIso) {
            const [, ano, mes, dia] = dataIso;
            return `${dia}/${mes}/${ano}`;
        }

        const data = new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return texto;
        }

        return data.toLocaleDateString("pt-BR");
    }

    // Converte a forma de pagamento salva no banco em texto.
    function textoFormaPagamento(valor) {
        const forma = String(valor ?? "").trim().toLowerCase();

        if (forma === "0" || forma.includes("pix")) {
            return "Pix";
        }

        if (forma === "1" || forma.includes("parcel")) {
            return "Parcelamento";
        }

        return valor || "-";
    }

    function normalizarParcelaPix(parcela) {
        return {
            id: parcela.id_item_parcelamento ?? parcela.ID_ITEM_PARCELAMENTO ?? parcela.id ?? parcela.ID,
            numero: parcela.numero_parcela ?? parcela.NUMERO_PARCELA ?? parcela.parcela ?? parcela.PARCELA,
            valor: parcela.valor_parcela ?? parcela.VALOR_PARCELA ?? parcela.valor ?? parcela.VALOR ?? 0,
            vencimento: parcela.data_vencimento ?? parcela.DATA_VENCIMENTO ?? parcela.vencimento ?? parcela.VENCIMENTO,
            situacao: parcela.situacao_parcela ?? parcela.SITUACAO_PARCELA ?? parcela.status_parcela ?? parcela.STATUS_PARCELA ?? parcela.situacao ?? parcela.status ?? 0,
            qrcode: parcela.pix_qrcode ?? parcela.PIX_QRCODE ?? parcela.qrcode ?? parcela.qr_code ?? parcela.imagem_pix ?? parcela.imagem,
            copiaCola: parcela.pix_copia_cola ?? parcela.PIX_COPIA_COLA ?? parcela.copia_cola ?? parcela.payload ?? parcela.pix_payload
        };
    }

    function parcelaEstaPaga(parcela) {
        const situacao = String(parcela?.situacao ?? "").trim().toLowerCase();
        return situacao === "1" || situacao === "pago" || situacao === "paga" || situacao.includes("pago") || situacao.includes("paga");
    }

    function textoSituacaoParcela(parcela) {
        return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
    }

    function chaveParcelaPix(idVenda, parcela) {
        return `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
    }

    function ehVendaParcelada(compra) {
        const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
        const quantidadeParcelas = Number(String(compra?.quantidade_parcelas ?? compra?.parcelas ?? compra?.QUANTIDADE_PARCELAS ?? 0).replace(",", "."));
        return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
    }

    function idVendaCompra(compra) {
        return compra?.id_venda || compra?.ID_VENDA || compra?.id || compra?.ID;
    }

    function montarUrlPix(caminhoPix) {
        if (!caminhoPix) {
            return "";
        }

        const caminho = String(caminhoPix);

        if (caminho.startsWith("http") || caminho.startsWith("data:")) {
            return caminho;
        }

        if (caminho.startsWith("/")) {
            return `${API}${caminho}`;
        }

        return `${API}/${caminho}`;
    }

    async function carregarPixParcelas(idVenda) {
        if (!idVenda) {
            return;
        }

        if (pixParcelas[idVenda]?.length) {
            return;
        }

        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                return;
            }

            const listaParcelas = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(listaParcelas) ? listaParcelas.map(normalizarParcelaPix) : []
            }));
        } catch {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível conectar ao servidor para carregar o Pix das parcelas."
            }));
        } finally {
            setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    async function copiarPixParcela(codigo, idVenda, parcela) {
        if (!codigo) {
            return;
        }

        const chave = chaveParcelaPix(idVenda, parcela);
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        setPagandoPixParcelas((estado) => ({ ...estado, [chave]: true }));

        try {
            await navigator.clipboard.writeText(codigo);

            if (!parcela?.id || parcelaEstaPaga(parcela)) {
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Pix copiado. Esta parcela já está paga."
                }));
                return;
            }

            const resposta = await fetch(`${API}/pagar_parcela_pix/${parcela.id}`, {
                method: "POST",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível marcar a parcela como paga.");
            }

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id) === String(parcela.id)
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        : item
                ))
            }));

            if (dados.compra_quitada) {
                setCompras((estado) => estado.map((compra) => (
                    String(idVendaCompra(compra)) === String(idVenda)
                        ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                        : compra
                )));
            }

            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: dados.compra_quitada
                    ? "Pix copiado. Todas as parcelas foram pagas. Compra quitada."
                    : "Pix copiado. Parcela marcada como paga."
            }));
        } catch (erro) {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erro.message || "Não foi possível copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    useEffect(() => {
        compras.forEach((compra) => {
            const idVenda = idVendaCompra(compra);

            if (ehVendaParcelada(compra) && idVenda && !pixParcelas[idVenda]?.length && !carregandoPixParcelas[idVenda]) {
                carregarPixParcelas(idVenda);
            }
        });
    }, [compras]);

    // Converte o status de pagamento salvo no banco em texto.
    function textoStatusPagamento(valor) {
        const status = String(valor ?? "").trim().toLowerCase();

        if (status === "0" || status.includes("pago")) {
            return "Pago";
        }

        if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
            return "Em andamento";
        }

        return valor || "-";
    }

    // Define a classe visual do status de pagamento.
    function classeStatusPagamento(valor) {
        return textoStatusPagamento(valor) === "Pago" ? css.compra_pago : css.compra_andamento;
    }

    // Nome do veiculo comprado aceitando formatos diferentes da API.
    function nomeVeiculoCompra(compra) {
        return compra?.veiculo || compra?.nome_veiculo || compra?.modelo || compra?.nome || "Veículo";
    }

    // ID do veiculo comprado para abrir a tela de detalhes quando existir.
    function idVeiculoCompra(compra) {
        return compra?.id_veiculo || compra?.ID_VEICULO || compra?.id_carro || compra?.ID_CARRO;
    }

    // Monta a URL do comprovante quando o backend retornar arquivo.
    function comprovanteCompra(compra) {
        const arquivo = compra?.comprovante || compra?.comprovante_url || compra?.arquivo_comprovante;

        if (!arquivo) {
            return "";
        }

        if (String(arquivo).startsWith("http")) {
            return arquivo;
        }

        if (String(arquivo).startsWith("/")) {
            return `${API}${arquivo}`;
        }

        return `${API}/${arquivo}`;
    }

    // Pega o ID do carro aceitando nomes diferentes vindos da API.
    function idCarro(carro) {
        // Tenta id, depois id_carro, depois id_veiculo.
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
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

                {/* Area para o cliente acompanhar compras, parcelas e comprovantes. */}
                <section className={css.secao_compras}>
                    <div className={css.cabecalho_secao}>
                        <div>
                            <span>Área do cliente</span>
                            <h2>Minhas compras</h2>
                        </div>
                        <small>{compras.length} compra{compras.length === 1 ? "" : "s"}</small>
                    </div>

                    {carregandoCompras && (
                        <div className={css.estado_lista}>Carregando suas compras...</div>
                    )}

                    {!carregandoCompras && erroCompras && (
                        <div className={css.estado_lista}>
                            <strong>Não foi possível carregar suas compras agora.</strong>
                            <span>{erroCompras}</span>
                        </div>
                    )}

                    {!carregandoCompras && !erroCompras && compras.length === 0 && (
                        <div className={css.estado_lista}>
                            <strong>Você ainda não possui compras registradas.</strong>
                            <span>Quando uma venda for cadastrada no seu nome, ela aparecerá aqui.</span>
                        </div>
                    )}

                    {!carregandoCompras && !erroCompras && compras.length > 0 && (
                        <div className={css.lista_compras}>
                            {compras.map((compra) => {
                                const idVenda = idVendaCompra(compra);
                                const idVeiculo = idVeiculoCompra(compra);
                                const comprovante = comprovanteCompra(compra);
                                const parcelas = compra.quantidade_parcelas || compra.parcelas || compra.QUANTIDADE_PARCELAS;
                                const valor = compra.valor_venda || compra.valor_total || compra.VALOR_VENDA;
                                const recebido = compra.valor_recebido || compra.VALOR_RECEBIDO;
                                const vendaParcelada = ehVendaParcelada(compra);
                                const parcelasComPix = pixParcelas[idVenda] || [];
                                const carregandoPix = carregandoPixParcelas[idVenda];
                                const erroPix = erroPixParcelas[idVenda];
                                const mensagemPix = mensagemPixParcelas[idVenda];
                                const compraQuitadaParcelas = vendaParcelada && parcelasComPix.length > 0 && parcelasComPix.every(parcelaEstaPaga);
                                const statusPagamentoCompra = compraQuitadaParcelas ? 0 : (compra.status_pagamento ?? compra.STATUS_PAGAMENTO);
                                const indiceSalvoPix = Number(parcelaPixSelecionada[idVenda] ?? 0);
                                const indiceParcelaPix = Number.isFinite(indiceSalvoPix)
                                    ? Math.min(Math.max(indiceSalvoPix, 0), Math.max(parcelasComPix.length - 1, 0))
                                    : 0;
                                const parcelaPixAtual = parcelasComPix[indiceParcelaPix];
                                const chavePixAtual = chaveParcelaPix(idVenda, parcelaPixAtual);
                                const pagandoPixAtual = Boolean(pagandoPixParcelas[chavePixAtual]);

                                return (
                                    <article key={idVenda || `${nomeVeiculoCompra(compra)}-${compra.data_venda}`} className={`${css.card_compra} ${vendaParcelada ? css.card_compra_parcelada : ""}`}>
                                        <div className={css.topo_compra}>
                                            <div>
                                                <span>Veículo</span>
                                                <h3>{nomeVeiculoCompra(compra)}</h3>
                                            </div>
                                            <strong className={`${css.status_compra} ${classeStatusPagamento(statusPagamentoCompra)}`}>
                                                {textoStatusPagamento(statusPagamentoCompra)}
                                            </strong>
                                        </div>

                                        <div className={css.grade_compra}>
                                            <p><strong>Data:</strong> {formatarData(compra.data_venda ?? compra.DATA_VENDA)}</p>
                                            <p><strong>Pagamento:</strong> {textoFormaPagamento(compra.forma_pagamento ?? compra.FORMA_PAGAMENTO)}</p>
                                            <p><strong>Valor:</strong> {formatarPreco(valor)}</p>
                                            <p><strong>Recebido:</strong> {formatarPreco(recebido)}</p>
                                            <p><strong>Parcelas:</strong> {parcelas || "À vista"}</p>
                                        </div>

                                        <div className={css.acoes_compra}>
                                            {idVeiculo && (
                                                <button type="button" onClick={() => navigate(`/detalhesVeiculos/${idVeiculo}`)}>
                                                    Ver veículo
                                                </button>
                                            )}
                                            {comprovante && (
                                                <a href={comprovante} target="_blank" rel="noreferrer">
                                                    Ver comprovante
                                                </a>
                                            )}
                                        </div>

                                        {vendaParcelada && idVenda && compraQuitadaParcelas && (
                                            <div className={css.area_pix_parcelas}>
                                                <p className={css.sucesso_pix_parcelas}>
                                                    Compra paga por completo. Todas as parcelas foram quitadas.
                                                </p>
                                            </div>
                                        )}

                                        {vendaParcelada && idVenda && !compraQuitadaParcelas && (
                                            <div className={css.area_pix_parcelas}>
                                                <div className={css.topo_pix_parcelas}>
                                                    <div>
                                                        <span>Pagamento parcelado</span>
                                                        <h3>Pix das parcelas</h3>
                                                    </div>
                                                    <button type="button" onClick={() => carregarPixParcelas(idVenda)} disabled={carregandoPix}>
                                                        {carregandoPix ? "Carregando..." : "Atualizar Pix"}
                                                    </button>
                                                </div>

                                                {erroPix && <p className={css.erro_pix_parcelas}>{erroPix}</p>}
                                                {mensagemPix && <p className={css.sucesso_pix_parcelas}>{mensagemPix}</p>}

                                                {carregandoPix && parcelasComPix.length === 0 && (
                                                    <p className={css.estado_pix_parcelas}>Carregando Pix das parcelas...</p>
                                                )}

                                                {!carregandoPix && !erroPix && parcelasComPix.length === 0 && (
                                                    <p className={css.estado_pix_parcelas}>Nenhum Pix de parcela encontrado para esta venda.</p>
                                                )}

                                                {parcelasComPix.length > 0 && parcelaPixAtual && (
                                                    <div className={css.pix_parcela_unica}>
                                                        <label className={css.seletor_pix_parcela} htmlFor={`pix-parcela-${idVenda}`}>
                                                            <span>Escolha a parcela</span>
                                                            <select
                                                                id={`pix-parcela-${idVenda}`}
                                                                value={indiceParcelaPix}
                                                                onChange={(e) => setParcelaPixSelecionada((estado) => ({
                                                                    ...estado,
                                                                    [idVenda]: Number(e.target.value)
                                                                }))}
                                                            >
                                                                {parcelasComPix.map((parcela, indice) => (
                                                                    <option key={parcela.id || parcela.numero || indice} value={indice}>
                                                                        Parcela {parcela.numero || indice + 1} - {formatarPreco(parcela.valor)} - vence em {parcela.vencimento || "-"}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </label>

                                                        <div className={css.pix_resumo_parcela}>
                                                            <div>
                                                                <span>Parcela {parcelaPixAtual.numero || "-"}</span>
                                                                <strong>{formatarPreco(parcelaPixAtual.valor)}</strong>
                                                            </div>
                                                            <div>
                                                                <span>Vencimento</span>
                                                                <strong>{parcelaPixAtual.vencimento || "-"}</strong>
                                                            </div>
                                                            <div>
                                                                <span>Status</span>
                                                                <strong className={parcelaEstaPaga(parcelaPixAtual) ? css.parcela_paga : css.parcela_pendente}>
                                                                    {textoSituacaoParcela(parcelaPixAtual)}
                                                                </strong>
                                                            </div>
                                                        </div>

                                                        <div className={css.pix_conteudo_unico}>
                                                            <div className={css.pix_qrcode_area}>
                                                                {parcelaPixAtual.qrcode ? (
                                                                    <img src={montarUrlPix(parcelaPixAtual.qrcode)} alt={`QR Code Pix da parcela ${parcelaPixAtual.numero || ""}`} />
                                                                ) : (
                                                                    <span>QR Code indisponível</span>
                                                                )}
                                                            </div>

                                                            <label className={css.pix_copia_cola}>
                                                                <span>Pix copia e cola</span>
                                                                <textarea value={parcelaPixAtual.copiaCola || ""} readOnly />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copiarPixParcela(parcelaPixAtual.copiaCola, idVenda, parcelaPixAtual)}
                                                                    disabled={pagandoPixAtual}
                                                                >
                                                                    {pagandoPixAtual ? "Marcando..." : parcelaEstaPaga(parcelaPixAtual) ? "Copiar Pix pago" : "Copiar Pix"}
                                                                </button>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

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
                        placeholder="Buscar por marca, modelo, cor, categoria ou ano"
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
                    {carregando && <div className={css.estado_lista}>Carregando veículos...</div>}

                    {/* Estado vazio quando nao carregou, nao tem erro e nao tem carros filtrados. */}
                    {!carregando && !erro && carrosFiltrados.length === 0 && (
                        <div className={css.estado_lista}>
                            <strong>{mensagemListaVazia.titulo}</strong>
                            <span>{mensagemListaVazia.texto}</span>
                        </div>
                    )}

                    {/* Renderiza um card para cada carro filtrado na pagina atual. */}
                    {!carregando && carrosPaginados.map((carro) => (
                        <article key={idCarro(carro) || carro.modelo} className={css.card_carro}>
                            {/* Area da imagem do card. */}
                            <div className={css.area_imagem_card}>
                                {/* Imagem do carro vinda do backend ou icone padrao. */}
                                <img
                                    src={imagemCarro(carro)}
                                    alt={carro.modelo || "Veículo"}
                                    onError={(e) => {
                                        // Se a imagem falhar, troca para icone padrao.
                                        e.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                                <button
                                    type="button"
                                    className={`${css.botao_favorito} ${carroEstaFavoritado(idCarro(carro), versaoFavoritos) ? css.favorito_ativo : ""}`}
                                    onClick={() => {
                                        setVersaoFavoritos((versao) => versao + 1);
                                        alternarFavoritoCarro(carro);
                                    }}
                                    aria-label={carroEstaFavoritado(idCarro(carro)) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                    title={carroEstaFavoritado(idCarro(carro)) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                                >
                                    {carroEstaFavoritado(idCarro(carro)) ? "♥" : "♡"}
                                </button>
                            </div>

                            {/* Bloco de informacoes principais do carro. */}
                            <div className={css.info_carro}>
                                {/* Modelo ou nome do veiculo. */}
                                <div className={css.titulo_status}>
                                    <h2>{carro.modelo || carro.nome || "Veículo"}</h2>
                                    <span className={`${css.status_veiculo} ${classeStatusEstoque(carro)}`}>
                                        {textoStatusEstoque(carro)}
                                    </span>
                                </div>
                                {/* Grade com dados resumidos do carro. */}
                                <div className={css.grade_info}>
                                    {/* Marca do veiculo. */}
                                    <p><strong>Marca:</strong> {carro.marca || "-"}</p>
                                    {/* Ano de fabricacao e ano modelo. */}
                                    <p><strong>Ano:</strong> {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                                    {/* Cambio formatado. */}
                                    <p><strong>Câmbio:</strong> {formatarCambio(carro.cambio)}</p>
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

export default Dashboard;
