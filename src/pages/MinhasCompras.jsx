// Importa os hooks do React usados para estado, efeitos, memoizacao e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar para outras rotas.
import { useNavigate } from "react-router-dom";
// Importa as classes CSS module desta pagina.
import css from "./MinhasCompras.module.css";

// Monta o cabecalho de autorizacao para chamadas autenticadas na API.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se existir token, envia Authorization Bearer; se nao existir, envia objeto vazio.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tenta descobrir o id do usuario dentro do token JWT.
function idPeloToken() {
    // Busca o token salvo no localStorage.
    const token = localStorage.getItem("access_token");

    // Se nao houver token ou ele nao parecer um JWT, retorna vazio.
    if (!token || !token.includes(".")) {
        return "";
    }

    // Tenta decodificar o payload do token.
    try {
        // Decodifica a segunda parte do JWT e transforma em objeto.
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        // Retorna o id aceitando diferentes nomes de campo.
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        // Se a decodificacao falhar, retorna vazio.
        return "";
    }
}

// Le os dados do usuario logado salvos no navegador.
function lerUsuarioLogado() {
    // Tenta converter o JSON do localStorage em objeto.
    try {
        return JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch {
        // Se o JSON estiver invalido, retorna objeto vazio.
        return {};
    }
}

// Formata um valor numerico como moeda brasileira.
function formatarMoeda(valor) {
    // Converte para numero e aplica o formato BRL.
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Formata uma data para o padrao brasileiro.
function formatarData(valor) {
    // Se nao houver valor, mostra hifen.
    if (!valor) {
        return "-";
    }

    // Converte o valor recebido para texto.
    const texto = String(valor);
    // Verifica se a data esta no formato ISO yyyy-mm-dd.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    // Se for ISO, reorganiza para dd/mm/yyyy sem depender de timezone.
    if (dataIso) {
        const [, ano, mes, dia] = dataIso;
        return `${dia}/${mes}/${ano}`;
    }

    // Tenta criar um objeto Date com o valor recebido.
    const data = new Date(valor);
    // Se a data for invalida, retorna o texto original; senao, formata para pt-BR.
    return Number.isNaN(data.getTime()) ? texto : data.toLocaleDateString("pt-BR");
}

// Converte o codigo ou texto da forma de pagamento para uma label amigavel.
function textoFormaPagamento(valor) {
    // Normaliza o valor para comparacao.
    const forma = String(valor ?? "").trim().toLowerCase();

    // Codigo 0 ou texto com pix vira Pix.
    if (forma === "0" || forma.includes("pix")) {
        return "Pix";
    }

    // Codigo 1 ou texto com parcel vira Parcelamento.
    if (forma === "1" || forma.includes("parcel")) {
        return "Parcelamento";
    }

    // Se nao reconhecer, mostra o valor original ou hifen.
    return valor || "-";
}

// Converte o status de pagamento para texto amigavel.
function textoStatusPagamento(valor) {
    // Normaliza o status para comparacao.
    const status = String(valor ?? "").trim().toLowerCase();

    // Codigo 0 ou texto pago vira Pago.
    if (status === "0" || status.includes("pago")) {
        return "Pago";
    }

    // Codigo 1, andamento ou pendente vira Em andamento.
    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        return "Em andamento";
    }

    // Se nao reconhecer, mostra o valor original ou hifen.
    return valor || "-";
}

// Descobre o id da venda/compra aceitando diferentes campos da API.
function idVendaCompra(compra) {
    return compra?.id_venda || compra?.ID_VENDA || compra?.id || compra?.ID;
}

// Descobre o id do veiculo relacionado a compra.
function idVeiculoCompra(compra) {
    return compra?.id_veiculo || compra?.ID_VEICULO || compra?.id_carro || compra?.ID_CARRO;
}

// Monta o nome do veiculo comprado.
function nomeVeiculoCompra(compra) {
    return compra?.veiculo || compra?.nome_veiculo || compra?.modelo || compra?.nome || "VeÃ­culo";
}

// Verifica se a compra foi feita de forma parcelada.
function ehVendaParcelada(compra) {
    // Normaliza a forma de pagamento.
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    // Le a quantidade de parcelas aceitando varios campos.
    const quantidadeParcelas = Number(String(compra?.quantidade_parcelas ?? compra?.parcelas ?? compra?.QUANTIDADE_PARCELAS ?? 0).replace(",", "."));
    // Considera parcelada por codigo, texto ou quantidade maior que 1.
    return forma === "1" || forma.includes("parcel") || quantidadeParcelas > 1;
}

// Verifica se a compra foi Pix a vista.
function ehVendaPixAVista(compra) {
    // Normaliza a forma de pagamento.
    const forma = String(compra?.forma_pagamento ?? compra?.FORMA_PAGAMENTO ?? compra?.pagamento ?? "").trim().toLowerCase();
    // E Pix a vista quando a forma e Pix e a compra nao e parcelada.
    return (forma === "0" || forma.includes("pix")) && !ehVendaParcelada(compra);
}

// Normaliza os dados de Pix de uma venda a vista.
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
    // Retorna a parcela em um formato unico para a interface.
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

// Verifica se uma parcela ja esta paga.
function parcelaEstaPaga(parcela) {
    // Normaliza a situacao da parcela.
    const situacao = String(parcela?.situacao ?? "").trim().toLowerCase();
    // Considera paga por codigo ou texto.
    return situacao === "1" || situacao === "pago" || situacao === "paga" || situacao.includes("pago") || situacao.includes("paga");
}

// Retorna o texto de situacao da parcela.
function textoSituacaoParcela(parcela) {
    return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
}

// Cria uma chave unica para controlar o estado de uma parcela Pix.
function chaveParcelaPix(idVenda, parcela) {
    return `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
}

// Componente principal da pagina Minhas compras.
function MinhasCompras({ API }) {
    // Cria a funcao para navegar para outras paginas.
    const navigate = useNavigate();
    // Le o usuario uma vez ao montar o componente.
    const usuario = useMemo(() => lerUsuarioLogado(), []);
    // Descobre o id do usuario pelo objeto salvo ou pelo token.
    const idUsuario = usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken();

    // Guarda a lista de compras do usuario.
    const [compras, setCompras] = useState([]);
    // Controla o carregamento inicial da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda erro geral da pagina.
    const [erro, setErro] = useState("");
    // Guarda as parcelas Pix por id da venda.
    const [pixParcelas, setPixParcelas] = useState({});
    // Controla carregamento de Pix das parcelas por venda.
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    // Guarda erros de Pix das parcelas por venda.
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    // Guarda mensagens de sucesso de Pix das parcelas por venda.
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    // Controla qual parcela esta sendo marcada como paga.
    const [pagandoPixParcelas, setPagandoPixParcelas] = useState({});
    // Guarda qual parcela Pix esta selecionada em cada venda.
    const [parcelaPixSelecionada, setParcelaPixSelecionada] = useState({});
    // Guarda os dados de Pix de vendas a vista por id da venda.
    const [pixVendas, setPixVendas] = useState({});
    // Controla carregamento de Pix de venda a vista por venda.
    const [carregandoPixVendas, setCarregandoPixVendas] = useState({});
    // Guarda erros de Pix de venda a vista por venda.
    const [erroPixVendas, setErroPixVendas] = useState({});
    // Guarda mensagens de sucesso de Pix de venda a vista por venda.
    const [mensagemPixVendas, setMensagemPixVendas] = useState({});

    // Monta URL completa para arquivos ou imagens.
    function montarUrlArquivo(valor) {
        // Se nao houver valor, retorna vazio.
        if (!valor) {
            return "";
        }

        // Converte o caminho recebido para texto.
        const caminho = String(valor);

        // Se ja for URL completa ou base64/data URL, usa como veio.
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

    // Monta o parametro de chave Pix da empresa quando ela estiver salva.
    function parametroChavePixAtual() {
        // Busca a chave Pix salva no navegador.
        const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
        // Se existir chave, adiciona na query string; senao, retorna vazio.
        return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
    }

    // Carrega as compras do usuario tentando rotas conhecidas da API.
    const carregarCompras = useCallback(async () => {
        // Se nao houver id do usuario, nao da para buscar compras.
        if (!idUsuario) {
            setCompras([]);
            setCarregando(false);
            setErro("NÃ£o foi possÃ­vel identificar o usuÃ¡rio logado.");
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

        // Tenta cada rota ate encontrar uma resposta valida.
        for (const rota of rotas) {
            try {
                // Faz a requisicao para a rota atual.
                const resposta = await fetch(`${API}${rota}`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });

                // Se a rota nao respondeu sucesso, tenta a proxima.
                if (!resposta.ok) {
                    continue;
                }

                // Converte a resposta em JSON.
                const dados = await resposta.json();
                // Aceita lista direta ou dentro de propriedades comuns.
                const lista = Array.isArray(dados)
                    ? dados
                    : dados.compras || dados.vendas || dados.pedidos || [];

                // Salva a lista de compras.
                setCompras(Array.isArray(lista) ? lista : []);
                // Desliga o carregamento.
                setCarregando(false);
                // Encerra a funcao porque uma rota funcionou.
                return;
            } catch {
                // Tenta a proxima rota conhecida.
            }
        }

        // Se nenhuma rota funcionou, limpa a lista.
        setCompras([]);
        // Mostra erro geral.
        setErro("Ainda nÃ£o foi possÃ­vel carregar suas compras.");
        // Desliga o carregamento.
        setCarregando(false);
    }, [API, idUsuario]);

    // Carrega os Pix das parcelas de uma venda.
    const carregarPixParcelas = useCallback(async (idVenda) => {
        // Se nao houver id ou as parcelas ja foram carregadas, nao faz nada.
        if (!idVenda || pixParcelas[idVenda]?.length) {
            return;
        }

        // Marca esta venda como carregando Pix de parcelas.
        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        // Limpa erro de Pix desta venda.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta buscar os Pix das parcelas.
        try {
            // Faz a requisicao para listar Pix das parcelas.
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte a resposta para JSON.
            const dados = await resposta.json();

            // Trata erro retornado pela API.
            if (!resposta.ok) {
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                return;
            }

            // Aceita a lista em varios formatos de resposta.
            const lista = Array.isArray(dados)
                ? dados
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            // Salva as parcelas normalizadas no estado.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: Array.isArray(lista) ? lista.map(normalizarParcelaPix) : []
            }));
        } catch {
            // Mostra erro quando nao consegue conectar ao servidor.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "NÃ£o foi possÃ­vel conectar ao servidor para carregar o Pix das parcelas."
            }));
        } finally {
            // Desliga o carregamento desta venda.
            setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixParcelas]);

    // Carrega o Pix de uma venda a vista.
    const carregarPixVenda = useCallback(async (compra, forcar = false) => {
        // Descobre o id da venda.
        const idVenda = idVendaCompra(compra);

        // Se nao houver venda ou ela nao for Pix a vista, nao faz nada.
        if (!idVenda || !ehVendaPixAVista(compra)) {
            return;
        }

        // Verifica se o Pix ja foi carregado.
        const pixJaCarregado = pixVendas[idVenda];

        // Se nao for recarregamento forcado e ja tiver Pix, nao busca novamente.
        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            return;
        }

        // Tenta aproveitar dados de Pix que ja vieram dentro da compra.
        const pixDaCompra = normalizarPixVenda(compra);

        // Se a compra ja contem Pix e nao foi forcado, salva e encerra.
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
            // Faz a requisicao do Pix da venda, incluindo a chave Pix se houver.
            const resposta = await fetch(`${API}/pix_venda/${idVenda}${parametroChavePixAtual()}`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Converte a resposta em JSON.
            const dados = await resposta.json();

            // Trata resposta de erro da API.
            if (!resposta.ok) {
                setPixVendas((estado) => ({ ...estado, [idVenda]: null }));
                setErroPixVendas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponÃ­vel para esta compra."
                }));
                return;
            }

            // Salva o Pix normalizado e uma versao para indicar atualizacao.
            setPixVendas((estado) => ({ ...estado, [idVenda]: { ...normalizarPixVenda(dados), versaoPix: Date.now() } }));
        } catch {
            // Mostra erro quando nao foi possivel buscar o Pix.
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: "NÃ£o foi possÃ­vel carregar o Pix agora."
            }));
        } finally {
            // Desliga o carregamento do Pix desta venda.
            setCarregandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }, [API, pixVendas]);

    // Busca as compras quando a pagina abre.
    useEffect(() => {
        carregarCompras();
    }, [carregarCompras]);

    // Depois de carregar compras, busca os Pix necessarios para cada tipo de venda.
    useEffect(() => {
        // Percorre todas as compras carregadas.
        compras.forEach((compra) => {
            // Descobre o id da venda atual.
            const idVenda = idVendaCompra(compra);

            // Para venda parcelada, carrega os Pix das parcelas se ainda nao carregou.
            if (ehVendaParcelada(compra) && idVenda && !pixParcelas[idVenda]?.length && !carregandoPixParcelas[idVenda]) {
                carregarPixParcelas(idVenda);
            }

            // Para venda Pix a vista, carrega o Pix da compra se ainda nao carregou.
            if (ehVendaPixAVista(compra) && idVenda && pixVendas[idVenda] === undefined && !carregandoPixVendas[idVenda]) {
                carregarPixVenda(compra);
            }
        });
    }, [carregarPixParcelas, carregarPixVenda, carregandoPixParcelas, carregandoPixVendas, compras, pixParcelas, pixVendas]);

    // Copia o Pix de uma venda a vista e marca a compra como paga localmente.
    async function copiarPixVenda(codigo, idVenda) {
        // Se nao houver codigo Pix, nao faz nada.
        if (!codigo) {
            return;
        }

        // Limpa erro anterior desta venda.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        // Limpa mensagem anterior desta venda.
        setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta copiar o codigo para a area de transferencia.
        try {
            // Copia o codigo Pix.
            await navigator.clipboard.writeText(codigo);
            // Atualiza a compra localmente como paga.
            setCompras((estado) => estado.map((compra) => (
                String(idVendaCompra(compra)) === String(idVenda)
                    ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                    : compra
            )));
            // Mostra mensagem de sucesso.
            setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "Pix copiado. Pagamento aprovado." }));
        } catch {
            // Mostra erro se o navegador nao permitir copiar automaticamente.
            setErroPixVendas((estado) => ({ ...estado, [idVenda]: "NÃ£o foi possÃ­vel copiar o Pix automaticamente." }));
        }
    }

    // Copia o Pix de uma parcela e tenta marcar a parcela como paga.
    async function copiarPixParcela(codigo, idVenda, parcela) {
        // Se nao houver codigo Pix, nao faz nada.
        if (!codigo) {
            return;
        }

        // Cria uma chave unica para controlar o botao desta parcela.
        const chave = chaveParcelaPix(idVenda, parcela);
        // Limpa erro anterior das parcelas desta venda.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Limpa mensagem anterior das parcelas desta venda.
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Marca esta parcela como em processamento.
        setPagandoPixParcelas((estado) => ({ ...estado, [chave]: true }));

        // Tenta copiar e atualizar a parcela.
        try {
            // Copia o codigo Pix para a area de transferencia.
            await navigator.clipboard.writeText(codigo);

            // Se a parcela nao tem id ou ja esta paga, apenas informa que o Pix foi copiado.
            if (!parcela?.id || parcelaEstaPaga(parcela)) {
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Pix copiado. Esta parcela jÃ¡ estÃ¡ paga."
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
            const dados = await resposta.json();

            // Se a API retornou erro, dispara excecao.
            if (!resposta.ok) {
                throw new Error(dados.erro || dados.mensagem || "NÃ£o foi possÃ­vel marcar a parcela como paga.");
            }

            // Atualiza a situacao da parcela no estado local.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id) === String(parcela.id)
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        : item
                ))
            }));

            // Se a API informou que a compra foi quitada, marca a compra como paga.
            if (dados.compra_quitada) {
                setCompras((estado) => estado.map((compra) => (
                    String(idVendaCompra(compra)) === String(idVenda)
                        ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                        : compra
                )));
            }

            // Mostra mensagem de sucesso conforme a compra esteja quitada ou nao.
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: dados.compra_quitada
                    ? "Pix copiado. Todas as parcelas foram pagas. Compra quitada."
                    : "Pix copiado. Parcela marcada como paga."
            }));
        } catch (erroAtual) {
            // Mostra erro caso copiar ou marcar a parcela falhe.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "NÃ£o foi possÃ­vel copiar o Pix e marcar a parcela como paga."
            }));
        } finally {
            // Libera o botao da parcela.
            setPagandoPixParcelas((estado) => ({ ...estado, [chave]: false }));
        }
    }

    // Escolhe a classe CSS do status de pagamento.
    function classeStatusPagamento(valor) {
        return textoStatusPagamento(valor) === "Pago" ? css.compra_pago : css.compra_andamento;
    }

    // Renderiza a tela de minhas compras.
    return (
        // Container principal da pagina.
        <main className={css.pagina}>
            {/* Cabecalho com titulo e botao de atualizar. */}
            <header className={css.cabecalho}>
                <div>
                    <span>Ãrea do cliente</span>
                    <h1>Minhas compras</h1>
                </div>
                <button type="button" onClick={carregarCompras} disabled={carregando}>
                    {carregando ? "Atualizando..." : "Atualizar"}
                </button>
            </header>

            {/* Cards de resumo das compras. */}
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

            {/* Estado exibido durante carregamento. */}
            {carregando && (
                <div className={css.estado}>Carregando suas compras...</div>
            )}

            {/* Estado exibido quando ocorreu erro ao carregar compras. */}
            {!carregando && erro && (
                <div className={css.estado}>
                    <strong>NÃ£o foi possÃ­vel carregar suas compras agora.</strong>
                    <span>{erro}</span>
                </div>
            )}

            {/* Estado vazio quando o usuario ainda nao possui compras. */}
            {!carregando && !erro && compras.length === 0 && (
                <div className={css.estado}>
                    <strong>VocÃª ainda nÃ£o possui compras registradas.</strong>
                    <span>Quando uma venda for cadastrada no seu nome, ela aparecerÃ¡ aqui.</span>
                </div>
            )}

            {/* Lista de compras quando existem dados carregados. */}
            {!carregando && !erro && compras.length > 0 && (
                <section className={css.lista_compras}>
                    {/* Cria um card para cada compra. */}
                    {compras.map((compra) => {
                        // Guarda o id da venda.
                        const idVenda = idVendaCompra(compra);
                        // Guarda o id do veiculo.
                        const idVeiculo = idVeiculoCompra(compra);
                        // Monta a URL do comprovante, se houver.
                        const comprovante = comprovanteCompra(compra);
                        // Le a quantidade de parcelas da compra.
                        const parcelas = compra.quantidade_parcelas || compra.parcelas || compra.QUANTIDADE_PARCELAS;
                        // Le o valor total da venda.
                        const valor = compra.valor_venda || compra.valor_total || compra.VALOR_VENDA;
                        // Le o valor recebido da venda.
                        const recebido = compra.valor_recebido || compra.VALOR_RECEBIDO;
                        // Define se esta compra e parcelada.
                        const vendaParcelada = ehVendaParcelada(compra);
                        // Define se esta compra e Pix a vista.
                        const vendaPixAVista = ehVendaPixAVista(compra);
                        // Busca as parcelas Pix ja carregadas para esta venda.
                        const parcelasComPix = pixParcelas[idVenda] || [];
                        // Le o carregamento de Pix das parcelas desta venda.
                        const carregandoPix = carregandoPixParcelas[idVenda];
                        // Le erro de Pix das parcelas desta venda.
                        const erroPix = erroPixParcelas[idVenda];
                        // Le mensagem de sucesso de Pix das parcelas desta venda.
                        const mensagemPix = mensagemPixParcelas[idVenda];
                        // Le o Pix da venda a vista, se houver.
                        const pixVenda = pixVendas[idVenda] || null;
                        // Le carregamento do Pix da venda a vista.
                        const carregandoPixVenda = carregandoPixVendas[idVenda];
                        // Le erro do Pix da venda a vista.
                        const erroPixVenda = erroPixVendas[idVenda];
                        // Le mensagem do Pix da venda a vista.
                        const mensagemPixVenda = mensagemPixVendas[idVenda];
                        // Verifica se todas as parcelas foram pagas.
                        const compraQuitadaParcelas = vendaParcelada && parcelasComPix.length > 0 && parcelasComPix.every(parcelaEstaPaga);
                        // Se todas as parcelas estao pagas, considera a compra paga.
                        const statusPagamentoCompra = compraQuitadaParcelas ? 0 : (compra.status_pagamento ?? compra.STATUS_PAGAMENTO);
                        // Recupera o indice salvo da parcela selecionada.
                        const indiceSalvoPix = Number(parcelaPixSelecionada[idVenda] ?? 0);
                        // Garante que o indice selecionado fique dentro do tamanho da lista.
                        const indiceParcelaPix = Number.isFinite(indiceSalvoPix)
                            ? Math.min(Math.max(indiceSalvoPix, 0), Math.max(parcelasComPix.length - 1, 0))
                            : 0;
                        // Seleciona a parcela Pix atual.
                        const parcelaPixAtual = parcelasComPix[indiceParcelaPix];
                        // Cria a chave da parcela atual.
                        const chavePixAtual = chaveParcelaPix(idVenda, parcelaPixAtual);
                        // Verifica se a parcela atual esta em processamento.
                        const pagandoPixAtual = Boolean(pagandoPixParcelas[chavePixAtual]);

                        // Retorna o card da compra.
                        return (
                            <article key={idVenda || `${nomeVeiculoCompra(compra)}-${compra.data_venda}`} className={`${css.card_compra} ${vendaParcelada ? css.card_compra_parcelada : ""}`}>
                                {/* Topo do card com nome do veiculo e status. */}
                                <div className={css.topo_compra}>
                                    <div>
                                        <span>VeÃ­culo</span>
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
                                    <p><strong>Parcelas:</strong> {parcelas || "Ã€ vista"}</p>
                                </div>

                                {/* Acoes gerais da compra. */}
                                <div className={css.acoes_compra}>
                                    {/* Botao para abrir detalhes do veiculo. */}
                                    {idVeiculo && (
                                        <button type="button" onClick={() => navigate(`/detalhesVeiculos/${idVeiculo}`)}>
                                            Ver veÃ­culo
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
                                {vendaParcelada && idVenda && compraQuitadaParcelas && (
                                    <div className={css.area_pix_parcelas}>
                                        <p className={css.sucesso_pix_parcelas}>
                                            Compra paga por completo. Todas as parcelas foram quitadas.
                                        </p>
                                    </div>
                                )}

                                {/* Area de Pix para compras a vista. */}
                                {vendaPixAVista && idVenda && (
                                    <div className={css.area_pix_parcelas}>
                                        <div className={css.topo_pix_parcelas}>
                                            <div>
                                                <span>Pagamento Ã  vista</span>
                                                <h3>Pix da compra</h3>
                                            </div>
                                            <button type="button" onClick={() => carregarPixVenda(compra, true)} disabled={carregandoPixVenda}>
                                                {carregandoPixVenda ? "Carregando..." : "Atualizar Pix"}
                                            </button>
                                        </div>

                                        {/* Mensagens do Pix da venda a vista. */}
                                        {erroPixVenda && <p className={css.erro_pix_parcelas}>{erroPixVenda}</p>}
                                        {mensagemPixVenda && <p className={css.sucesso_pix_parcelas}>{mensagemPixVenda}</p>}

                                        {/* Estado de carregamento do Pix da compra. */}
                                        {carregandoPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Carregando Pix da compra...</p>
                                        )}

                                        {/* Estado vazio quando o Pix da compra nao esta disponivel. */}
                                        {!carregandoPixVenda && !erroPixVenda && !pixVenda && (
                                            <p className={css.estado_pix_parcelas}>Pix da compra indisponÃ­vel.</p>
                                        )}

                                        {/* Conteudo do Pix da venda a vista. */}
                                        {pixVenda && (
                                            <div className={css.pix_conteudo_unico}>
                                                <div className={css.pix_qrcode_area}>
                                                    {pixVenda.qrcode ? (
                                                        <img src={montarUrlArquivo(pixVenda.qrcode)} alt={`QR Code Pix da compra ${idVenda || ""}`} />
                                                    ) : (
                                                        <span>QR Code indisponÃ­vel</span>
                                                    )}
                                                </div>

                                                <label className={css.pix_copia_cola}>
                                                    <span>Pix cÃ³pia e cola</span>
                                                    <textarea value={pixVenda.copiaCola || ""} readOnly />
                                                    <button type="button" onClick={() => copiarPixVenda(pixVenda.copiaCola, idVenda)}>
                                                        Copiar Pix
                                                    </button>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Area de Pix para compras parceladas ainda nao quitadas. */}
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

                                        {/* Mensagens do Pix das parcelas. */}
                                        {erroPix && <p className={css.erro_pix_parcelas}>{erroPix}</p>}
                                        {mensagemPix && <p className={css.sucesso_pix_parcelas}>{mensagemPix}</p>}

                                        {/* Estado de carregamento das parcelas Pix. */}
                                        {carregandoPix && parcelasComPix.length === 0 && (
                                            <p className={css.estado_pix_parcelas}>Carregando Pix das parcelas...</p>
                                        )}

                                        {/* Estado vazio quando nao ha Pix de parcelas. */}
                                        {!carregandoPix && !erroPix && parcelasComPix.length === 0 && (
                                            <p className={css.estado_pix_parcelas}>Nenhum Pix de parcela encontrado para esta venda.</p>
                                        )}

                                        {/* Conteudo da parcela Pix selecionada. */}
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

                                                {/* QR Code e codigo copia e cola da parcela. */}
                                                <div className={css.pix_conteudo_unico}>
                                                    <div className={css.pix_qrcode_area}>
                                                        {parcelaPixAtual.qrcode ? (
                                                            <img src={montarUrlArquivo(parcelaPixAtual.qrcode)} alt={`QR Code Pix da parcela ${parcelaPixAtual.numero || ""}`} />
                                                        ) : (
                                                            <span>QR Code indisponÃ­vel</span>
                                                        )}
                                                    </div>

                                                    <label className={css.pix_copia_cola}>
                                                        <span>Pix cÃ³pia e cola</span>
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

// Exporta a pagina para ser usada nas rotas da aplicacao.
export default MinhasCompras;
