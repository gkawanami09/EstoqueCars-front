import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./DasbhoardAdmVendas.module.css";

const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
const filtrosStatus = ["Status", "Pago", "Pendente"];
const filtrosPagamento = ["Forma de Pagamento", "Pix", "Parcelado",];

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function idUsuario(usuario) {
    return usuario?.id_usuario || usuario?.ID_USUARIO || usuario?.id || usuario?.ID;
}

function nomeUsuario(usuario) {
    return usuario?.nome || usuario?.NOME || usuario?.email || usuario?.EMAIL || `Cliente ${idUsuario(usuario) || "-"}`;
}

function extrairListaUsuarios(dados) {
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) === 0);

    return clientes.length > 0 ? clientes : lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) !== 2);
}

function textoFormaPagamento(valor) {
    const forma = String(valor ?? "").trim().toLowerCase();

    if (forma === "0" || forma.includes("pix")) {
        return "Pix";
    }

    if (forma === "1" || forma.includes("parcel")) {
        return "Parcelado";
    }

    return valor || "Não informado";
}

function textoStatusPagamento(valor) {
    const status = String(valor ?? "").trim().toLowerCase();

    if (status === "0" || status.includes("pago")) {
        return "Pago";
    }

    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        return "Pendente";
    }

    return valor || "Não informado";
}

function formatarData(valor) {
    if (!valor) {
        return "-";
    }

    const texto = String(valor);
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

    if (dataIso) {
        const [, ano, mes, dia, hora, minuto] = dataIso;
        return hora && minuto ? `${dia}/${mes}/${ano} ${hora}:${minuto}` : `${dia}/${mes}/${ano}`;
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return texto;
    }

    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function montarUrlPix(API, caminhoPix) {
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

function montarUrlPixAtualizada(API, caminhoPix, versao) {
    const url = montarUrlPix(API, caminhoPix);

    if (!url || !versao || url.startsWith("data:")) {
        return url;
    }

    return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(versao)}`;
}

function parametroChavePixAtual() {
    const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
    return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
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

function normalizarPixVenda(dados) {
    return {
        qrcode: dados?.pix_qrcode ?? dados?.PIX_QRCODE ?? dados?.qrcode ?? dados?.qr_code ?? dados?.imagem_pix ?? dados?.imagem,
        copiaCola: dados?.pix_copia_cola ?? dados?.PIX_COPIA_COLA ?? dados?.pix_copia_e_cola ?? dados?.copia_cola ?? dados?.payload ?? dados?.pix_payload,
        valor: dados?.valor ?? dados?.valor_recebido ?? dados?.VALOR_RECEBIDO ?? dados?.valor_venda ?? dados?.VALOR_VENDA
    };
}

function parcelaEstaPaga(parcela) {
    const situacao = String(parcela?.situacao ?? "").trim().toLowerCase();
    return situacao === "1" || situacao === "pago" || situacao === "paga" || situacao.includes("pago") || situacao.includes("paga");
}

function textoSituacaoParcela(parcela) {
    return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
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
        dados?.transacao?.id_financeiro ||
        dados?.transacao?.id
    );
}

function textoMinusculo(valor) {
    return String(valor || "").toLowerCase();
}

function normalizarVendaUsuario(venda) {
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

function DasbhoardAdmVendas({ API }) {
    const navigate = useNavigate();
    const [vendas, setVendas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [busca, setBusca] = useState("");
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    const [status, setStatus] = useState(filtrosStatus[0]);
    const [pagamento, setPagamento] = useState(filtrosPagamento[0]);
    const [vendaDetalhe, setVendaDetalhe] = useState(null);
    const [pixParcelas, setPixParcelas] = useState({});
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    const [pixVendas, setPixVendas] = useState({});
    const [carregandoPixVendas, setCarregandoPixVendas] = useState({});
    const [erroPixVendas, setErroPixVendas] = useState({});
    const [pixPagamentoDetalhe, setPixPagamentoDetalhe] = useState(null);

    useEffect(() => {
        async function carregarVendas() {
            setCarregando(true);
            setErro("");

            try {
                const resposta = await fetch(`${API}/listar_usuario`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                    setVendas([]);
                    return;
                }

                const clientes = extrairListaUsuarios(dados);
                const vendasPorCliente = await Promise.all(clientes.map(async (cliente) => {
                    const id = idUsuario(cliente);

                    if (!id) {
                        return [];
                    }

                    const respostaVendas = await fetch(`${API}/listar_vendas_usuario?id_usuario=${encodeURIComponent(id)}`, {
                        method: "GET",
                        headers: cabecalhoAutorizacao(),
                        credentials: "include"
                    });

                    if (!respostaVendas.ok) {
                        return [];
                    }

                    const dadosVendas = await respostaVendas.json();
                    const lista = Array.isArray(dadosVendas) ? dadosVendas : dadosVendas.vendas || [];

                    return lista.map((venda) => ({
                        ...venda,
                        nome_cliente: nomeUsuario(cliente)
                    }));
                }));

                setVendas(vendasPorCliente.flat().map(normalizarVendaUsuario));
            } catch {
                setErro("Erro de conexão com o servidor.");
                setVendas([]);
            } finally {
                setCarregando(false);
            }
        }

        carregarVendas();
    }, [API]);

    const vendasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return vendas.filter((venda) => {
            const passaBusca =
                !termo ||
                [venda.data, venda.cliente, venda.veiculo, venda.pagamento, venda.status, venda.comentarios]
                    .some((campo) => textoMinusculo(campo).includes(termo));

            const passaStatus = status === "Status" || venda.status === status;
            const passaPagamento = pagamento === "Forma de Pagamento" || venda.pagamento === pagamento;

            return passaBusca && passaStatus && passaPagamento;
        });
    }, [busca, pagamento, status, vendas]);

    function ehVendaParcelada(venda) {
        const forma = String(venda?.pagamento || venda?.forma_pagamento || venda?.FORMA_PAGAMENTO || "").trim().toLowerCase();
        const quantidadeParcelas = Number(String(venda?.parcelas || venda?.quantidade_parcelas || venda?.QUANTIDADE_PARCELAS || 0).replace(",", "."));
        return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
    }

    function ehVendaPixAVista(venda) {
        const forma = String(venda?.pagamento || venda?.forma_pagamento || venda?.FORMA_PAGAMENTO || "").trim().toLowerCase();
        return (forma === "0" || forma.includes("pix")) && !ehVendaParcelada(venda);
    }

    async function carregarPixParcelas(idVenda, forcar = false) {
        if (!idVenda) {
            return;
        }

        if (!forcar && pixParcelas[idVenda]?.length) {
            return;
        }

        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setPixParcelas((estado) => ({ ...estado, [idVenda]: [] }));
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                return;
            }

            const listaParcelas = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            const versaoPix = Date.now();

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(listaParcelas)
                    ? listaParcelas.map((parcela) => ({ ...normalizarParcelaPix(parcela), versaoPix }))
                    : []
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

    async function carregarPixVenda(venda, forcar = false) {
        const idVenda = venda?.id;

        if (!idVenda || !ehVendaPixAVista(venda)) {
            return;
        }

        const pixJaCarregado = pixVendas[idVenda];

        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            return;
        }

        if (!forcar && (venda.pixVenda?.qrcode || venda.pixVenda?.copiaCola)) {
            setPixVendas((estado) => ({ ...estado, [idVenda]: venda.pixVenda }));
            return;
        }

        setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: true }));
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            const resposta = await fetch(`${API}/pix_venda/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setPixVendas((estado) => ({ ...estado, [idVenda]: null }));
                setErroPixVendas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponivel para esta venda."
                }));
                return;
            }

            setPixVendas((estado) => ({ ...estado, [idVenda]: { ...normalizarPixVenda(dados), versaoPix: Date.now() } }));
        } catch {
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Nao foi possivel carregar o Pix agora. Verifique se o servidor esta aberto e tente novamente."
            }));
        } finally {
            setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    async function copiarPix(codigo) {
        if (!codigo) {
            return;
        }

        await navigator.clipboard.writeText(codigo);
    }

    async function registrarReceitaParcela(venda, parcela) {
        const idVenda = venda?.id;
        const valorParcela = valorParaNumero(parcela?.valor);

        if (!idVenda || !valorParcela) {
            throw new Error("Parcela paga, mas nao foi possivel montar a receita financeira.");
        }

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
                descricao: `Receita automatica - Venda #${idVenda} - Parcela ${parcela?.numero || "-"} - ${venda?.veiculo || "Veiculo"}`,
                valor: valorParcela
            })
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok && resposta.status !== 409) {
            throw new Error(dados.erro || dados.mensagem || "Parcela paga, mas a receita nao foi registrada no financeiro.");
        }

        return dados;
    }

    async function pagarPixParcela(codigo, venda, parcela) {
        const idVenda = venda?.id;

        if (!codigo || !idVenda) {
            return;
        }

        const chave = `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        setPagandoPixParcelas((estado) => ({ ...estado, [chave]: true }));

        try {
            if (!parcela?.id || parcelaEstaPaga(parcela)) {
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Esta parcela ja esta paga."
                }));
                return;
            }

            const resposta = await fetch(`${API}/pagar_parcela_pix/${parcela.id}`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "Nao foi possivel marcar a parcela como paga.");
            }

            if (!pagamentoRegistrouReceita(dados)) {
                await registrarReceitaParcela(venda, parcela);
            }

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id) === String(parcela.id)
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        : item
                ))
            }));

            if (pixPagamentoDetalhe) {
                setPixPagamentoDetalhe({
                    venda,
                    parcela: {
                        ...parcela,
                        situacao: dados.situacao_parcela ?? 1
                    }
                });
            }

            if (dados.compra_quitada) {
                setVendas((estado) => estado.map((item) => (
                    String(item.id) === String(idVenda)
                        ? { ...item, status: "Pago" }
                        : item
                )));
                setVendaDetalhe((detalhe) => (
                    detalhe && String(detalhe.id) === String(idVenda)
                        ? { ...detalhe, status: "Pago" }
                        : detalhe
                ));
            }

            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: dados.compra_quitada
                    ? "Todas as parcelas foram pagas. Venda quitada e receita registrada."
                    : "Parcela marcada como paga e receita registrada."
            }));
        } catch (erroAtual) {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Nao foi possivel copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    useEffect(() => {
        if (vendaDetalhe?.id && ehVendaParcelada(vendaDetalhe)) {
            carregarPixParcelas(vendaDetalhe.id);
        }
        if (vendaDetalhe?.id && ehVendaPixAVista(vendaDetalhe)) {
            carregarPixVenda(vendaDetalhe);
        }
    }, [vendaDetalhe]);

    const vendaDetalheParcelada = vendaDetalhe && ehVendaParcelada(vendaDetalhe);
    const vendaDetalhePixAVista = vendaDetalhe && ehVendaPixAVista(vendaDetalhe);
    const idVendaDetalhe = vendaDetalhe?.id;
    const mostrarPixDetalhe = Boolean(idVendaDetalhe && (vendaDetalheParcelada || vendaDetalhePixAVista));
    const parcelasPixDetalhe = idVendaDetalhe ? pixParcelas[idVendaDetalhe] || [] : [];
    const carregandoPixDetalhe = idVendaDetalhe ? carregandoPixParcelas[idVendaDetalhe] : false;
    const erroPixDetalhe = idVendaDetalhe ? erroPixParcelas[idVendaDetalhe] : "";
    const mensagemPixDetalhe = idVendaDetalhe ? mensagemPixParcelas[idVendaDetalhe] : "";
    const chavePixPagamentoDetalhe = pixPagamentoDetalhe
        ? `${pixPagamentoDetalhe.venda?.id}-${pixPagamentoDetalhe.parcela?.id || pixPagamentoDetalhe.parcela?.numero || "parcela"}`
        : "";
    const pagandoPixPagamentoDetalhe = Boolean(chavePixPagamentoDetalhe && pagandoPixParcelas[chavePixPagamentoDetalhe]);
    const pixVendaDetalhe = idVendaDetalhe ? pixVendas[idVendaDetalhe] : null;
    const carregandoPixVendaDetalhe = idVendaDetalhe ? carregandoPixVendas[idVendaDetalhe] : false;
    const erroPixVendaDetalhe = idVendaDetalhe ? erroPixVendas[idVendaDetalhe] : "";

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <h1>Vendas</h1>
                <button
                    type="button"
                    className={css.botaoCadastrar}
                    onClick={() => navigate("/venda")}
                >
                    Cadastrar Venda
                </button>
            </header>

            <label className={css.busca}>
                <img src="/IconBusca.png" alt="" />
                <input
                    type="text"
                    placeholder="Buscar vendas"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </label>

            <section className={css.cardTabela}>
                {erro && <p className={css.erro}>{erro}</p>}

                <div className={css.filtros}>
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        aria-label="Período"
                    >
                        {filtrosPeriodo.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        aria-label="Status"
                    >
                        {filtrosStatus.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>

                    <select
                        value={pagamento}
                        onChange={(e) => setPagamento(e.target.value)}
                        aria-label="Forma de pagamento"
                    >
                        {filtrosPagamento.map((filtro) => (
                            <option key={filtro}>{filtro}</option>
                        ))}
                    </select>
                </div>

                <div className={css.tabelaWrapper}>
                    <table className={css.tabela}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Cliente</th>
                                <th>Veículo</th>
                                <th>Forma de Pagamento</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>

                        <tbody>
                            {carregando && (
                                <tr>
                                    <td colSpan="6" className={css.vazio}>
                                        Carregando vendas...
                                    </td>
                                </tr>
                            )}

                            {!carregando && vendasFiltradas.map((venda) => (
                                <tr key={venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}>
                                    <td data-label="Data">{venda.data}</td>
                                    <td data-label="Cliente">{venda.cliente}</td>
                                    <td data-label="Veículo">{venda.veiculo}</td>
                                    <td data-label="Forma de Pagamento">{venda.pagamento}</td>
                                    <td data-label="Status">
                                        <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                            {venda.status}
                                        </span>
                                    </td>
                                    <td data-label="Ações">
                                        <div className={css.acoesLinha}>
                                            <button type="button" className={css.botaoDetalhe} onClick={() => setVendaDetalhe(venda)}>
                                                Ver detalhe
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!carregando && vendasFiltradas.length === 0 && (
                                <tr>
                                    <td colSpan="6" className={css.vazio}>
                                        Nenhuma venda encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={css.cardsMobile}>
                    {carregando && (
                        <div className={css.cardEstado}>Carregando vendas...</div>
                    )}

                    {!carregando && vendasFiltradas.map((venda) => (
                        <article key={`mobile-${venda.id || `${venda.data}-${venda.cliente}-${venda.veiculo}`}`} className={css.cardVenda}>
                            <div className={css.cardVendaTopo}>
                                <div>
                                    <span>Data</span>
                                    <strong>{venda.data}</strong>
                                </div>
                                <span className={`${css.status} ${venda.status === "Pago" ? css.pago : css.pendente}`}>
                                    {venda.status}
                                </span>
                            </div>

                            <div className={css.cardVendaInfo}>
                                <div>
                                    <span>Cliente</span>
                                    <strong>{venda.cliente}</strong>
                                </div>
                                <div>
                                    <span>Veículo</span>
                                    <strong>{venda.veiculo}</strong>
                                </div>
                                <div>
                                    <span>Pagamento</span>
                                    <strong>{venda.pagamento}</strong>
                                </div>
                            </div>

                            <div className={css.acoesCard}>
                                <button type="button" className={css.botaoDetalheMobile} onClick={() => setVendaDetalhe(venda)}>
                                    Ver detalhe
                                </button>
                            </div>
                        </article>
                    ))}

                    {!carregando && vendasFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma venda encontrada.</div>
                    )}
                </div>
            </section>

            {vendaDetalhe && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheVenda">
                    <div className={css.modalDetalhe}>
                        <div className={css.modalTopo}>
                            <div>
                                <span>Venda #{vendaDetalhe.id || "-"}</span>
                                <h2 id="tituloDetalheVenda">Detalhe da venda</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setVendaDetalhe(null);
                                    setPixPagamentoDetalhe(null);
                                }}
                                aria-label="Fechar detalhe"
                            >
                                x
                            </button>
                        </div>

                        <div className={css.detalheGrade}>
                            <div>
                                <span>Data</span>
                                <strong>{vendaDetalhe.data}</strong>
                            </div>
                            <div>
                                <span>Cliente</span>
                                <strong>{vendaDetalhe.cliente}</strong>
                            </div>
                            <div>
                                <span>Veículo</span>
                                <strong>{vendaDetalhe.veiculo}</strong>
                            </div>
                            <div>
                                <span>Forma de pagamento</span>
                                <strong>{vendaDetalhe.pagamento}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <strong>{vendaDetalhe.status}</strong>
                            </div>
                            <div>
                                <span>Parcelas</span>
                                <strong>{vendaDetalhe.parcelas || "À vista"}</strong>
                            </div>
                            <div>
                                <span>Valor da venda</span>
                                <strong>{formatarMoeda(vendaDetalhe.valorVenda)}</strong>
                            </div>
                            <div>
                                <span>Valor recebido</span>
                                <strong>{formatarMoeda(vendaDetalhe.valorRecebido)}</strong>
                            </div>
                            <div>
                                <span>Desconto</span>
                                <strong>{Number(vendaDetalhe.desconto || 0).toLocaleString("pt-BR")}%</strong>
                            </div>
                        </div>

                        <div className={css.detalheComentarios}>
                            <span>Observações</span>
                            <p>{vendaDetalhe.comentarios || "Sem observações."}</p>
                        </div>

                        {mostrarPixDetalhe && (
                            <div className={css.pixParcelasDetalhe}>
                                <div className={css.pixParcelasTopo}>
                                    <div>
                                        <span>{vendaDetalheParcelada ? "Pagamento parcelado" : "Pagamento a vista"}</span>
                                        <h3>{vendaDetalheParcelada ? "Pix das parcelas" : "Pix da venda"}</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (vendaDetalheParcelada) {
                                                carregarPixParcelas(idVendaDetalhe, true);
                                            } else {
                                                carregarPixVenda(vendaDetalhe, true);
                                            }
                                        }}
                                        disabled={vendaDetalheParcelada ? carregandoPixDetalhe : carregandoPixVendaDetalhe}
                                    >
                                        {(vendaDetalheParcelada ? carregandoPixDetalhe : carregandoPixVendaDetalhe) ? "Carregando..." : "Atualizar Pix"}
                                    </button>
                                </div>

                                {vendaDetalheParcelada && erroPixDetalhe && <p className={css.erroPixParcelas}>{erroPixDetalhe}</p>}
                                {vendaDetalheParcelada && mensagemPixDetalhe && <p className={css.estadoPixParcelas}>{mensagemPixDetalhe}</p>}
                                {vendaDetalhePixAVista && erroPixVendaDetalhe && <p className={css.erroPixParcelas}>{erroPixVendaDetalhe}</p>}

                                {vendaDetalheParcelada && carregandoPixDetalhe && parcelasPixDetalhe.length === 0 && (
                                    <p className={css.estadoPixParcelas}>Carregando Pix das parcelas...</p>
                                )}

                                {vendaDetalheParcelada && !carregandoPixDetalhe && !erroPixDetalhe && parcelasPixDetalhe.length === 0 && (
                                    <p className={css.estadoPixParcelas}>Nenhum Pix de parcela encontrado para esta venda.</p>
                                )}

                                {vendaDetalheParcelada && parcelasPixDetalhe.length > 0 && (
                                    <div className={css.listaPixPagamento}>
                                        {parcelasPixDetalhe.map((parcela, indice) => {
                                            const parcelaPaga = parcelaEstaPaga(parcela);

                                            return (
                                                <div key={parcela.id || parcela.numero || indice} className={css.linhaPixPagamento}>
                                                    <div>
                                                        <span>Parcela</span>
                                                        <strong>{parcela.numero || indice + 1}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Vencimento</span>
                                                        <strong>{parcela.vencimento || "-"}</strong>
                                                    </div>
                                                    <div>
                                                        <span>Valor</span>
                                                        <strong>{formatarMoeda(parcela.valor)}</strong>
                                                    </div>
                                                    <span className={parcelaPaga ? css.statusPixPago : css.statusPixPendente}>
                                                        {textoSituacaoParcela(parcela)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPixPagamentoDetalhe({
                                                            venda: vendaDetalhe,
                                                            parcela
                                                        })}
                                                    >
                                                        {parcelaPaga ? "Ver Pix" : "Pagar"}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {vendaDetalhePixAVista && carregandoPixVendaDetalhe && !pixVendaDetalhe && (
                                    <p className={css.estadoPixParcelas}>Carregando Pix da venda...</p>
                                )}

                                {vendaDetalhePixAVista && !carregandoPixVendaDetalhe && !erroPixVendaDetalhe && !pixVendaDetalhe && (
                                    <p className={css.estadoPixParcelas}>Pix da venda indisponivel.</p>
                                )}

                                {vendaDetalhePixAVista && pixVendaDetalhe && (
                                    <div className={css.pixVendaConteudo}>
                                        <div className={css.pixModalQr}>
                                            {pixVendaDetalhe.qrcode ? (
                                                <img
                                                    src={montarUrlPixAtualizada(API, pixVendaDetalhe.qrcode, pixVendaDetalhe.versaoPix)}
                                                    alt={`QR Code Pix da venda ${vendaDetalhe.id || ""}`}
                                                />
                                            ) : (
                                                <span>QR Code indisponivel</span>
                                            )}
                                        </div>

                                        <label className={css.pixModalCopia}>
                                            <span>Pix copia e cola</span>
                                            <textarea value={pixVendaDetalhe.copiaCola || ""} readOnly />
                                            <button type="button" onClick={() => copiarPix(pixVendaDetalhe.copiaCola)}>
                                                Copiar Pix
                                            </button>
                                        </label>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={css.modalAcoes}>
                            <button
                                type="button"
                                className={css.botaoDetalhe}
                                onClick={() => {
                                    setVendaDetalhe(null);
                                    setPixPagamentoDetalhe(null);
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pixPagamentoDetalhe && (
                <div className={css.pixModalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloPagamentoPix">
                    <div className={css.pixModal}>
                        <div className={css.pixModalTopo}>
                            <div>
                                <span>Pagamento Pix</span>
                                <h2 id="tituloPagamentoPix">Parcela {pixPagamentoDetalhe.parcela.numero || "-"}</h2>
                            </div>
                            <button type="button" onClick={() => setPixPagamentoDetalhe(null)} aria-label="Fechar pagamento Pix">
                                x
                            </button>
                        </div>

                        <div className={css.pixModalResumo}>
                            <div>
                                <span>Cliente</span>
                                <strong>{pixPagamentoDetalhe.venda.cliente || "-"}</strong>
                            </div>
                            <div>
                                <span>Veículo</span>
                                <strong>{pixPagamentoDetalhe.venda.veiculo || "-"}</strong>
                            </div>
                            <div>
                                <span>Valor</span>
                                <strong>{formatarMoeda(pixPagamentoDetalhe.parcela.valor)}</strong>
                            </div>
                            <div>
                                <span>Vencimento</span>
                                <strong>{pixPagamentoDetalhe.parcela.vencimento || "-"}</strong>
                            </div>
                        </div>

                        <div className={css.pixModalConteudo}>
                            <div className={css.pixModalQr}>
                                {pixPagamentoDetalhe.parcela.qrcode ? (
                                    <img
                                        src={montarUrlPixAtualizada(API, pixPagamentoDetalhe.parcela.qrcode, pixPagamentoDetalhe.parcela.versaoPix)}
                                        alt={`QR Code Pix da parcela ${pixPagamentoDetalhe.parcela.numero || ""}`}
                                    />
                                ) : (
                                    <span>QR Code indisponível</span>
                                )}
                            </div>

                            <label className={css.pixModalCopia}>
                                <span>Pix copia e cola</span>
                                <textarea value={pixPagamentoDetalhe.parcela.copiaCola || ""} readOnly />
                            </label>
                        </div>

                        <div className={css.pixModalAcoes}>
                            <button type="button" onClick={() => copiarPix(pixPagamentoDetalhe.parcela.copiaCola)} disabled={pagandoPixPagamentoDetalhe}>
                                Copiar Pix
                            </button>
                            <button
                                type="button"
                                onClick={() => pagarPixParcela(pixPagamentoDetalhe.parcela.copiaCola, pixPagamentoDetalhe.venda, pixPagamentoDetalhe.parcela)}
                                disabled={pagandoPixPagamentoDetalhe || parcelaEstaPaga(pixPagamentoDetalhe.parcela)}
                            >
                                {pagandoPixPagamentoDetalhe ? "Confirmando..." : parcelaEstaPaga(pixPagamentoDetalhe.parcela) ? "Pago" : "Confirmar pagamento"}
                            </button>
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

export default DasbhoardAdmVendas;
