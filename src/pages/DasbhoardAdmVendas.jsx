// Importa recursos de react.
import { useEffect, useMemo, useState } from "react";
// Importa recursos de react-router-dom.
import { useNavigate } from "react-router-dom";
// Importa recursos de ./DasbhoardAdmVendas.module.css.
import css from "./DasbhoardAdmVendas.module.css";

// Declara filtrosPeriodo para uso neste fluxo.
const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
// Declara filtrosStatus para uso neste fluxo.
const filtrosStatus = ["Status", "Pago", "Pendente"];
// Declara filtrosPagamento para uso neste fluxo.
const filtrosPagamento = ["Forma de Pagamento", "Pix", "Parcelado",];

// Declara a função cabecalhoAutorizacao usada por esta página.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Declara a função idUsuario usada por esta página.
function idUsuario(usuario) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return usuario?.id_usuario || usuario?.ID_USUARIO || usuario?.id || usuario?.ID;
}

// Declara a função nomeUsuario usada por esta página.
function nomeUsuario(usuario) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return usuario?.nome || usuario?.NOME || usuario?.email || usuario?.EMAIL || `Cliente ${idUsuario(usuario) || "-"}`;
}

// Declara a função extrairListaUsuarios usada por esta página.
function extrairListaUsuarios(dados) {
    // Declara lista para uso neste fluxo.
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    // Declara clientes para uso neste fluxo.
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) === 0);

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return clientes.length > 0 ? clientes : lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) !== 2);
}

// Declara a função textoFormaPagamento usada por esta página.
function textoFormaPagamento(valor) {
    // Declara forma para uso neste fluxo.
    const forma = String(valor ?? "").trim().toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (forma === "0" || forma.includes("pix")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Pix";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (forma === "1" || forma.includes("parcel")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Parcelado";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return valor || "Não informado";
}

// Declara a função textoStatusPagamento usada por esta página.
function textoStatusPagamento(valor) {
    // Declara status para uso neste fluxo.
    const status = String(valor ?? "").trim().toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "0" || status.includes("pago")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Pago";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Pendente";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return valor || "Não informado";
}

// Declara a função formatarData usada por esta página.
function formatarData(valor) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "-";
    }

    // Declara texto para uso neste fluxo.
    const texto = String(valor);
    // Declara dataIso para uso neste fluxo.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataIso) {
        // Declara os dados usados neste fluxo.
        const [, ano, mes, dia, hora, minuto] = dataIso;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return hora && minuto ? `${dia}/${mes}/${ano} ${hora}:${minuto}` : `${dia}/${mes}/${ano}`;
    }

    // Declara data para uso neste fluxo.
    const data = new Date(valor);

    // Verifica esta condição antes de continuar o fluxo.
    if (Number.isNaN(data.getTime())) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return texto;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Declara a função formatarMoeda usada por esta página.
function formatarMoeda(valor) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Declara a função montarUrlPix usada por esta página.
function montarUrlPix(API, caminhoPix) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!caminhoPix) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Declara caminho para uso neste fluxo.
    const caminho = String(caminhoPix);

    // Verifica esta condição antes de continuar o fluxo.
    if (caminho.startsWith("http") || caminho.startsWith("data:")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return caminho;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (caminho.startsWith("/")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${API}${caminho}`;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return `${API}/${caminho}`;
}

// Declara a função montarUrlPixAtualizada usada por esta página.
function montarUrlPixAtualizada(API, caminhoPix, versao) {
    // Declara url para uso neste fluxo.
    const url = montarUrlPix(API, caminhoPix);

    // Verifica esta condição antes de continuar o fluxo.
    if (!url || !versao || url.startsWith("data:")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return url;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(versao)}`;
}

// Declara a função parametroChavePixAtual usada por esta página.
function parametroChavePixAtual() {
    // Declara chavePix para uso neste fluxo.
    const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
}

// Declara a função normalizarParcelaPix usada por esta página.
function normalizarParcelaPix(parcela) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
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

// Declara a função normalizarPixVenda usada por esta página.
function normalizarPixVenda(dados) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {
        qrcode: dados?.pix_qrcode ?? dados?.PIX_QRCODE ?? dados?.qrcode ?? dados?.qr_code ?? dados?.imagem_pix ?? dados?.imagem,
        copiaCola: dados?.pix_copia_cola ?? dados?.PIX_COPIA_COLA ?? dados?.pix_copia_e_cola ?? dados?.copia_cola ?? dados?.payload ?? dados?.pix_payload,
        valor: dados?.valor ?? dados?.valor_recebido ?? dados?.VALOR_RECEBIDO ?? dados?.valor_venda ?? dados?.VALOR_VENDA
    };
}

// Declara a função parcelaEstaPaga usada por esta página.
function parcelaEstaPaga(parcela) {
    // Declara situacao para uso neste fluxo.
    const situacao = String(parcela?.situacao ?? "").trim().toLowerCase();
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return situacao === "1" || situacao === "pago" || situacao === "paga" || situacao.includes("pago") || situacao.includes("paga");
}

// Declara a função textoSituacaoParcela usada por esta página.
function textoSituacaoParcela(parcela) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
}

// Declara a função dataAtualParaApi usada por esta página.
function dataAtualParaApi() {
    // Declara hoje para uso neste fluxo.
    const hoje = new Date();
    // Declara ano para uso neste fluxo.
    const ano = hoje.getFullYear();
    // Declara mes para uso neste fluxo.
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    // Declara dia para uso neste fluxo.
    const dia = String(hoje.getDate()).padStart(2, "0");

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return `${ano}-${mes}-${dia}`;
}

// Declara a função valorParaNumero usada por esta página.
function valorParaNumero(valor) {
    // Declara texto para uso neste fluxo.
    const texto = String(valor ?? "").trim();

    // Verifica esta condição antes de continuar o fluxo.
    if (!texto) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return 0;
    }

    // Declara normalizado para uso neste fluxo.
    const normalizado = texto.includes(",")
        ? texto.replace(/\./g, "").replace(",", ".")
        : texto;

    // Declara numero para uso neste fluxo.
    const numero = Number(normalizado);
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return Number.isFinite(numero) ? numero : 0;
}

// Declara a função transacaoPareceFinanceira usada por esta página.
function transacaoPareceFinanceira(transacao) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!transacao || typeof transacao !== "object") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return false;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
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

// Declara a função pagamentoRegistrouReceita usada por esta página.
function pagamentoRegistrouReceita(dados) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
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

// Declara a função lerRespostaJson usada por esta página.
async function lerRespostaJson(resposta) {
    // Declara texto para uso neste fluxo.
    const texto = await resposta.text();

    // Verifica esta condição antes de continuar o fluxo.
    if (!texto) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }

    // Tenta executar a operação e permite tratar possíveis falhas.
    try {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return JSON.parse(texto);
    } catch {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }
}

// Declara a função confirmarStatusPagamentoVenda usada por esta página.
async function confirmarStatusPagamentoVenda(API, idVenda) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!idVenda) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }

    // Declara body para uso neste fluxo.
    const body = JSON.stringify({
        status_pagamento: 0,
        STATUS_PAGAMENTO: 0,
        status: 0
    });
    // Declara rotas para uso neste fluxo.
    const rotas = [
        { metodo: "POST", url: `${API}/confirmar_pagamento_pix_venda/${idVenda}` },
        { metodo: "POST", url: `${API}/pagar_venda_pix/${idVenda}` },
        { metodo: "POST", url: `${API}/confirmar_pagamento_venda/${idVenda}` },
        { metodo: "PUT", url: `${API}/atualizar_status_pagamento_venda/${idVenda}` },
        { metodo: "PUT", url: `${API}/editar_venda/${idVenda}` }
    ];

    // Percorre os itens necessários para executar esta etapa.
    for (const rota of rotas) {
        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(rota.url, {
                method: rota.metodo,
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutorizacao()
                },
                credentials: "include",
                body
            });
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (resposta.ok) {
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return dados;
            }
        } catch {
            // Continua tentando as rotas alternativas conhecidas.
        }
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {};
}

// Declara a função textoMinusculo usada por esta página.
function textoMinusculo(valor) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return String(valor || "").toLowerCase();
}

// Declara a função normalizarVendaUsuario usada por esta página.
function normalizarVendaUsuario(venda) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {
        id: venda.id_venda || venda.ID_VENDA,
        idVeiculo: venda.id_veiculo || venda.ID_VEICULO || venda.id_carro || venda.ID_CARRO,
        data: formatarData(venda.data_venda || venda.DATA_VENDA),
        cliente: venda.nome_cliente || venda.cliente || venda.nome_usuario || `Cliente ${venda.id_usuario || venda.ID_USUARIO || "-"}`,
        veiculo: venda.veiculo || venda.nome_veiculo || venda.modelo || `Veículo ${venda.id_veiculo || venda.ID_VEICULO || "-"}`,
        pagamento: textoFormaPagamento(venda.forma_pagamento_texto ?? venda.forma_pagamento ?? venda.FORMA_PAGAMENTO),
        status: textoStatusPagamento(venda.status_pagamento_texto ?? venda.status_pagamento ?? venda.STATUS_PAGAMENTO),
        valorVenda: venda.valor_venda ?? venda.VALOR_VENDA ?? 0,
        valorRecebido: venda.valor_recebido ?? venda.VALOR_RECEBIDO ?? 0,
        desconto: venda.desconto ?? venda.DESCONTOS ?? 0,
        parcelas: venda.quantidade_parcelas || venda.QUANTIDADE_PARCELAS || "",
        pixVenda: normalizarPixVenda(venda),
        comentarios: venda.comentarios || venda.COMENTARIOS || ""
    };
}

// Declara a função DasbhoardAdmVendas usada por esta página.
function DasbhoardAdmVendas({ API }) {
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();
    // Declara os dados usados neste fluxo.
    const [vendas, setVendas] = useState([]);
    // Declara os dados usados neste fluxo.
    const [carregando, setCarregando] = useState(true);
    // Declara os dados usados neste fluxo.
    const [erro, setErro] = useState("");
    // Declara os dados usados neste fluxo.
    const [busca, setBusca] = useState("");
    // Declara os dados usados neste fluxo.
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    // Declara os dados usados neste fluxo.
    const [status, setStatus] = useState(filtrosStatus[0]);
    // Declara os dados usados neste fluxo.
    const [pagamento, setPagamento] = useState(filtrosPagamento[0]);
    // Declara os dados usados neste fluxo.
    const [vendaDetalhe, setVendaDetalhe] = useState(null);
    // Declara os dados usados neste fluxo.
    const [pixParcelas, setPixParcelas] = useState({});
    // Declara os dados usados neste fluxo.
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    // Declara os dados usados neste fluxo.
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    // Declara os dados usados neste fluxo.
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    // Declara os dados usados neste fluxo.
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    // Declara os dados usados neste fluxo.
    const [pixVendas, setPixVendas] = useState({});
    // Declara os dados usados neste fluxo.
    const [carregandoPixVendas, setCarregandoPixVendas] = useState({});
    // Declara os dados usados neste fluxo.
    const [erroPixVendas, setErroPixVendas] = useState({});
    // Declara os dados usados neste fluxo.
    const [pixPagamentoDetalhe, setPixPagamentoDetalhe] = useState(null);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Declara a função carregarVendas usada por esta página.
        async function carregarVendas() {
            // Atualiza o estado por meio de setCarregando.
            setCarregando(true);
            // Atualiza o estado por meio de setErro.
            setErro("");

            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Declara resposta para uso neste fluxo.
                const resposta = await fetch(`${API}/listar_usuario`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                // Declara dados para uso neste fluxo.
                const dados = await resposta.json();

                // Verifica esta condição antes de continuar o fluxo.
                if (!resposta.ok) {
                    // Atualiza o estado por meio de setErro.
                    setErro(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                    // Atualiza o estado por meio de setVendas.
                    setVendas([]);
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Declara clientes para uso neste fluxo.
                const clientes = extrairListaUsuarios(dados);
                // Declara vendasPorCliente para uso neste fluxo.
                const vendasPorCliente = await Promise.all(clientes.map(async (cliente) => {
                    // Declara id para uso neste fluxo.
                    const id = idUsuario(cliente);

                    // Verifica esta condição antes de continuar o fluxo.
                    if (!id) {
                        // Retorna o resultado desta função ou o conteúdo visual da página.
                        return [];
                    }

                    // Declara respostaVendas para uso neste fluxo.
                    const respostaVendas = await fetch(`${API}/listar_vendas_usuario?id_usuario=${encodeURIComponent(id)}`, {
                        method: "GET",
                        headers: cabecalhoAutorizacao(),
                        credentials: "include"
                    });

                    // Verifica esta condição antes de continuar o fluxo.
                    if (!respostaVendas.ok) {
                        // Retorna o resultado desta função ou o conteúdo visual da página.
                        return [];
                    }

                    // Declara dadosVendas para uso neste fluxo.
                    const dadosVendas = await respostaVendas.json();
                    // Declara lista para uso neste fluxo.
                    const lista = Array.isArray(dadosVendas) ? dadosVendas : dadosVendas.vendas || [];

                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return lista.map((venda) => ({
                        ...venda,
                        nome_cliente: nomeUsuario(cliente)
                    }));
                }));

                // Atualiza o estado por meio de setVendas.
                setVendas(vendasPorCliente.flat().map(normalizarVendaUsuario));
            } catch {
                // Atualiza o estado por meio de setErro.
                setErro("Erro de conexão com o servidor.");
                // Atualiza o estado por meio de setVendas.
                setVendas([]);
            } finally {
                // Atualiza o estado por meio de setCarregando.
                setCarregando(false);
            }
        }

        // Executa carregarVendas nesta etapa do fluxo.
        carregarVendas();
    }, [API]);

    // Declara vendasFiltradas para uso neste fluxo.
    const vendasFiltradas = useMemo(() => {
        // Declara termo para uso neste fluxo.
        const termo = busca.trim().toLowerCase();

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return vendas.filter((venda) => {
            // Declara passaBusca para uso neste fluxo.
            const passaBusca =
                !termo ||
                [venda.data, venda.cliente, venda.veiculo, venda.pagamento, venda.status, venda.comentarios]
                    .some((campo) => textoMinusculo(campo).includes(termo));

            // Declara passaStatus para uso neste fluxo.
            const passaStatus = status === "Status" || venda.status === status;
            // Declara passaPagamento para uso neste fluxo.
            const passaPagamento = pagamento === "Forma de Pagamento" || venda.pagamento === pagamento;

            // Retorna o resultado desta função ou o conteúdo visual da página.
            return passaBusca && passaStatus && passaPagamento;
        });
    }, [busca, pagamento, status, vendas]);

    // Declara a função ehVendaParcelada usada por esta página.
    function ehVendaParcelada(venda) {
        // Declara forma para uso neste fluxo.
        const forma = String(venda?.pagamento || venda?.forma_pagamento || venda?.FORMA_PAGAMENTO || "").trim().toLowerCase();
        // Declara quantidadeParcelas para uso neste fluxo.
        const quantidadeParcelas = Number(String(venda?.parcelas || venda?.quantidade_parcelas || venda?.QUANTIDADE_PARCELAS || 0).replace(",", "."));
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
    }

    // Declara a função ehVendaPixAVista usada por esta página.
    function ehVendaPixAVista(venda) {
        // Declara forma para uso neste fluxo.
        const forma = String(venda?.pagamento || venda?.forma_pagamento || venda?.FORMA_PAGAMENTO || "").trim().toLowerCase();
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return (forma === "0" || forma.includes("pix")) && !ehVendaParcelada(venda);
    }

    // Declara a função carregarPixParcelas usada por esta página.
    async function carregarPixParcelas(idVenda, forcar = false) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!forcar && pixParcelas[idVenda]?.length) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setCarregandoPixParcelas.
        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        // Atualiza o estado por meio de setErroPixParcelas.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setPixParcelas.
                setPixParcelas((estado) => ({ ...estado, [idVenda]: [] }));
                // Atualiza o estado por meio de setErroPixParcelas.
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Declara listaParcelas para uso neste fluxo.
            const listaParcelas = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            // Declara versaoPix para uso neste fluxo.
            const versaoPix = Date.now();

            // Atualiza o estado por meio de setPixParcelas.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(listaParcelas)
                    ? listaParcelas.map((parcela) => ({ ...normalizarParcelaPix(parcela), versaoPix }))
                    : []
            }));
        } catch {
            // Atualiza o estado por meio de setErroPixParcelas.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível conectar ao servidor para carregar o Pix das parcelas."
            }));
        } finally {
            // Atualiza o estado por meio de setCarregandoPixParcelas.
            setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    // Declara a função carregarPixVenda usada por esta página.
    async function carregarPixVenda(venda, forcar = false) {
        // Declara idVenda para uso neste fluxo.
        const idVenda = venda?.id;

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda || !ehVendaPixAVista(venda)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara pixJaCarregado para uso neste fluxo.
        const pixJaCarregado = pixVendas[idVenda];

        // Verifica esta condição antes de continuar o fluxo.
        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!forcar && (venda.pixVenda?.qrcode || venda.pixVenda?.copiaCola)) {
            // Atualiza o estado por meio de setPixVendas.
            setPixVendas((estado) => ({ ...estado, [idVenda]: venda.pixVenda }));
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setCarregandoPixVendas.
        setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: true }));
        // Atualiza o estado por meio de setErroPixVendas.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/pix_venda/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setPixVendas.
                setPixVendas((estado) => ({ ...estado, [idVenda]: null }));
                // Atualiza o estado por meio de setErroPixVendas.
                setErroPixVendas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponivel para esta venda."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setPixVendas.
            setPixVendas((estado) => ({ ...estado, [idVenda]: { ...normalizarPixVenda(dados), versaoPix: Date.now() } }));
        } catch {
            // Atualiza o estado por meio de setErroPixVendas.
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível carregar o Pix agora. Verifique se o servidor está aberto e tente novamente."
            }));
        } finally {
            // Atualiza o estado por meio de setCarregandoPixVendas.
            setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    // Declara a função copiarPix usada por esta página.
    async function copiarPix(codigo) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!codigo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Executa writeText nesta etapa do fluxo.
        await navigator.clipboard.writeText(codigo);
    }

    // Declara a função registrarReceitaParcela usada por esta página.
    async function registrarReceitaParcela(venda, parcela) {
        // Declara idVenda para uso neste fluxo.
        const idVenda = venda?.id;
        // Declara valorParcela para uso neste fluxo.
        const valorParcela = valorParaNumero(parcela?.valor);

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda || !valorParcela) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error("Parcela paga, mas não foi possível montar a receita financeira.");
        }

        // Declara resposta para uso neste fluxo.
        const resposta = await fetch(`${API}/cadastro_financeiro`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...cabecalhoAutorizacao()
            },
            credentials: "include",
            body: JSON.stringify({
                tipo: "entrada",
                id_veiculo: venda?.idVeiculo || null,
                data: dataAtualParaApi(),
                descricao: `Receita automática - Venda #${idVenda} - Parcela ${parcela?.numero || "-"} - ${venda?.veiculo || "Veículo"}`,
                valor: valorParcela
            })
        });
        // Declara dados para uso neste fluxo.
        const dados = await resposta.json().catch(() => ({}));

        // Verifica esta condição antes de continuar o fluxo.
        if (!resposta.ok && resposta.status !== 409) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error(dados.erro || dados.mensagem || "Parcela paga, mas a receita não foi registrada no financeiro.");
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados;
    }

    // Declara a função pagarPixParcela usada por esta página.
    async function pagarPixParcela(codigo, venda, parcela) {
        // Declara idVenda para uso neste fluxo.
        const idVenda = venda?.id;

        // Verifica esta condição antes de continuar o fluxo.
        if (!codigo || !idVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara chave para uso neste fluxo.
        const chave = `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
        // Atualiza o estado por meio de setErroPixParcelas.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Atualiza o estado por meio de setMensagemPixParcelas.
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Atualiza o estado por meio de setPagandoPixParcelas.
        setPagandoPixParcelas((estado) => ({ ...estado, [chave]: true }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Verifica esta condição antes de continuar o fluxo.
            if (!parcela?.id || parcelaEstaPaga(parcela)) {
                // Atualiza o estado por meio de setMensagemPixParcelas.
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Esta parcela já está paga."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/pagar_parcela_pix/${parcela.id}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Interrompe o fluxo informando o erro encontrado.
                throw new Error(dados.erro || dados.mensagem || "Não foi possível marcar a parcela como paga.");
            }

            // Verifica esta condição antes de continuar o fluxo.
            if (!pagamentoRegistrouReceita(dados)) {
                // Executa registrarReceitaParcela nesta etapa do fluxo.
                await registrarReceitaParcela(venda, parcela);
            }

            // Declara parcelasAtualizadas para uso neste fluxo.
            const parcelasAtualizadas = (pixParcelas[idVenda] || []).map((item) => (
                String(item.id) === String(parcela.id)
                    ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                    : item
            ));
            // Declara vendaQuitadaLocalmente para uso neste fluxo.
            const vendaQuitadaLocalmente = parcelasAtualizadas.length > 0 && parcelasAtualizadas.every(parcelaEstaPaga);

            // Atualiza o estado por meio de setPixParcelas.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id) === String(parcela.id)
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        : item
                ))
            }));

            // Verifica esta condição antes de continuar o fluxo.
            if (pixPagamentoDetalhe) {
                // Atualiza o estado por meio de setPixPagamentoDetalhe.
                setPixPagamentoDetalhe({
                    venda,
                    parcela: {
                        ...parcela,
                        situacao: dados.situacao_parcela ?? 1
                    }
                });
            }

            // Verifica esta condição antes de continuar o fluxo.
            if (dados.compra_quitada || vendaQuitadaLocalmente) {
                // Executa confirmarStatusPagamentoVenda nesta etapa do fluxo.
                await confirmarStatusPagamentoVenda(API, idVenda);
                // Atualiza o estado por meio de setVendas.
                setVendas((estado) => estado.map((item) => (
                    String(item.id) === String(idVenda)
                        ? { ...item, status: "Pago" }
                        : item
                )));
                // Atualiza o estado por meio de setVendaDetalhe.
                setVendaDetalhe((detalhe) => (
                    detalhe && String(detalhe.id) === String(idVenda)
                        ? { ...detalhe, status: "Pago" }
                        : detalhe
                ));
            }

            // Atualiza o estado por meio de setMensagemPixParcelas.
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: dados.compra_quitada || vendaQuitadaLocalmente
                    ? "Todas as parcelas foram pagas. Venda quitada e receita registrada."
                    : "Parcela marcada como paga e receita registrada."
            }));
        } catch (erroAtual) {
            // Atualiza o estado por meio de setErroPixParcelas.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            // Atualiza o estado por meio de setPagandoPixParcelas.
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (vendaDetalhe?.id && ehVendaParcelada(vendaDetalhe)) {
            // Executa carregarPixParcelas nesta etapa do fluxo.
            carregarPixParcelas(vendaDetalhe.id);
        }
        // Verifica esta condição antes de continuar o fluxo.
        if (vendaDetalhe?.id && ehVendaPixAVista(vendaDetalhe)) {
            // Executa carregarPixVenda nesta etapa do fluxo.
            carregarPixVenda(vendaDetalhe);
        }
    }, [vendaDetalhe]);

    // Declara vendaDetalheParcelada para uso neste fluxo.
    const vendaDetalheParcelada = vendaDetalhe && ehVendaParcelada(vendaDetalhe);
    // Declara vendaDetalhePixAVista para uso neste fluxo.
    const vendaDetalhePixAVista = vendaDetalhe && ehVendaPixAVista(vendaDetalhe);
    // Declara idVendaDetalhe para uso neste fluxo.
    const idVendaDetalhe = vendaDetalhe?.id;
    // Declara mostrarPixDetalhe para uso neste fluxo.
    const mostrarPixDetalhe = Boolean(idVendaDetalhe && (vendaDetalheParcelada || vendaDetalhePixAVista));
    // Declara parcelasPixDetalhe para uso neste fluxo.
    const parcelasPixDetalhe = idVendaDetalhe ? pixParcelas[idVendaDetalhe] || [] : [];
    // Declara carregandoPixDetalhe para uso neste fluxo.
    const carregandoPixDetalhe = idVendaDetalhe ? carregandoPixParcelas[idVendaDetalhe] : false;
    // Declara erroPixDetalhe para uso neste fluxo.
    const erroPixDetalhe = idVendaDetalhe ? erroPixParcelas[idVendaDetalhe] : "";
    // Declara mensagemPixDetalhe para uso neste fluxo.
    const mensagemPixDetalhe = idVendaDetalhe ? mensagemPixParcelas[idVendaDetalhe] : "";
    // Declara chavePixPagamentoDetalhe para uso neste fluxo.
    const chavePixPagamentoDetalhe = pixPagamentoDetalhe
        ? `${pixPagamentoDetalhe.venda?.id}-${pixPagamentoDetalhe.parcela?.id || pixPagamentoDetalhe.parcela?.numero || "parcela"}`
        : "";
    // Declara pagandoPixPagamentoDetalhe para uso neste fluxo.
    const pagandoPixPagamentoDetalhe = Boolean(chavePixPagamentoDetalhe && pagandoPixParcelas[chavePixPagamentoDetalhe]);
    // Declara pixVendaDetalhe para uso neste fluxo.
    const pixVendaDetalhe = idVendaDetalhe ? pixVendas[idVendaDetalhe] : null;
    // Declara carregandoPixVendaDetalhe para uso neste fluxo.
    const carregandoPixVendaDetalhe = idVendaDetalhe ? carregandoPixVendas[idVendaDetalhe] : false;
    // Declara erroPixVendaDetalhe para uso neste fluxo.
    const erroPixVendaDetalhe = idVendaDetalhe ? erroPixVendas[idVendaDetalhe] : "";

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.pagina}>
            {/* Exibe o cabeçalho desta área. */}
            <header className={css.cabecalho}>
                {/* Exibe o título principal desta página. */}
                <h1>Vendas</h1>
                {/* Exibe este botão de ação. */}
                <button
                    type="button"
                    className={css.botaoCadastrar}
                    onClick={() => navigate("/venda")}
                >
                    Cadastrar Venda
                </button>
            </header>

            {/* Relaciona um texto explicativo ao campo correspondente. */}
            <label className={css.busca}>
                {/* Exibe esta imagem na interface. */}
                <img src="/IconBusca.png" alt="" />
                {/* Exibe este campo de entrada de dados. */}
                <input
                    type="text"
                    placeholder="Buscar vendas"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </label>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.cardTabela}>
                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {erro && <p className={css.erro}>{erro}</p>}

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.filtros}>
                    {/* Exibe uma lista de opções para seleção. */}
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        aria-label="Período"
                    >
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {filtrosPeriodo.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    {/* Exibe uma lista de opções para seleção. */}
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Status"
                    >
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {filtrosStatus.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    {/* Exibe uma lista de opções para seleção. */}
                    <select
                        value={pagamento}
                        onChange={(e) => setPagamento(e.target.value)}
                        aria-label="Forma de pagamento"
                    >
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {filtrosPagamento.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.tabelaWrapper}>
                    {/* Exibe os dados em formato de tabela. */}
                    <table className={css.tabela}>
                        {/* Renderiza o elemento thead nesta parte da página. */}
                        <thead>
                            {/* Renderiza o elemento tr nesta parte da página. */}
                            <tr>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Data</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Cliente</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Veículo</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Forma de Pagamento</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Status</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Ações</th>
                            </tr>
                        </thead>

                        {/* Renderiza o elemento tbody nesta parte da página. */}
                        <tbody>
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {carregando && (
                                <tr>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td colSpan="6" className={css.vazio}>
                                        Carregando vendas...
                                    </td>
                                </tr>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!carregando && vendasFiltradas.map((venda) => (
                                <tr key={venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Data">{venda.data}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Cliente">{venda.cliente}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Veículo">{venda.veiculo}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Forma de Pagamento">{venda.pagamento}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Status">
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                            {venda.status}
                                        </span>
                                    </td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Ações">
                                        {/* Agrupa os elementos desta parte da interface. */}
                                        <div className={css.acoesLinha}>
                                            {/* Exibe este botão de ação. */}
                                            <button type="button" className={css.botaoDetalhe} onClick={() => setVendaDetalhe(venda)}>
                                                Ver detalhe
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!carregando && vendasFiltradas.length === 0 && (
                                <tr>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td colSpan="6" className={css.vazio}>
                                        Nenhuma venda encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.cardsMobile}>
                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {carregando && (
                        <div className={css.cardEstado}>Carregando vendas...</div>
                    )}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && vendasFiltradas.map((venda) => (
                        <article key={`mobile-${venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}`} className={css.cardVenda}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.cardVendaTopo}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Data</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>{venda.data}</strong>
                                </div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                    {venda.status}
                                </span>
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.cardVendaInfo}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Cliente</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>{venda.cliente}</strong>
                                </div>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Veículo</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>{venda.veiculo}</strong>
                                </div>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Pagamento</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>{venda.pagamento}</strong>
                                </div>
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.acoesCard}>
                                {/* Exibe este botão de ação. */}
                                <button type="button" className={css.botaoDetalheMobile} onClick={() => setVendaDetalhe(venda)}>
                                    Ver detalhe
                                </button>
                            </div>
                        </article>
                    ))}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && vendasFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma venda encontrada.</div>
                    )}
                </div>
            </section>

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {vendaDetalhe && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheVenda">
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.modalDetalhe}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalTopo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Venda #{vendaDetalhe.id || "-"}</span>
                                {/* Exibe o título desta seção. */}
                                <h2 id="tituloDetalheVenda">Detalhe da venda</h2>
                            </div>
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                onClick={() => {
                                    // Atualiza o estado por meio de setVendaDetalhe.
                                    setVendaDetalhe(null);
                                    // Atualiza o estado por meio de setPixPagamentoDetalhe.
                                    setPixPagamentoDetalhe(null);
                                }}
                                aria-label="Fechar detalhe"
                            >
                                x
                            </button>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.detalheGrade}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Data</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.data}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Cliente</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.cliente}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Veículo</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.veiculo}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Forma de pagamento</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.pagamento}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Status</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.status}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Parcelas</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{vendaDetalhe.parcelas || "À vista"}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Valor da venda</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{formatarMoeda(vendaDetalhe.valorVenda)}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Valor recebido</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{formatarMoeda(vendaDetalhe.valorRecebido)}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Desconto</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{Number(vendaDetalhe.desconto || 0).toLocaleString("pt-BR")}%</strong>
                            </div>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.detalheComentarios}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Observações</span>
                            {/* Exibe esta mensagem ou informação. */}
                            <p>{vendaDetalhe.comentarios || "Sem observações."}</p>
                        </div>

                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                        {mostrarPixDetalhe && (
                            <div className={css.pixParcelasDetalhe}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div className={css.pixParcelasTopo}>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>{vendaDetalheParcelada ? "Pagamento parcelado" : "Pagamento a vista"}</span>
                                        {/* Renderiza o elemento h3 nesta parte da página. */}
                                        <h3>{vendaDetalheParcelada ? "Pix das parcelas" : "Pix da venda"}</h3>
                                    </div>
                                </div>

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalheParcelada && erroPixDetalhe && <p className={css.erroPixParcelas}>{erroPixDetalhe}</p>}
                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalheParcelada && mensagemPixDetalhe && <p className={css.estadoPixParcelas}>{mensagemPixDetalhe}</p>}
                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalhePixAVista && erroPixVendaDetalhe && <p className={css.erroPixParcelas}>{erroPixVendaDetalhe}</p>}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalheParcelada && carregandoPixDetalhe && parcelasPixDetalhe.length === 0 && (
                                    <p className={css.estadoPixParcelas}>Carregando Pix das parcelas...</p>
                                )}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalheParcelada && !carregandoPixDetalhe && !erroPixDetalhe && parcelasPixDetalhe.length === 0 && (
                                    <p className={css.estadoPixParcelas}>Nenhum Pix de parcela encontrado para esta venda.</p>
                                )}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalheParcelada && parcelasPixDetalhe.length > 0 && (
                                    <div className={css.listaPixPagamento}>
                                        {/* Percorre os dados para renderizar os itens desta área. */}
                                        {parcelasPixDetalhe.map((parcela, indice) => {
                                            // Declara parcelaPaga para uso neste fluxo.
                                            const parcelaPaga = parcelaEstaPaga(parcela);

                                            // Retorna o resultado desta função ou o conteúdo visual da página.
                                            return (
                                                <div key={parcela.id || parcela.numero || indice} className={css.linhaPixPagamento}>
                                                    {/* Agrupa os elementos desta parte da interface. */}
                                                    <div>
                                                        {/* Renderiza o elemento span nesta parte da página. */}
                                                        <span>Parcela</span>
                                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                                        <strong>{parcela.numero || indice + 1}</strong>
                                                    </div>
                                                    {/* Agrupa os elementos desta parte da interface. */}
                                                    <div>
                                                        {/* Renderiza o elemento span nesta parte da página. */}
                                                        <span>Vencimento</span>
                                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                                        <strong>{parcela.vencimento || "-"}</strong>
                                                    </div>
                                                    {/* Agrupa os elementos desta parte da interface. */}
                                                    <div>
                                                        {/* Renderiza o elemento span nesta parte da página. */}
                                                        <span>Valor</span>
                                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                                        <strong>{formatarMoeda(parcela.valor)}</strong>
                                                    </div>
                                                    {/* Renderiza o elemento span nesta parte da página. */}
                                                    <span className={parcelaPaga ? css.statusPixPago : css.statusPixPendente}>
                                                        {/* Percorre os dados para renderizar os itens desta área. */}
                                                        {textoSituacaoParcela(parcela)}
                                                    </span>
                                                    {/* Exibe este botão de ação. */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setPixPagamentoDetalhe({
                                                            venda: vendaDetalhe,
                                                            parcela
                                                        })}
                                                    >
                                                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                                        {parcelaPaga ? "Ver Pix" : "Pagar"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalhePixAVista && carregandoPixVendaDetalhe && !pixVendaDetalhe && (
                                    <p className={css.estadoPixParcelas}>Carregando Pix da venda...</p>
                                )}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalhePixAVista && !carregandoPixVendaDetalhe && !erroPixVendaDetalhe && !pixVendaDetalhe && (
                                    <p className={css.estadoPixParcelas}>Pix da venda indisponivel.</p>
                                )}

                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                {vendaDetalhePixAVista && pixVendaDetalhe && (
                                    <div className={css.pixVendaConteudo}>
                                        {/* Agrupa os elementos desta parte da interface. */}
                                        <div className={css.pixModalQr}>
                                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                            {pixVendaDetalhe.qrcode ? (
                                                <img
                                                    src={montarUrlPixAtualizada(API, pixVendaDetalhe.qrcode, pixVendaDetalhe.versaoPix)}
                                                    alt={`QR Code Pix da venda ${vendaDetalhe.id || ""}`}
                                                />
                                            ) : (
                                                <span>QR Code indisponivel</span>
                                            )}
                                        </div>

                                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                                        <label className={css.pixModalCopia}>
                                            {/* Renderiza o elemento span nesta parte da página. */}
                                            <span>Pix cópia e cola</span>
                                            {/* Renderiza o elemento textarea nesta parte da página. */}
                                            <textarea value={pixVendaDetalhe.copiaCola || ""} readOnly />
                                            {/* Exibe este botão de ação. */}
                                            <button type="button" onClick={() => copiarPix(pixVendaDetalhe.copiaCola)}>
                                                Copiar Pix
                                            </button>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalAcoes}>
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                className={css.botaoDetalhe}
                                onClick={() => {
                                    // Atualiza o estado por meio de setVendaDetalhe.
                                    setVendaDetalhe(null);
                                    // Atualiza o estado por meio de setPixPagamentoDetalhe.
                                    setPixPagamentoDetalhe(null);
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {pixPagamentoDetalhe && (
                <div className={css.pixModalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloPagamentoPix">
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.pixModal}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.pixModalTopo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Pagamento Pix</span>
                                {/* Exibe o título desta seção. */}
                                <h2 id="tituloPagamentoPix">Parcela {pixPagamentoDetalhe.parcela.numero || "-"}</h2>
                            </div>
                            {/* Exibe este botão de ação. */}
                            <button type="button" onClick={() => setPixPagamentoDetalhe(null)} aria-label="Fechar pagamento Pix">
                                x
                            </button>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.pixModalResumo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Cliente</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{pixPagamentoDetalhe.venda.cliente || "-"}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Veículo</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{pixPagamentoDetalhe.venda.veiculo || "-"}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Valor</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{formatarMoeda(pixPagamentoDetalhe.parcela.valor)}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Vencimento</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{pixPagamentoDetalhe.parcela.vencimento || "-"}</strong>
                            </div>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.pixModalConteudo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.pixModalQr}>
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {pixPagamentoDetalhe.parcela.qrcode ? (
                                    <img
                                        src={montarUrlPixAtualizada(API, pixPagamentoDetalhe.parcela.qrcode, pixPagamentoDetalhe.parcela.versaoPix)}
                                        alt={`QR Code Pix da parcela ${pixPagamentoDetalhe.parcela.numero || ""}`}
                                    />
                                ) : (
                                    <span>QR Code indisponível</span>
                                )}
                            </div>

                            {/* Relaciona um texto explicativo ao campo correspondente. */}
                            <label className={css.pixModalCopia}>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Pix cópia e cola</span>
                                {/* Renderiza o elemento textarea nesta parte da página. */}
                                <textarea value={pixPagamentoDetalhe.parcela.copiaCola || ""} readOnly />
                            </label>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.pixModalAcoes}>
                            {/* Exibe este botão de ação. */}
                            <button type="button" onClick={() => copiarPix(pixPagamentoDetalhe.parcela.copiaCola)} disabled={pagandoPixPagamentoDetalhe}>
                                Copiar Pix
                            </button>
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                onClick={() => pagarPixParcela(pixPagamentoDetalhe.parcela.copiaCola, pixPagamentoDetalhe.venda, pixPagamentoDetalhe.parcela)}
                                disabled={pagandoPixPagamentoDetalhe || parcelaEstaPaga(pixPagamentoDetalhe.parcela)}
                            >
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {pagandoPixPagamentoDetalhe ? "Confirmando..." : parcelaEstaPaga(pixPagamentoDetalhe.parcela) ? "Pago" : "Confirmar pagamento"}
                            </button>
                            {/* Exibe este botão de ação. */}
                            <button type="button" onClick={() => setPixPagamentoDetalhe(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default DasbhoardAdmVendas;
