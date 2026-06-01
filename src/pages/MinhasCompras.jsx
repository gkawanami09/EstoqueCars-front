import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./MinhasCompras.module.css";

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

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

function lerUsuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch {
        return {};
    }
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

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
    return Number.isNaN(data.getTime()) ? texto : data.toLocaleDateString("pt-BR");
}

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

function idVendaCompra(compra) {
    return compra?.id_venda || compra?.ID_VENDA || compra?.id || compra?.ID;
}

function idVeiculoCompra(compra) {
    return compra?.id_veiculo || compra?.ID_VEICULO || compra?.id_carro || compra?.ID_CARRO;
}

function nomeVeiculoCompra(compra) {
    return compra?.veiculo || compra?.nome_veiculo || compra?.modelo || compra?.nome || "Veículo";
}

function ehVendaParcelada(compra) {
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    const quantidadeParcelas = Number(String(compra?.quantidade_parcelas ?? compra?.parcelas ?? compra?.QUANTIDADE_PARCELAS ?? 0).replace(",", "."));
    return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
}

function ehVendaPixAVista(compra) {
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    return (forma === "0" || forma.includes("pix")) && !ehVendaParcelada(compra);
}

function normalizarPixVenda(dados) {
    return {
        qrcode: dados?.pix_qrcode ?? dados?.PIX_QRCODE ?? dados?.qrcode ?? dados?.qr_code ?? dados?.imagem_pix ?? dados?.imagem,
        copiaCola: dados?.pix_copia_cola ?? dados?.PIX_COPIA_COLA ?? dados?.pix_copia_e_cola ?? dados?.copia_cola ?? dados?.payload ?? dados?.pix_payload,
        valor: dados?.valor ?? dados?.valor_recebido ?? dados?.VALOR_RECEBIDO ?? dados?.valor_venda ?? dados?.VALOR_VENDA
    };
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

function MinhasCompras({ API }) {
    const navigate = useNavigate();
    const usuario = useMemo(() => lerUsuarioLogado(), []);
    const idUsuario = usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken();

    const [compras, setCompras] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [pixParcelas, setPixParcelas] = useState({});
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    const [parcelaPixSelecionada, setParcelaPixSelecionada] = useState({});
    const [pixVendas, setPixVendas] = useState({});
    const [carregandoPixVendas, setCarregandoPixVendas] = useState({});
    const [erroPixVendas, setErroPixVendas] = useState({});
    const [mensagemPixVendas, setMensagemPixVendas] = useState({});

    function montarUrlArquivo(valor) {
        if (!valor) {
            return "";
        }

        const caminho = String(valor);

        if (caminho.startsWith("http") || caminho.startsWith("data:")) {
            return caminho;
        }

        if (caminho.startsWith("/")) {
            return `${API}${caminho}`;
        }

        return `${API}/${caminho}`;
    }

    function comprovanteCompra(compra) {
        return montarUrlArquivo(compra?.comprovante || compra?.comprovante_url || compra?.arquivo_comprovante);
    }

    function parametroChavePixAtual() {
        const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
        return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
    }

    const carregarCompras = useCallback(async () => {
        if (!idUsuario) {
            setCompras([]);
            setCarregando(false);
            setErro("Não foi possível identificar o usuário logado.");
            return;
        }

        setCarregando(true);
        setErro("");

        const rotas = [
            `/listar_vendas_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            `/listar_compras_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            `/minhas_compras?id_usuario=${encodeURIComponent(idUsuario)}`
        ];

        for (const rota of rotas) {
            try {
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
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
                setCarregando(false);
                return;
            } catch {
                // Tenta a próxima rota conhecida.
            }
        }

        setCompras([]);
        setErro("Ainda não foi possível carregar suas compras.");
        setCarregando(false);
    }, [API, idUsuario]);

    const carregarPixParcelas = useCallback(async (idVenda) => {
        if (!idVenda || pixParcelas[idVenda]?.length) {
            return;
        }

        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
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

            const lista = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(lista) ? lista.map(normalizarParcelaPix) : []
            }));
        } catch {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível conectar ao servidor para carregar o Pix das parcelas."
            }));
        } finally {
            setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixParcelas]);

    const carregarPixVenda = useCallback(async (compra, forcar = false) => {
        const idVenda = idVendaCompra(compra);

        if (!idVenda || !ehVendaPixAVista(compra)) {
            return;
        }

        const pixJaCarregado = pixVendas[idVenda];

        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            return;
        }

        const pixDaCompra = normalizarPixVenda(compra);

        if (!forcar && (pixDaCompra.qrcode || pixDaCompra.copiaCola)) {
            setPixVendas((estado) => ({ ...estado, [idVenda]: pixDaCompra }));
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
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponível para esta compra."
                }));
                return;
            }

            setPixVendas((estado) => ({ ...estado, [idVenda]: { ...normalizarPixVenda(dados), versaoPix: Date.now() } }));
        } catch {
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Não foi possível carregar o Pix agora."
            }));
        } finally {
            setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixVendas]);

    useEffect(() => {
        carregarCompras();
    }, [carregarCompras]);

    useEffect(() => {
        compras.forEach((compra) => {
            const idVenda = idVendaCompra(compra);

            if (ehVendaParcelada(compra) && idVenda && !pixParcelas[idVenda]?.length && !carregandoPixParcelas[idVenda]) {
                carregarPixParcelas(idVenda);
            }

            if (ehVendaPixAVista(compra) && idVenda && pixVendas[idVenda] === undefined && !carregandoPixVendas[idVenda]) {
                carregarPixVenda(compra);
            }
        });
    }, [carregarPixParcelas, carregarPixVenda, carregandoPixParcelas, carregandoPixVendas, compras, pixParcelas, pixVendas]);

    async function copiarPixVenda(codigo, idVenda) {
        if (!codigo) {
            return;
        }

        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        try {
            await navigator.clipboard.writeText(codigo);
            setCompras((estado) => estado.map((compra) => (
                String(idVendaCompra(compra)) === String(idVenda)
                    ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                    : compra
            )));
            setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "Pix copiado. Pagamento aprovado." }));
        } catch {
            setErroPixVendas((estado) => ({ ...estado, [idVenda]: "Não foi possível copiar o Pix automaticamente." }));
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
                headers: cabecalhoAutorizacao(),
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
        } catch (erroAtual) {
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    function classeStatusPagamento(valor) {
        return textoStatusPagamento(valor) === "Pago" ? css.compra_pago : css.compra_andamento;
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <div>
                    <span>Área do cliente</span>
                    <h1>Minhas compras</h1>
                </div>
                <button type="button" onClick={carregarCompras} disabled={carregando}>
                    {carregando ? "Atualizando..." : "Atualizar"}
                </button>
            </header>

            <section className={css.resumo}>
                <article>
                    <span>Total de compras</span>
                    <strong>{compras.length}</strong>
                </article>
                <article>
                    <span>Pagas</span>
                    <strong>{compras.filter((compra) => textoStatusPagamento(compra.status_pagamento ?? compra.STATUS_PAGAMENTO) === "Pago").length}</strong>
                </article>
                <article>
                    <span>Em andamento</span>
                    <strong>{compras.filter((compra) => textoStatusPagamento(compra.status_pagamento ?? compra.STATUS_PAGAMENTO) !== "Pago").length}</strong>
                </article>
            </section>

            {carregando && (
                <div className={css.estado}>Carregando suas compras...</div>
            )}

            {!carregando && erro && (
                <div className={css.estado}>
                    <strong>Não foi possível carregar suas compras agora.</strong>
                    <span>{erro}</span>
                </div>
            )}

            {!carregando && !erro && compras.length === 0 && (
                <div className={css.estado}>
                    <strong>Você ainda não possui compras registradas.</strong>
                    <span>Quando uma venda for cadastrada no seu nome, ela aparecerá aqui.</span>
                </div>
            )}

            {!carregando && !erro && compras.length > 0 && (
                <section className={css.lista_compras}>
                    {compras.map((compra) => {
                        const idVenda = idVendaCompra(compra);
                        const idVeiculo = idVeiculoCompra(compra);
                        const comprovante = comprovanteCompra(compra);
                        const parcelas = compra.quantidade_parcelas || compra.parcelas || compra.QUANTIDADE_PARCELAS;
                        const valor = compra.valor_venda || compra.valor_total || compra.VALOR_VENDA;
                        const recebido = compra.valor_recebido || compra.VALOR_RECEBIDO;
                        const vendaParcelada = ehVendaParcelada(compra);
                        const vendaPixAVista = ehVendaPixAVista(compra);
                        const parcelasComPix = pixParcelas[idVenda] || [];
                        const carregandoPix = carregandoPixParcelas[idVenda];
                        const erroPix = erroPixParcelas[idVenda];
                        const mensagemPix = mensagemPixParcelas[idVenda];
                        const pixVenda = pixVendas[idVenda] || null;
                        const carregandoPixVenda = carregandoPixVendas[idVenda];
                        const erroPixVenda = erroPixVendas[idVenda];
                        const mensagemPixVenda = mensagemPixVendas[idVenda];
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
                                        <h2>{nomeVeiculoCompra(compra)}</h2>
                                    </div>
                                    <strong className={`${css.status_compra} ${classeStatusPagamento(statusPagamentoCompra)}`}>
                                        {textoStatusPagamento(statusPagamentoCompra)}
                                    </strong>
                                </div>

                                <div className={css.grade_compra}>
                                    <p><strong>Data:</strong> {formatarData(compra.data_venda ?? compra.DATA_VENDA)}</p>
                                    <p><strong>Pagamento:</strong> {textoFormaPagamento(compra.forma_pagamento ?? compra.FORMA_PAGAMENTO)}</p>
                                    <p><strong>Valor:</strong> {formatarMoeda(valor)}</p>
                                    <p><strong>Recebido:</strong> {formatarMoeda(recebido)}</p>
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

                                {vendaPixAVista && idVenda && (
                                    <div className={css.area_pix_parcelas}>
                                        <div className={css.topo_pix_parcelas}>
                                            <div>
                                                <span>Pagamento à vista</span>
                                                <h3>Pix da compra</h3>
                                            </div>
                                            <button type="button" onClick={() => carregarPixVenda(compra, true)} disabled={carregandoPixVenda}>
                                                {carregandoPixVenda ? "Carregando..." : "Atualizar Pix"}
                                            </button>
                                        </div>

                                        {erroPixVenda && <p className={css.erro_pix_parcelas}>{erroPixVenda}</p>}
                                        {mensagemPixVenda && <p className={css.sucesso_pix_parcelas}>{mensagemPixVenda}</p>}

                                        {carregandoPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Carregando Pix da compra...</p>
                                        )}

                                        {!carregandoPixVenda && !erroPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Pix da compra indisponível.</p>
                                        )}

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
                                                    <button type="button" onClick={() => copiarPixVenda(pixVenda.copiaCola, idVenda)}>
                                                        Copiar Pix
                                                    </button>
                                                </label>
                                            </div>
                                        )}
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
                </section>
            )}
        </main>
    );
}

export default MinhasCompras;
