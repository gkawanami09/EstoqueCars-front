// Importa os hooks do React usados para estado, efeitos, memorização e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar para outras rotas.
import { useNavigate } from "react-router-dom";
// Importa as classes CSS module desta página.
import css from "./MinhasCompras.module.css";

// Monta o cabeçalho de autorização para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se existir token, envia Authorization Bearer; se não existir, envia objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tenta descobrir o ID do usuário dentro do token JWT.
function idPeloToken() {
    // Busca o token salvo no localStorage.
    const token = localStorage.getItem("access_token");

    // Se não houver token ou ele não parecer um JWT, retorna vazio.
    if (!token || !token.includes(".")) {
        return "";
    }

    // Tenta decodificar o payload do token.
    try {
        // Decodifica a segunda parte do JWT e transforma em objeto.
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        // Retorna o ID aceitando diferentes nomes de campo.
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        // Se a decodificação falhar, retorna vazio.
        return "";
    }
}

// Lê os dados do usuário logado salvos no navegador.
function lerUsuarioLogado() {
    // Tenta converter o JSON do localStorage em objeto.
    try {
        return JSON.parse(localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado")) || {};
    } catch {
        // Se o JSON estiver inválido, retorna objeto vazio.
        return {};
    }
}

// Formata um valor numérico como moeda brasileira.
function formatarMoeda(valor) {
    // Converte para número e aplica o formato BRL.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Formata uma data para o padrão brasileiro.
function formatarData(valor) {
    // Se não houver valor, mostra hífen.
    if (!valor) {
        return "-";
    }

    // Converte o valor recebido para texto.
    const texto = String(valor);
    // Verifica se a data está no formato ISO yyyy-mm-dd.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    // Se for ISO, reorganiza para dd/mm/yyyy sem depender de timezone.
    if (dataIso) {
        const [, ano, mes, dia] = dataIso;
        return `${dia}/${mes}/${ano}`;
    }

    // Tenta criar um objeto Date com o valor recebido.
    const data = new Date(valor);
    // Se a data for inválida, retorna o texto original; senão, formata para pt-BR.
    return Number.isNaN(data.getTime()) ? texto : data.toLocaleDateString("pt-BR");
}

// Converte o código ou texto da forma de pagamento para uma label amigável.
function textoFormaPagamento(valor) {
    // Normaliza o valor para comparação.
    const forma = String(valor ?? "").trim().toLowerCase();

    // Código 0 ou texto com Pix vira Pix.
    if (forma === "0" || forma.includes("pix")) {
        return "Pix";
    }

    // Código 1 ou texto com parcela vira Parcelamento.
    if (forma === "1" || forma.includes("parcel")) {
        return "Parcelamento";
    }

    // Se não reconhecer, mostra o valor original ou hífen.
    return valor || "-";
}

// Converte o status de pagamento para texto amigável.
function textoStatusPagamento(valor) {
    // Normaliza o status para comparação.
    const status = String(valor ?? "").trim().toLowerCase();

    // Código 0 ou texto pago vira Pago.
    if (status === "0" || status.includes("pago")) {
        return "Pago";
    }

    // Código 1, andamento ou pendente vira Em andamento.
    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        return "Em andamento";
    }

    // Se não reconhecer, mostra o valor original ou hífen.
    return valor || "-";
}

// Descobre o ID da venda/compra aceitando diferentes campos da API.
function idVendaCompra(compra) {
    return compra?.id_venda || compra?.ID_VENDA || compra?.id || compra?.ID;
}

// Descobre o ID do veículo relacionado à compra.
function idVeiculoCompra(compra) {
    return compra?.id_veiculo || compra?.ID_VEICULO || compra?.id_carro || compra?.ID_CARRO;
}

// Monta o nome do veículo comprado.
function nomeVeiculoCompra(compra) {
    return compra?.veiculo || compra?.nome_veiculo || compra?.modelo || compra?.nome || "Veículo";
}

// Verifica se a compra foi feita de forma parcelada.
function ehVendaParcelada(compra) {
    // Normaliza a forma de pagamento.
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    // Lê a quantidade de parcelas aceitando vários campos.
    const quantidadeParcelas = Number(String(compra?.quantidade_parcelas ?? compra?.parcelas ?? compra?.QUANTIDADE_PARCELAS ?? 0).replace(",", "."));
    // Considera parcelada por código, texto ou quantidade maior que 1.
    return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
}

// Verifica se a compra foi Pix à vista.
function ehVendaPixAVista(compra) {
    // Normaliza a forma de pagamento.
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    // É Pix à vista quando a forma é Pix e a compra não é parcelada.
    return (forma === "0" || forma.includes("pix")) && !ehVendaParcelada(compra);
}

// Normaliza os dados de Pix de uma venda à vista.
function normalizarPixVenda(dados) {
    // Retorna um objeto padronizado mesmo quando a API usa nomes diferentes.
    return {
        qrcode: dados?.pix_qrcode ?? dados?.PIX_QRCODE ?? dados?.qrcode ?? dados?.qr_code ?? dados?.imagem_pix ?? dados?.imagem,
        copiaCola: dados?.pix_copia_cola ?? dados?.PIX_COPIA_COLA ?? dados?.pix_copia_e_cola ?? dados?.copia_cola ?? dados?.payload ?? dados?.pix_payload,
        valor: dados?.valor ?? dados?.valor_recebido ?? dados?.VALOR_RECEBIDO ?? dados?.valor_venda ?? dados?.VALOR_VENDA
    };
}

// Normaliza os dados de Pix de uma parcela.
function normalizarParcelaPix(parcela) {
    // Retorna a parcela em um formato único para a interface.
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

// Verifica se uma parcela já está paga.
function parcelaEstaPaga(parcela) {
    // Normaliza a situação da parcela.
    const situacao = String(parcela?.situacao ?? "").trim().toLowerCase();
    // Considera paga por código ou texto.
    return situacao === "1" || situacao === "pago" || situacao === "paga" || situacao.includes("pago") || situacao.includes("paga");
}

// Retorna o texto de situação da parcela.
function textoSituacaoParcela(parcela) {
    return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
}

// Cria uma chave única para controlar o estado de uma parcela Pix.
function chaveParcelaPix(idVenda, parcela) {
    return `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
}

function dataAtualParaApi() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function valorParaNumero(valor) {
    const texto = String(valor ?? "").trim();

    if (!texto) {
        return 0;
    }

    const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;

    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function transacaoPareceFinanceira(transacao) {
    if (!transacao || typeof transacao !== "object") {
        return false;
    }

    return Boolean(
        transacao.id_financeiro ||
        transacao.ID_FINANCEIRO ||
        transacao.tipo_financeiro ||
        transacao.TIPO_FINANCEIRO ||
        transacao.data_financeiro ||
        transacao.DATA_FINANCEIRO ||
        transacao.valor_financeiro ||
        transacao.VALOR_FINANCEIRO ||
        (transacao.tipo && transacao.valor && transacao.descricao)
    );
}

function pagamentoRegistrouReceita(dados) {
    return Boolean(
        dados?.receita_registrada ||
        dados?.financeiro_registrado ||
        dados?.financeiro_criado ||
        dados?.id_financeiro ||
        dados?.financeiro?.id_financeiro ||
        dados?.financeiro?.id ||
        dados?.receita?.id_financeiro ||
        dados?.receita?.id ||
        dados?.transacao_financeira?.id_financeiro ||
        dados?.transacao_financeira?.id ||
        transacaoPareceFinanceira(dados?.transacao)
    );
}

const comprasPagasLocalStorage = "estoquecars_compras_pagas_confirmadas";
const parcelasPagasLocalStorage = "estoquecars_parcelas_pix_pagas_confirmadas";
const comprasCanceladasLocalStorage = "estoquecars_compras_pix_canceladas";
const parcelasCanceladasLocalStorage = "estoquecars_parcelas_pix_canceladas";
const receitasRegistradasLocalStorage = "estoquecars_receitas_pix_registradas";
const receitasFinanceiroIdsLocalStorage = "estoquecars_receitas_pix_financeiro_ids";

function lerListaLocalStorage(chave) {
    try {
        const lista = JSON.parse(localStorage.getItem(chave) || "[]");
        return Array.isArray(lista) ? lista.map(String) : [];
    } catch {
        return [];
    }
}

function itemExisteNoLocalStorage(chave, id) {
    return lerListaLocalStorage(chave).includes(String(id));
}

function salvarItemLocalStorage(chave, id) {
    const lista = lerListaLocalStorage(chave);
    const texto = String(id);

    if (!lista.includes(texto)) {
        localStorage.setItem(chave, JSON.stringify([...lista, texto]));
    }
}

function removerItemLocalStorage(chave, id) {
    const texto = String(id);
    const lista = lerListaLocalStorage(chave).filter((item) => item !== texto);
    localStorage.setItem(chave, JSON.stringify(lista));
}

function lerObjetoLocalStorage(chave) {
    try {
        const objeto = JSON.parse(localStorage.getItem(chave) || "{}");
        return objeto && typeof objeto === "object" && !Array.isArray(objeto) ? objeto : {};
    } catch {
        return {};
    }
}

function salvarValorObjetoLocalStorage(chave, id, valor) {
    if (!id || !valor) {
        return;
    }

    localStorage.setItem(chave, JSON.stringify({
        ...lerObjetoLocalStorage(chave),
        [String(id)]: String(valor)
    }));
}

function removerValorObjetoLocalStorage(chave, id) {
    const objeto = lerObjetoLocalStorage(chave);
    delete objeto[String(id)];
    localStorage.setItem(chave, JSON.stringify(objeto));
}

function idFinanceiroResposta(dados) {
    return dados?.id_financeiro ||
        dados?.ID_FINANCEIRO ||
        dados?.financeiro?.id_financeiro ||
        dados?.financeiro?.ID_FINANCEIRO ||
        dados?.financeiro?.id ||
        dados?.receita?.id_financeiro ||
        dados?.receita?.ID_FINANCEIRO ||
        dados?.receita?.id ||
        dados?.transacao_financeira?.id_financeiro ||
        dados?.transacao_financeira?.ID_FINANCEIRO ||
        dados?.transacao_financeira?.id ||
        dados?.transacao?.id_financeiro ||
        dados?.transacao?.ID_FINANCEIRO ||
        dados?.transacao?.id;
}

function idFinanceiroTransacao(transacao) {
    return transacao?.id_financeiro || transacao?.ID_FINANCEIRO || transacao?.id || transacao?.ID;
}

function normalizarTextoBusca(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function valorFinanceiroNumero(transacao) {
    return valorParaNumero(transacao?.valor ?? transacao?.VALOR ?? transacao?.valor_financeiro ?? transacao?.VALOR_FINANCEIRO);
}

async function buscarIdsReceitasFinanceiras(API, { descricaoReceita = "", idVenda = "", valor = 0 } = {}) {
    const resposta = await fetch(`${API}/listar_financeiro`, {
        method: "GET",
        headers: cabecalhoAutorizacao(),
        credentials: "include"
    });
    const dados = await lerRespostaJson(resposta);

    if (!resposta.ok) {
        return "";
    }

    const lista = Array.isArray(dados)
        ? dados
        : dados.transacoes || dados.financeiro || [];
    const descricaoEsperada = normalizarTextoBusca(descricaoReceita);
    const codigoVenda = idVenda ? normalizarTextoBusca(`codigo da venda: ${idVenda}`) : "";
    const vendaNumero = idVenda ? normalizarTextoBusca(`venda #${idVenda}`) : "";
    const valorEsperado = valorParaNumero(valor);

    return lista.filter((transacao) => {
        const tipo = String(transacao?.tipo || transacao?.TIPO_TEXTO || "").trim().toLowerCase();
        const descricao = normalizarTextoBusca(transacao?.descricao || transacao?.DESCRICAO);
        const ehReceita = tipo === "entrada" || tipo === "receita" || tipo === "0" || tipo === "";
        const bateDescricao = Boolean(descricaoEsperada && descricao === descricaoEsperada) ||
            Boolean(codigoVenda && descricao.includes(codigoVenda)) ||
            Boolean(vendaNumero && descricao.includes(vendaNumero));
        const bateValor = !valorEsperado || Math.abs(valorFinanceiroNumero(transacao) - valorEsperado) < 0.01;

        return ehReceita && bateDescricao && bateValor;
    }).map(idFinanceiroTransacao).filter(Boolean);
}

async function excluirReceitaFinanceira(API, chaveReceita, { descricaoReceita = "", idVenda = "", valor = 0 } = {}) {
    const idsReceitas = lerObjetoLocalStorage(receitasFinanceiroIdsLocalStorage);
    const idsFinanceiros = [
        idsReceitas[chaveReceita],
        ...await buscarIdsReceitasFinanceiras(API, { descricaoReceita, idVenda, valor })
    ].filter(Boolean);

    for (const idFinanceiro of [...new Set(idsFinanceiros)]) {
        const resposta = await fetch(`${API}/excluir_financeiro/${idFinanceiro}`, {
            method: "DELETE",
            headers: cabecalhoAutorizacao(),
            credentials: "include"
        });

        if (!resposta.ok && resposta.status !== 404) {
            const dados = await lerRespostaJson(resposta);
            throw new Error(dados.erro || dados.mensagem || "Pagamento cancelado, mas não foi possível remover a receita do financeiro.");
        }
    }

    removerItemLocalStorage(receitasRegistradasLocalStorage, chaveReceita);
    removerValorObjetoLocalStorage(receitasFinanceiroIdsLocalStorage, chaveReceita);
}

async function lerRespostaJson(resposta) {
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

function dataCompraParaOrdenacao(compra) {
    const valor = compra?.data_venda ?? compra?.DATA_VENDA ?? compra?.data ?? compra?.DATA ?? "";
    const texto = String(valor).trim();

    if (!texto) {
        return 0;
    }

    const data = new Date(texto);

    if (!Number.isNaN(data.getTime())) {
        return data.getTime();
    }

    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    if (dataBr) {
        const [, dia, mes, ano] = dataBr;
        return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime();
    }

    return 0;
}

function ordenarComprasCronologicamente(compras) {
    return [...compras].sort((a, b) => {
        const dataA = dataCompraParaOrdenacao(a);
        const dataB = dataCompraParaOrdenacao(b);

        if (dataA !== dataB) {
            return dataA - dataB;
        }

        return String(idVendaCompra(a) || "").localeCompare(String(idVendaCompra(b) || ""), "pt-BR", { numeric: true });
    });
}

function aplicarPagamentoLocal(compra) {
    const idVenda = idVendaCompra(compra);

    if (idVenda && itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda)) {
        return { ...compra, status_pagamento: 1, STATUS_PAGAMENTO: 1 };
    }

    if (!idVenda || !itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda)) {
        return compra;
    }

    return { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 };
}

function aplicarParcelaPagaLocal(idVenda, parcela) {
    const chaveParcela = parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`;

    if (chaveParcela && itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, chaveParcela)) {
        return { ...parcela, situacao: 0 };
    }

    if (!chaveParcela || !itemExisteNoLocalStorage(parcelasPagasLocalStorage, chaveParcela)) {
        return parcela;
    }

    return { ...parcela, situacao: 1 };
}

async function confirmarStatusPagamentoVenda(API, idVenda) {
    if (!idVenda) {
        return {};
    }

    const body = JSON.stringify({
        status_pagamento: 0,
        STATUS_PAGAMENTO: 0,
        status: 0
    });
    const rotas = [
        { metodo: "POST", url: `${API}/confirmar_pagamento_pix_venda/${idVenda}` },
        { metodo: "POST", url: `${API}/pagar_venda_pix/${idVenda}` },
        { metodo: "POST", url: `${API}/confirmar_pagamento_venda/${idVenda}` },
        { metodo: "PUT", url: `${API}/atualizar_status_pagamento_venda/${idVenda}` },
        { metodo: "PUT", url: `${API}/editar_venda/${idVenda}` }
    ];

    for (const rota of rotas) {
        try {
            const resposta = await fetch(rota.url, {
                method: rota.metodo,
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutorizacao()
                },
                credentials: "include",
                body
            });
            const dados = await lerRespostaJson(resposta);

            if (resposta.ok) {
                return dados;
            }
        } catch {
            // Continua tentando as rotas alternativas conhecidas.
        }
    }

    throw new Error("Não foi possível confirmar o pagamento na API.");
}

// Componente principal da página Minhas compras.
function MinhasCompras({ API }) {
    // Cria a função para navegar para outras páginas.
    const navigate = useNavigate();
    // Lê o usuário uma vez ao montar o componente.
    const usuario = useMemo(() => lerUsuarioLogado(), []);
    // Descobre o ID do usuário pelo objeto salvo ou pelo token.
    const idUsuario = usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken();

    // Guarda a lista de compras do usuário.
    const [compras, setCompras] = useState([]);
    // Controla o carregamento inicial da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda erro geral da página.
    const [erro, setErro] = useState("");
    // Guarda as parcelas Pix por ID da venda.
    const [pixParcelas, setPixParcelas] = useState({});
    // Controla carregamento de Pix das parcelas por venda.
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    // Guarda erros de Pix das parcelas por venda.
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    // Guarda mensagens de sucesso de Pix das parcelas por venda.
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    // Controla qual parcela está sendo marcada como paga.
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    // Guarda qual parcela Pix está selecionada em cada venda.
    const [parcelaPixSelecionada, setParcelaPixSelecionada] = useState({});
    // Guarda os dados de Pix de vendas à vista por ID da venda.
    const [pixVendas, setPixVendas] = useState({});
    // Controla carregamento de Pix de venda à vista por venda.
    const [carregandoPixVendas, setCarregandoPixVendas] = useState({});
    // Guarda erros de Pix de venda à vista por venda.
    const [erroPixVendas, setErroPixVendas] = useState({});
    // Guarda mensagens de sucesso de Pix de venda à vista por venda.
    const [mensagemPixVendas, setMensagemPixVendas] = useState({});
    const [pagandoPixVendas, setPagandoPixVendas] = useState({});
    // Controla qual compra está aberta para mostrar Pix ou parcelas.
    const [compraAbertaId, setCompraAbertaId] = useState("");

    // Monta URL completa para arquivos ou imagens.
    function montarUrlArquivo(valor) {
        // Se não houver valor, retorna vazio.
        if (!valor) {
            return "";
        }

        // Converte o caminho recebido para texto.
        const caminho = String(valor);

        // Se já for URL completa ou base64/data URL, usa como veio.
        if (caminho.startsWith("http") || caminho.startsWith("data:")) {
            return caminho;
        }

        // Se vier com barra inicial, concatena direto com a API.
        if (caminho.startsWith("/")) {
            return `${API}${caminho}`;
        }

        // Se vier caminho relativo, adiciona a barra entre API e caminho.
        return `${API}/${caminho}`;
    }

    // Monta a URL do comprovante de uma compra.
    function comprovanteCompra(compra) {
        return montarUrlArquivo(compra?.comprovante || compra?.comprovante_url || compra?.arquivo_comprovante);
    }

    // Monta o parâmetro de chave Pix da empresa quando ela estiver salva.
    function parametroChavePixAtual() {
        // Busca a chave Pix salva no navegador.
        const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
        // Se existir chave, adiciona na query string; senão, retorna vazio.
        return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
    }

    // Carrega as compras do usuário tentando rotas conhecidas da API.
    const carregarCompras = useCallback(async () => {
        // Se não houver ID do usuário, não dá para buscar compras.
        if (!idUsuario) {
            setCompras([]);
            setCarregando(false);
            setErro("Não foi possível identificar o usuário logado.");
            return;
        }

        // Ativa o carregamento da lista.
        setCarregando(true);
        // Limpa erros antigos.
        setErro("");

        // Rotas alternativas para compatibilidade com diferentes nomes no backend.
        const rotas = [
            `/listar_vendas_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            `/listar_compras_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            `/minhas_compras?id_usuario=${encodeURIComponent(idUsuario)}`
        ];

        // Tenta cada rota até encontrar uma resposta válida.
        for (const rota of rotas) {
            try {
                // Faz a requisição para a rota atual.
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });

                // Se a rota não respondeu sucesso, tenta a próxima.
                if (!resposta.ok) {
                    continue;
                }

                // Converte a resposta em JSON.
                const dados = await lerRespostaJson(resposta);
                // Aceita lista direta ou dentro de propriedades comuns.
                const lista = Array.isArray(dados)
                    ? dados
                    : dados.compras || dados.vendas || dados.pedidos || [];

                // Salva a lista de compras preservando pagamentos confirmados nesta tela.
                setCompras(Array.isArray(lista) ? ordenarComprasCronologicamente(lista.map(aplicarPagamentoLocal)) : []);
                // Desliga o carregamento.
                setCarregando(false);
                // Encerra a função porque uma rota funcionou.
                return;
            } catch {
                // Tenta a próxima rota conhecida.
            }
        }

        // Se nenhuma rota funcionou, limpa a lista.
        setCompras([]);
        // Mostra erro geral.
        setErro("Ainda não foi possível carregar suas compras.");
        // Desliga o carregamento.
        setCarregando(false);
    }, [API, idUsuario]);

    // Carrega os Pix das parcelas de uma venda.
    const carregarPixParcelas = useCallback(async (idVenda) => {
        // Se não houver ID ou as parcelas já foram carregadas, não faz nada.
        if (!idVenda || pixParcelas[idVenda]?.length) {
            return;
        }

        // Marca esta venda como carregando Pix de parcelas.
        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        // Limpa erro de Pix desta venda.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta buscar os Pix das parcelas.
        try {
            // Faz a requisição para listar Pix das parcelas.
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte a resposta para JSON.
            const dados = await lerRespostaJson(resposta);

            // Trata erro retornado pela API.
            if (!resposta.ok) {
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                return;
            }

            // Aceita a lista em vários formatos de resposta.
            const lista = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            // Salva as parcelas normalizadas no estado.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(lista)
                    ? lista.map((parcela) => aplicarParcelaPagaLocal(idVenda, normalizarParcelaPix(parcela)))
                    : []
            }));
        } catch {
            // Mostra erro quando não consegue conectar ao servidor.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível conectar ao servidor para carregar o Pix das parcelas."
            }));
        } finally {
            // Desliga o carregamento desta venda.
            setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixParcelas]);

    // Carrega o Pix de uma venda à vista.
    const carregarPixVenda = useCallback(async (compra, forcar = false) => {
        // Descobre o ID da venda.
        const idVenda = idVendaCompra(compra);

        // Se não houver venda ou ela não for Pix à vista, não faz nada.
        if (!idVenda || !ehVendaPixAVista(compra)) {
            return;
        }

        // Verifica se o Pix já foi carregado.
        const pixJaCarregado = pixVendas[idVenda];

        if (itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda)) {
            return;
        }

        // Se não for recarregamento forçado e já tiver Pix, não busca novamente.
        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            return;
        }

        // Tenta aproveitar dados de Pix que já vieram dentro da compra.
        const pixDaCompra = normalizarPixVenda(compra);

        // Se a compra já contém Pix e não foi forçado, salva e encerra.
        if (!forcar && (pixDaCompra.qrcode || pixDaCompra.copiaCola)) {
            setPixVendas((estado) => ({ ...estado, [idVenda]: pixDaCompra }));
            return;
        }

        // Marca carregamento do Pix desta venda.
        setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: true }));
        // Limpa erro anterior desta venda.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta buscar o Pix da venda na API.
        try {
            // Faz a requisição do Pix da venda, incluindo a chave Pix se houver.
            const resposta = await fetch(`${API}/pix_venda/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte a resposta em JSON.
            const dados = await lerRespostaJson(resposta);

            // Trata resposta de erro da API.
            if (!resposta.ok) {
                setPixVendas((estado) => ({ ...estado, [idVenda]: null }));
                setErroPixVendas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponível para esta compra."
                }));
                return;
            }

            // Salva o Pix normalizado e uma versão para indicar atualização.
            setPixVendas((estado) => ({ ...estado, [idVenda]: { ...normalizarPixVenda(dados), versaoPix: Date.now() } }));
        } catch {
            // Mostra erro quando não foi possível buscar o Pix.
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível carregar o Pix agora."
            }));
        } finally {
            // Desliga o carregamento do Pix desta venda.
            setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixVendas]);

    // Busca as compras quando a página abre.
    useEffect(() => {
        carregarCompras();
    }, [carregarCompras]);

    // Depois de carregar compras, busca os Pix necessários para cada tipo de venda.
    useEffect(() => {
        // Percorre todas as compras carregadas.
        compras.forEach((compra) => {
            // Descobre o ID da venda atual.
            const idVenda = idVendaCompra(compra);

            // Para venda parcelada, carrega os Pix das parcelas se ainda não carregou.
            if (ehVendaParcelada(compra) && idVenda && !pixParcelas[idVenda]?.length && !carregandoPixParcelas[idVenda]) {
                carregarPixParcelas(idVenda);
            }

            // Para venda Pix à vista, carrega o Pix da compra se ainda não carregou.
            if (ehVendaPixAVista(compra) && idVenda && pixVendas[idVenda] === undefined && !carregandoPixVendas[idVenda]) {
                carregarPixVenda(compra);
            }
        });
    }, [carregarPixParcelas, carregarPixVenda, carregandoPixParcelas, carregandoPixVendas, compras, pixParcelas, pixVendas]);

    // Copia o Pix de uma venda à vista sem alterar o status do pagamento.
    async function copiarPixVenda(codigo, idVenda) {
        // Se não houver código Pix, não faz nada.
        if (!codigo) {
            return;
        }

        // Limpa erro anterior desta venda.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        // Limpa mensagem anterior desta venda.
        setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta copiar o código para a área de transferência.
        try {
            // Copia o código Pix.
            await navigator.clipboard.writeText(codigo);
            // Mostra mensagem de sucesso.
            setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "Pix copiado. Depois de pagar, clique em Confirmar pagamento." }));
        } catch {
            // Mostra erro se o navegador não permitir copiar automaticamente.
            setErroPixVendas((estado) => ({ ...estado, [idVenda]: "Não foi possível copiar o Pix automaticamente." }));
        }
    }
async function registrarReceitaVendaPix(idVenda, compra) {
    const chaveReceita = `venda-${idVenda}`;

    // Impede duplicação no localStorage
    if (itemExisteNoLocalStorage(receitasRegistradasLocalStorage, chaveReceita)) {
        return;
    }

    const descricaoReceita =
        `Receita automática - Venda #${idVenda} - ${nomeVeiculoCompra(compra)}`;

    const valorVenda = valorParaNumero(
        compra?.valor_recebido ??
        compra?.VALOR_RECEBIDO ??
        compra?.valor_venda ??
        compra?.VALOR_VENDA ??
        compra?.valor_total
    );

    if (!idVenda || !valorVenda) {
        throw new Error(
            "Pagamento confirmado, mas não foi possível montar a receita financeira."
        );
    }

    // VERIFICA SE JÁ EXISTE NO BANCO
    const receitasExistentes = await buscarIdsReceitasFinanceiras(API, {
        descricaoReceita,
        idVenda,
        valor: valorVenda
    });

    // Se já existir, salva no localStorage e NÃO cria novamente
    if (receitasExistentes.length > 0) {
        salvarValorObjetoLocalStorage(
            receitasFinanceiroIdsLocalStorage,
            chaveReceita,
            receitasExistentes[0]
        );

        salvarItemLocalStorage(
            receitasRegistradasLocalStorage,
            chaveReceita
        );

        return;
    }

    // CADASTRA SOMENTE SE NÃO EXISTIR
    const resposta = await fetch(`${API}/cadastro_financeiro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...cabecalhoAutorizacao()
        },
        credentials: "include",
        body: JSON.stringify({
            tipo: "entrada",
            id_veiculo: idVeiculoCompra(compra) || null,
            data: dataAtualParaApi(),
            descricao: descricaoReceita,
            valor: valorVenda
        })
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok && resposta.status !== 409) {
        throw new Error(
            dados.erro ||
            dados.mensagem ||
            "Pagamento confirmado, mas a receita não foi registrada."
        );
    }

    const idFinanceiro =
        idFinanceiroResposta(dados) ||
        (await buscarIdsReceitasFinanceiras(API, {
            descricaoReceita,
            idVenda,
            valor: valorVenda
        }))[0];

    salvarValorObjetoLocalStorage(
        receitasFinanceiroIdsLocalStorage,
        chaveReceita,
        idFinanceiro
    );

    salvarItemLocalStorage(
        receitasRegistradasLocalStorage,
        chaveReceita
    );
}

    async function confirmarPagamentoPixVenda(idVenda, compra) {
        if (!idVenda) {
            return;
        }

        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        setPagandoPixVendas((estado) => ({ ...estado, [idVenda]: true }));

        try {
            let statusAtualizado = true;

            try {
                await confirmarStatusPagamentoVenda(API, idVenda);
            } catch {
                statusAtualizado = false;
            }

            await registrarReceitaVendaPix(idVenda, compra);
            removerItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            salvarItemLocalStorage(comprasPagasLocalStorage, idVenda);
            setCompras((estado) => estado.map((item) => (
                String(idVendaCompra(item)) === String(idVenda)
                    ? { ...item, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                    : item
            )));
            setMensagemPixVendas((estado) => ({
                ...estado,
                [idVenda]: statusAtualizado
                    ? "Pagamento confirmado e receita registrada."
                    : "Pagamento confirmado nesta tela e receita registrada. A API de status não respondeu."
            }));
        } catch (erroAtual) {
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível confirmar o pagamento."
            }));
        } finally {
            setPagandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    async function cancelarPagamentoPixVenda(idVenda, compra) {
        if (!idVenda) {
            return;
        }

        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            await excluirReceitaFinanceira(API, `venda-${idVenda}`, {
                descricaoReceita: `Receita automática - Venda #${idVenda} - ${nomeVeiculoCompra(compra)}`,
                idVenda,
                valor: valorParaNumero(compra?.valor_recebido ?? compra?.VALOR_RECEBIDO ?? compra?.valor_venda ?? compra?.VALOR_VENDA ?? compra?.valor_total)
            });
            removerItemLocalStorage(comprasPagasLocalStorage, idVenda);
            salvarItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            setCompras((estado) => estado.map((item) => (
                String(idVendaCompra(item)) === String(idVenda)
                    ? { ...item, status_pagamento: 1, STATUS_PAGAMENTO: 1 }
                    : item
            )));
            setMensagemPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Pagamento Pix cancelado. A receita foi removida do financeiro."
            }));
        } catch (erroAtual) {
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível cancelar o pagamento no financeiro."
            }));
        }
    }

    async function cancelarPagamentoPixParcela(idVenda, parcela, compra) {
        const chaveParcela = parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`;

        if (!idVenda || !chaveParcela) {
            return;
        }

        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            const numeroParcela = parcela?.numero || "-";
            const descricaoReceita = `Receita automática - Venda #${idVenda} - Parcela ${numeroParcela} - ${nomeVeiculoCompra(compra)}`;

            await excluirReceitaFinanceira(API, `parcela-${chaveParcela}`, {
                descricaoReceita,
                idVenda,
                valor: parcela?.valor
            });
            removerItemLocalStorage(parcelasPagasLocalStorage, chaveParcela);
            removerItemLocalStorage(comprasPagasLocalStorage, idVenda);
            salvarItemLocalStorage(parcelasCanceladasLocalStorage, chaveParcela);
            salvarItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id || item.numero) === String(parcela?.id || parcela?.numero)
                        ? { ...item, situacao: 0 }
                        : item
                ))
            }));
            setCompras((estado) => estado.map((compraAtual) => (
                String(idVendaCompra(compraAtual)) === String(idVenda)
                    ? { ...compraAtual, status_pagamento: 1, STATUS_PAGAMENTO: 1 }
                    : compraAtual
            )));
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Pagamento da parcela cancelado. A receita foi removida do financeiro."
            }));
        } catch (erroAtual) {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível cancelar a parcela no financeiro."
            }));
        }
    }

    async function registrarReceitaParcela(idVenda, parcela, compra) {
        const chaveReceita = `parcela-${parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`}`;

        if (itemExisteNoLocalStorage(receitasRegistradasLocalStorage, chaveReceita)) {
            return;
        }

        const valorParcela = valorParaNumero(parcela?.valor);

        if (!idVenda || !valorParcela) {
            throw new Error("Parcela paga, mas não foi possível montar a receita financeira.");
        }

        const numeroParcela = parcela?.numero || "-";
        const veiculo = nomeVeiculoCompra(compra);
        const descricaoReceita = `Receita automática - Venda #${idVenda} - Parcela ${numeroParcela} - ${veiculo}`;
        const resposta = await fetch(`${API}/cadastro_financeiro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...cabecalhoAutorizacao()
            },
            credentials: "include",
            body: JSON.stringify({
                tipo: "entrada",
                id_veiculo: idVeiculoCompra(compra) || null,
                data: dataAtualParaApi(),
                descricao: descricaoReceita,
                valor: valorParcela
            })
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok && resposta.status !== 409) {
            throw new Error(dados.erro || dados.mensagem || "Parcela paga, mas a receita não foi registrada no financeiro.");
        }

        const idFinanceiro = idFinanceiroResposta(dados) || (await buscarIdsReceitasFinanceiras(API, {
            descricaoReceita,
            idVenda,
            valor: valorParcela
        }))[0];
        salvarValorObjetoLocalStorage(receitasFinanceiroIdsLocalStorage, chaveReceita, idFinanceiro);
        salvarItemLocalStorage(receitasRegistradasLocalStorage, chaveReceita);
        return dados;
    }

    async function copiarPixParcela(codigo, idVenda) {
        if (!codigo) {
            return;
        }

        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            await navigator.clipboard.writeText(codigo);
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Pix copiado. Depois de pagar, clique em Confirmar pagamento."
            }));
        } catch {
            setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "Não foi possível copiar o Pix automaticamente." }));
        }
    }

    // Confirma o pagamento Pix de uma parcela e tenta marcar a parcela como paga.
    async function confirmarPagamentoPixParcela(idVenda, parcela, compra) {
        // Cria uma chave única para controlar o botão desta parcela.
        const chave = chaveParcelaPix(idVenda, parcela);
        // Limpa erro anterior das parcelas desta venda.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Limpa mensagem anterior das parcelas desta venda.
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Marca esta parcela como em processamento.
        setPagandoPixParcelas((estado) => ({ ...estado, [chave]: true }));

        // Tenta atualizar a parcela.
        try {
            // Se a parcela não tem ID ou já está paga, apenas informa.
            if (!parcela?.id || parcelaEstaPaga(parcela)) {
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Esta parcela já está paga."
                }));
                return;
            }

            // Chama a API para marcar a parcela como paga.
            const resposta = await fetch(`${API}/pagar_parcela_pix/${parcela.id}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte a resposta para JSON.
            const dados = await lerRespostaJson(resposta);

            // Se a API retornou erro, dispara exceção.
            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Não foi possível marcar a parcela como paga.");
            }

            if (!pagamentoRegistrouReceita(dados)) {
                await registrarReceitaParcela(idVenda, parcela, compra);
            }

            removerItemLocalStorage(parcelasCanceladasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`);
            removerItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            salvarItemLocalStorage(parcelasPagasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`);

            // Atualiza a situação da parcela no estado local.
            const parcelasAtualizadas = (pixParcelas[idVenda] || []).map((item) => (
                String(item.id) === String(parcela.id)
                    ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                    : item
            ));
            const compraQuitadaLocalmente = parcelasAtualizadas.length > 0 && parcelasAtualizadas.every(parcelaEstaPaga);

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id) === String(parcela.id)
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        : item
                ))
            }));

            // Se a API informou que a compra foi quitada, marca a compra como paga.
            if (dados.compra_quitada || compraQuitadaLocalmente) {
                salvarItemLocalStorage(comprasPagasLocalStorage, idVenda);

                try {
                    await confirmarStatusPagamentoVenda(API, idVenda);
                } catch {
                    // A compra fica paga localmente mesmo quando a API de status nao existe.
                }

                setCompras((estado) => estado.map((compra) => (
                    String(idVendaCompra(compra)) === String(idVenda)
                        ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                        : compra
                )));
            }

            // Mostra mensagem de sucesso conforme a compra esteja quitada ou não.
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: dados.compra_quitada || compraQuitadaLocalmente
                    ? "Todas as parcelas foram pagas. Compra quitada e receita registrada."
                    : "Parcela marcada como paga e receita registrada."
            }));
        } catch (erroAtual) {
            // Mostra erro caso copiar ou marcar a parcela falhe.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            // Libera o botão da parcela.
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    // Escolhe a classe CSS do status de pagamento.
    function classeStatusPagamento(valor) {
        return textoStatusPagamento(valor) === "Pago" ? css.compra_pago : css.compra_andamento;
    }

    function alternarCompra(idVenda, pagamentoConcluido) {
        if (!idVenda || pagamentoConcluido) {
            return;
        }

        setCompraAbertaId((idAtual) => String(idAtual) === String(idVenda) ? "" : String(idVenda));
    }

    function compraEstaPagaExibicao(compra) {
        const idVenda = idVendaCompra(compra);
        const parcelas = idVenda ? pixParcelas[idVenda] || [] : [];

        if (idVenda && itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda)) {
            return false;
        }

        return textoStatusPagamento(compra.status_pagamento ?? compra.STATUS_PAGAMENTO) === "Pago" ||
            itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda) ||
            (ehVendaParcelada(compra) && parcelas.length > 0 && parcelas.every(parcelaEstaPaga));
    }

    // Renderiza a tela de minhas compras.
    return (
        // Container principal da página.
        <main className={css.pagina}>
            {/* Cabeçalho com título da página. */}
            <header className={css.cabecalho}>
                <div>
                    <span>Área do cliente</span>
                    <h1>Minhas compras</h1>
                </div>
            </header>

            {/* Cards de resumo das compras. */}
            <section className={css.resumo}>
                <article>
                    <span>Total de compras</span>
                    <strong>{compras.length}</strong>
                </article>
                <article>
                    <span>Pagas</span>
                    <strong>{compras.filter(compraEstaPagaExibicao).length}</strong>
                </article>
                <article>
                    <span>Em andamento</span>
                    <strong>{compras.filter((compra) => !compraEstaPagaExibicao(compra)).length}</strong>
                </article>
            </section>

            {/* Estado exibido durante carregamento. */}
            {carregando && (
                <div className={css.estado}>Carregando suas compras...</div>
            )}

            {/* Estado exibido quando ocorreu erro ao carregar compras. */}
            {!carregando && erro && (
                <div className={css.estado}>
                    <strong>Não foi possível carregar suas compras agora.</strong>
                    <span>{erro}</span>
                </div>
            )}

            {/* Estado vazio quando o usuário ainda não possui compras. */}
            {!carregando && !erro && compras.length === 0 && (
                <div className={css.estado}>
                    <strong>Você ainda não possui compras registradas.</strong>
                    <span>Quando uma venda for cadastrada no seu nome, ela aparecerá aqui.</span>
                </div>
            )}

            {/* Lista de compras quando existem dados carregados. */}
            {!carregando && !erro && compras.length > 0 && (
                <section className={css.lista_compras}>
                    {/* Cria um card para cada compra. */}
                    {compras.map((compra) => {
                        // Guarda o ID da venda.
                        const idVenda = idVendaCompra(compra);
                        // Guarda o ID do veículo.
                        const idVeiculo = idVeiculoCompra(compra);
                        // Monta a URL do comprovante, se houver.
                        const comprovante = comprovanteCompra(compra);
                        // Lê a quantidade de parcelas da compra.
                        const parcelas = compra.quantidade_parcelas || compra.parcelas || compra.QUANTIDADE_PARCELAS;
                        // Lê o valor total da venda.
                        const valor = compra.valor_venda || compra.valor_total || compra.VALOR_VENDA;
                        // Lê o valor recebido da venda.
                        const recebido = compra.valor_recebido || compra.VALOR_RECEBIDO;
                        // Define se esta compra é parcelada.
                        const vendaParcelada = ehVendaParcelada(compra);
                        // Define se esta compra é Pix à vista.
                        const vendaPixAVista = ehVendaPixAVista(compra);
                        // Busca as parcelas Pix já carregadas para esta venda.
                        const parcelasComPix = pixParcelas[idVenda] || [];
                        // Lê o carregamento de Pix das parcelas desta venda.
                        const carregandoPix = carregandoPixParcelas[idVenda];
                        // Lê erro de Pix das parcelas desta venda.
                        const erroPix = erroPixParcelas[idVenda];
                        // Lê mensagem de sucesso de Pix das parcelas desta venda.
                        const mensagemPix = mensagemPixParcelas[idVenda];
                        // Lê o Pix da venda à vista, se houver.
                        const pixVenda = pixVendas[idVenda] || null;
                        // Lê carregamento do Pix da venda à vista.
                        const carregandoPixVenda = carregandoPixVendas[idVenda];
                        const pagandoPixVenda = Boolean(pagandoPixVendas[idVenda]);
                        // Lê erro do Pix da venda à vista.
                        const erroPixVenda = erroPixVendas[idVenda];
                        // Lê mensagem do Pix da venda à vista.
                        const mensagemPixVenda = mensagemPixVendas[idVenda];
                        const compraCanceladaLocalmente = itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda);
                        const compraPagaLocalmente = itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda) && !compraCanceladaLocalmente;
                        const temParcelaPagaLocalmente = parcelasComPix.some((parcela) => (
                            itemExisteNoLocalStorage(parcelasPagasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`) &&
                            !itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`)
                        ));
                        // Verifica se todas as parcelas foram pagas.
                        const compraQuitadaParcelas = vendaParcelada && parcelasComPix.length > 0 && parcelasComPix.every(parcelaEstaPaga);
                        // Se todas as parcelas estão pagas ou a compra foi confirmada localmente, considera a compra paga.
                        const compraPaga = compraEstaPagaExibicao(compra);
                        const statusPagamentoCompra = compraCanceladaLocalmente ? 1 : compraPaga ? 0 : (compra.status_pagamento ?? compra.STATUS_PAGAMENTO);
                        // Compra concluída não abre detalhes de pagamento.
                        const pagamentoConcluido = textoStatusPagamento(statusPagamentoCompra) === "Pago";
                        // Exibe Pix ou parcelas apenas na compra clicada.
                        const compraAberta = String(compraAbertaId) === String(idVenda);
                        // Mostra detalhes somente quando a compra ainda não foi concluída.
                        const podeAbrirPagamento = !pagamentoConcluido || compraPagaLocalmente || temParcelaPagaLocalmente;
                        const mostrarDetalhesPagamento = compraAberta && podeAbrirPagamento;
                        // Recupera o índice salvo da parcela selecionada.
                        const indiceSalvoPix = Number(parcelaPixSelecionada[idVenda] ?? 0);
                        // Garante que o índice selecionado fique dentro do tamanho da lista.
                        const indiceParcelaPix = Number.isFinite(indiceSalvoPix)
                            ? Math.min(Math.max(indiceSalvoPix, 0), Math.max(parcelasComPix.length - 1, 0))
                            : 0;
                        // Seleciona a parcela Pix atual.
                        const parcelaPixAtual = parcelasComPix[indiceParcelaPix];
                        const chaveParcelaAtual = parcelaPixAtual?.id || `${idVenda}-${parcelaPixAtual?.numero || "sem-numero"}`;
                        const parcelaAtualCanceladaLocalmente = itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, chaveParcelaAtual);
                        const parcelaAtualPagaLocalmente = itemExisteNoLocalStorage(
                            parcelasPagasLocalStorage,
                            chaveParcelaAtual
                        ) && !parcelaAtualCanceladaLocalmente;
                        // Cria a chave da parcela atual.
                        const chavePixAtual = chaveParcelaPix(idVenda, parcelaPixAtual);
                        // Verifica se a parcela atual está em processamento.
                        const pagandoPixAtual = Boolean(pagandoPixParcelas[chavePixAtual]);

                        // Retorna o card da compra.
                        return (
                            <article
                                key={idVenda || `${nomeVeiculoCompra(compra)}-${compra.data_venda}`}
                                className={`${css.card_compra} ${vendaParcelada ? css.card_compra_parcelada : ""} ${podeAbrirPagamento ? css.card_compra_clicavel : ""}`}
                                onClick={() => alternarCompra(idVenda, !podeAbrirPagamento)}
                                role={podeAbrirPagamento ? "button" : undefined}
                                tabIndex={podeAbrirPagamento ? 0 : undefined}
                                onKeyDown={(evento) => {
                                    if (evento.key === "Enter" || evento.key === " ") {
                                        evento.preventDefault();
                                        alternarCompra(idVenda, !podeAbrirPagamento);
                                    }
                                }}
                            >
                                {/* Topo do card com nome do veículo e status. */}
                                <div className={css.topo_compra}>
                                    <div>
                                        <span>Veículo</span>
                                        <h2>{nomeVeiculoCompra(compra)}</h2>
                                    </div>
                                    <strong className={`${css.status_compra} ${classeStatusPagamento(statusPagamentoCompra)}`}>
                                        {textoStatusPagamento(statusPagamentoCompra)}
                                    </strong>
                                </div>

                                {/* Dados principais da compra. */}
                                <div className={css.grade_compra}>
                                    <p><strong>Data:</strong> {formatarData(compra.data_venda ?? compra.DATA_VENDA)}</p>
                                    <p><strong>Pagamento:</strong> {textoFormaPagamento(compra.forma_pagamento ?? compra.FORMA_PAGAMENTO)}</p>
                                    <p><strong>Valor:</strong> {formatarMoeda(valor)}</p>
                                    <p><strong>Recebido:</strong> {formatarMoeda(recebido)}</p>
                                    <p><strong>Parcelas:</strong> {parcelas || "À vista"}</p>
                                </div>

                                {/* Ações gerais da compra. */}
                                <div className={css.acoes_compra} onClick={(evento) => evento.stopPropagation()}>
                                    {podeAbrirPagamento && (
                                        <button type="button" onClick={() => alternarCompra(idVenda, !podeAbrirPagamento)}>
                                            {compraAberta ? "Ocultar pagamento" : "Ver pagamento"}
                                        </button>
                                    )}
                                    {/* Botão para abrir detalhes do veículo. */}
                                    {idVeiculo && (
                                        <button type="button" onClick={() => navigate(`/detalhesVeiculos/${idVeiculo}`)}>
                                            Ver veículo
                                        </button>
                                    )}
                                    {/* Link para abrir o comprovante em nova aba. */}
                                    {comprovante && (
                                        <a href={comprovante} target="_blank" rel="noreferrer">
                                            Ver comprovante
                                        </a>
                                    )}
                                </div>

                                {/* Mensagem de compra parcelada totalmente quitada. */}
                                {vendaParcelada && idVenda && compraQuitadaParcelas && compraAberta && (
                                    <div className={css.area_pix_parcelas}>
                                        <p className={css.sucesso_pix_parcelas}>
                                            Compra paga por completo. Todas as parcelas foram quitadas.
                                        </p>
                                    </div>
                                )}

                                {/* Área de Pix para compras à vista. */}
                                {vendaPixAVista && idVenda && mostrarDetalhesPagamento && (
                                    <div className={css.area_pix_parcelas} onClick={(evento) => evento.stopPropagation()}>
                                        <div className={css.topo_pix_parcelas}>
                                            <div>
                                                <span>Pagamento à vista</span>
                                                <h3>Pix da compra</h3>
                                            </div>
                                        </div>

                                        {/* Mensagens do Pix da venda à vista. */}
                                        {erroPixVenda && <p className={css.erro_pix_parcelas}>{erroPixVenda}</p>}
                                        {mensagemPixVenda && <p className={css.sucesso_pix_parcelas}>{mensagemPixVenda}</p>}

                                        {/* Estado de carregamento do Pix da compra. */}
                                        {carregandoPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Carregando Pix da compra...</p>
                                        )}

                                        {/* Estado vazio quando o Pix da compra não está disponível. */}
                                        {!carregandoPixVenda && !erroPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Pix da compra indisponível.</p>
                                        )}

                                        {/* Conteúdo do Pix da venda à vista. */}
                                        {pixVenda && (
                                            <div className={css.pix_conteudo_unico}>
                                                <div className={css.pix_qrcode_area}>
                                                    {pixVenda.qrcode ? (
                                                        <img src={montarUrlArquivo(pixVenda.qrcode)} alt={`QR Code Pix da compra ${idVenda || ""}`} />
                                                    ) : (
                                                        <span>QR Code indisponível</span>
                                                    )}
                                                </div>

                                                <label className={css.pix_copia_cola}>
                                                    <span>Pix cópia e cola</span>
                                                    <textarea value={pixVenda.copiaCola || ""} readOnly />
                                                    <div className={css.acoes_pix_parcela}>
                                                        <button type="button" onClick={() => copiarPixVenda(pixVenda.copiaCola, idVenda)}>
                                                            Copiar Pix
                                                        </button>
                                                        {!compraPagaLocalmente && (
                                                            <button
                                                                type="button"
                                                                onClick={() => confirmarPagamentoPixVenda(idVenda, compra)}
                                                                disabled={pagandoPixVenda || compraPaga}
                                                            >
                                                                {pagandoPixVenda ? "Confirmando..." : "Confirmar pagamento"}
                                                            </button>
                                                        )}
                                                        {compraPagaLocalmente && (
                                                            <button
                                                                type="button"
                                                                className={css.botao_cancelar_pix}
                                                                onClick={() => cancelarPagamentoPixVenda(idVenda, compra)}
                                                                disabled={pagandoPixVenda}
                                                            >
                                                                Cancelar pagamento
                                                            </button>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Área de Pix para compras parceladas ainda não quitadas. */}
                                {vendaParcelada && idVenda && mostrarDetalhesPagamento && (
                                    <div className={css.area_pix_parcelas} onClick={(evento) => evento.stopPropagation()}>
                                        <div className={css.topo_pix_parcelas}>
                                            <div>
                                                <span>Pagamento parcelado</span>
                                                <h3>Pix das parcelas</h3>
                                            </div>
                                        </div>

                                        {/* Mensagens do Pix das parcelas. */}
                                        {erroPix && <p className={css.erro_pix_parcelas}>{erroPix}</p>}
                                        {mensagemPix && <p className={css.sucesso_pix_parcelas}>{mensagemPix}</p>}

                                        {/* Estado de carregamento das parcelas Pix. */}
                                        {carregandoPix && parcelasComPix.length === 0 && (
                                            <p className={css.estado_pix_parcelas}>Carregando Pix das parcelas...</p>
                                        )}

                                        {/* Estado vazio quando não há Pix de parcelas. */}
                                        {!carregandoPix && !erroPix && parcelasComPix.length === 0 && (
                                            <p className={css.estado_pix_parcelas}>Nenhum Pix de parcela encontrado para esta venda.</p>
                                        )}

                                        {/* Conteúdo da parcela Pix selecionada. */}
                                        {parcelasComPix.length > 0 && parcelaPixAtual && (
                                            <div className={css.pix_parcela_unica}>
                                                <label className={css.seletor_pix_parcela} htmlFor={`pix-parcela-${idVenda}`}>
                                                    <span>Escolha a parcela</span>
                                                    <select
                                                        id={`pix-parcela-${idVenda}`}
                                                        value={indiceParcelaPix}
                                                        onChange={(evento) => setParcelaPixSelecionada((estado) => ({
                                                            ...estado,
                                                            [idVenda]: Number(evento.target.value)
                                                        }))}
                                                    >
                                                        {parcelasComPix.map((parcela, indice) => (
                                                            <option key={parcela.id || parcela.numero || indice} value={indice}>
                                                                Parcela {parcela.numero || indice + 1} - {formatarMoeda(parcela.valor)} - vence em {parcela.vencimento || "-"}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>

                                                {/* Resumo da parcela selecionada. */}
                                                <div className={css.pix_resumo_parcela}>
                                                    <div>
                                                        <span>Parcela {parcelaPixAtual.numero || "-"}</span>
                                                        <strong>{formatarMoeda(parcelaPixAtual.valor)}</strong>
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

                                                {/* QR Code e código copia e cola da parcela. */}
                                                <div className={css.pix_conteudo_unico}>
                                                    <div className={css.pix_qrcode_area}>
                                                        {parcelaPixAtual.qrcode ? (
                                                            <img src={montarUrlArquivo(parcelaPixAtual.qrcode)} alt={`QR Code Pix da parcela ${parcelaPixAtual.numero || ""}`} />
                                                        ) : (
                                                            <span>QR Code indisponível</span>
                                                        )}
                                                    </div>

                                                    <label className={css.pix_copia_cola}>
                                                        <span>Pix cópia e cola</span>
                                                        <textarea value={parcelaPixAtual.copiaCola || ""} readOnly />
                                                        <div className={css.acoes_pix_parcela}>
                                                            <button
                                                                type="button"
                                                                onClick={() => copiarPixParcela(parcelaPixAtual.copiaCola, idVenda)}
                                                                disabled={pagandoPixAtual}
                                                            >
                                                                Copiar Pix
                                                            </button>
                                                            {!parcelaEstaPaga(parcelaPixAtual) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmarPagamentoPixParcela(idVenda, parcelaPixAtual, compra)}
                                                                    disabled={pagandoPixAtual}
                                                                >
                                                                    {pagandoPixAtual ? "Confirmando..." : "Confirmar pagamento"}
                                                                </button>
                                                            )}
                                                            {parcelaEstaPaga(parcelaPixAtual) && !parcelaAtualPagaLocalmente && (
                                                                <button type="button" disabled>
                                                                    Pago
                                                                </button>
                                                            )}
                                                            {parcelaAtualPagaLocalmente && (
                                                                <button
                                                                    type="button"
                                                                    className={css.botao_cancelar_pix}
                                                                    onClick={() => cancelarPagamentoPixParcela(idVenda, parcelaPixAtual, compra)}
                                                                    disabled={pagandoPixAtual}
                                                                >
                                                                    Cancelar pagamento
                                                                </button>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

// Exporta a página para ser usada nas rotas da aplicação.
export default MinhasCompras;
