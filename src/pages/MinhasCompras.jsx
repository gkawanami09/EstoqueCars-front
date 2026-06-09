// Importa os hooks do React usados para estado, efeitos, memorização e callbacks.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para navegar para outras rotas.
import { useNavigate } from "react-router-dom";
// Importa as classes CSS module desta página.
import css from "./MinhasCompras.module.css";

/*
GUIA DETALHADO DOS ITENS DA SPRINT IMPLEMENTADOS NESTE ARQUIVO

1. CRIAR PÁGINA "MINHAS COMPRAS"
   - O componente MinhasCompras identifica o cliente que está logado.
   - A função carregarCompras consulta as vendas pertencentes a esse cliente.
   - Cada compra é exibida em um card com veículo, data, valor, forma de pagamento e status.

2. EXIBIR O STATUS DE CADA COMPRA
   - A função textoStatusPagamento transforma os códigos da API em "Pago" ou "Em andamento".
   - A função compraEstaPagaExibicao também considera pagamentos confirmados nesta tela.
   - O status final é exibido no topo de cada card e nos contadores de resumo da página.

3. PERMITIR PAGAMENTO VIA PIX NAS PARCELAS
   - A função carregarPixParcelas busca os dados Pix de cada parcela da venda.
   - A interface mostra parcela, valor, vencimento, status, QR Code e Pix copia e cola.
   - O cliente copia o Pix, realiza o pagamento e clica em "Confirmar pagamento".
   - A função confirmarPagamentoPixParcela avisa o backend que a parcela foi paga.

4. REGISTRAR AUTOMATICAMENTE A RECEITA APÓS O PAGAMENTO
   - Depois da confirmação, registrarReceitaParcela cria uma entrada no financeiro.
   - Para Pix à vista, registrarReceitaVendaPix executa o mesmo processo com o valor total.
   - Antes de cadastrar, o sistema verifica se a receita já existe para evitar duplicação.

IMPORTANTE:
O front-end não consulta diretamente o banco para saber se o Pix realmente caiu.
Neste fluxo, o registro da receita e a mudança de status acontecem quando o cliente
clica no botão "Confirmar pagamento" e a API aceita a confirmação.
*/

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
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "-";
    }

    // Converte o valor recebido para texto.
    const texto = String(valor);
    // Verifica se a data está no formato ISO yyyy-mm-dd.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);

    // Se for ISO, reorganiza para dd/mm/yyyy sem depender de timezone.
    if (dataIso) {
        // Declara os dados usados neste fluxo.
        const [, ano, mes, dia] = dataIso;
        // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Pix";
    }

    // Código 1 ou texto com parcela vira Parcelamento.
    if (forma === "1" || forma.includes("parcel")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Parcelamento";
    }

    // Se não reconhecer, mostra o valor original ou hífen.
    return valor || "-";
}

// ITEM DA SPRINT: "Exibir o status de cada compra".
// Converte o status recebido da API para o texto amigável mostrado no card da compra.
function textoStatusPagamento(valor) {
    // Converte número, texto ou valor vazio para uma string minúscula comparável.
    const status = String(valor ?? "").trim().toLowerCase();

    // Neste projeto, o código 0 representa pagamento concluído.
    // A verificação por texto também aceita respostas como "pago" ou "Pagamento pago".
    if (status === "0" || status.includes("pago")) {
        // Retorna o texto que será mostrado visualmente para uma compra concluída.
        return "Pago";
    }

    // O código 1 e textos com "andamento" ou "pendente" representam pagamento não concluído.
    if (status === "1" || status.includes("andamento") || status.includes("pendente")) {
        // Retorna o texto que será mostrado enquanto ainda existe pagamento pendente.
        return "Em andamento";
    }

    // Se a API enviar outro status, ele é mostrado como veio para não esconder informação.
    return valor || "-";
}

// Descobre o ID da venda/compra aceitando diferentes campos da API.
function idVendaCompra(compra) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return compra?.id_venda || compra?.ID_VENDA || compra?.id || compra?.ID;
}

// Descobre o ID do veículo relacionado à compra.
function idVeiculoCompra(compra) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return compra?.id_veiculo || compra?.ID_VEICULO || compra?.id_carro || compra?.ID_CARRO;
}

// Monta o nome do veículo comprado.
function nomeVeiculoCompra(compra) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
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
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return parcelaEstaPaga(parcela) ? "Pago" : "Pendente";
}

// Cria uma chave única para controlar o estado de uma parcela Pix.
function chaveParcelaPix(idVenda, parcela) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return `${idVenda}-${parcela?.id || parcela?.numero || "parcela"}`;
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

// Declara comprasPagasLocalStorage para uso neste fluxo.
const comprasPagasLocalStorage = "estoquecars_compras_pagas_confirmadas";
// Declara parcelasPagasLocalStorage para uso neste fluxo.
const parcelasPagasLocalStorage = "estoquecars_parcelas_pix_pagas_confirmadas";
// Declara comprasCanceladasLocalStorage para uso neste fluxo.
const comprasCanceladasLocalStorage = "estoquecars_compras_pix_canceladas";
// Declara parcelasCanceladasLocalStorage para uso neste fluxo.
const parcelasCanceladasLocalStorage = "estoquecars_parcelas_pix_canceladas";
// Declara receitasRegistradasLocalStorage para uso neste fluxo.
const receitasRegistradasLocalStorage = "estoquecars_receitas_pix_registradas";
// Declara receitasFinanceiroIdsLocalStorage para uso neste fluxo.
const receitasFinanceiroIdsLocalStorage = "estoquecars_receitas_pix_financeiro_ids";

// Declara a função lerListaLocalStorage usada por esta página.
function lerListaLocalStorage(chave) {
    // Tenta executar a operação e permite tratar possíveis falhas.
    try {
        // Declara lista para uso neste fluxo.
        const lista = JSON.parse(localStorage.getItem(chave) || "[]");
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Array.isArray(lista) ? lista.map(String) : [];
    } catch {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return [];
    }
}

// Declara a função itemExisteNoLocalStorage usada por esta página.
function itemExisteNoLocalStorage(chave, id) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return lerListaLocalStorage(chave).includes(String(id));
}

// Declara a função salvarItemLocalStorage usada por esta página.
function salvarItemLocalStorage(chave, id) {
    // Declara lista para uso neste fluxo.
    const lista = lerListaLocalStorage(chave);
    // Declara texto para uso neste fluxo.
    const texto = String(id);

    // Verifica esta condição antes de continuar o fluxo.
    if (!lista.includes(texto)) {
        // Atualiza o estado por meio de setItem.
        localStorage.setItem(chave, JSON.stringify([...lista, texto]));
    }
}

// Declara a função removerItemLocalStorage usada por esta página.
function removerItemLocalStorage(chave, id) {
    // Declara texto para uso neste fluxo.
    const texto = String(id);
    // Declara lista para uso neste fluxo.
    const lista = lerListaLocalStorage(chave).filter((item) => item !== texto);
    // Atualiza o estado por meio de setItem.
    localStorage.setItem(chave, JSON.stringify(lista));
}

// Declara a função lerObjetoLocalStorage usada por esta página.
function lerObjetoLocalStorage(chave) {
    // Tenta executar a operação e permite tratar possíveis falhas.
    try {
        // Declara objeto para uso neste fluxo.
        const objeto = JSON.parse(localStorage.getItem(chave) || "{}");
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return objeto && typeof objeto === "object" && !Array.isArray(objeto) ? objeto : {};
    } catch {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }
}

// Declara a função salvarValorObjetoLocalStorage usada por esta página.
function salvarValorObjetoLocalStorage(chave, id, valor) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!id || !valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return;
    }

    // Atualiza o estado por meio de setItem.
    localStorage.setItem(chave, JSON.stringify({
        ...lerObjetoLocalStorage(chave),
        [String(id)]: String(valor)
    }));
}

// Declara a função removerValorObjetoLocalStorage usada por esta página.
function removerValorObjetoLocalStorage(chave, id) {
    // Declara objeto para uso neste fluxo.
    const objeto = lerObjetoLocalStorage(chave);
    // Executa esta etapa do fluxo.
    delete objeto[String(id)];
    // Atualiza o estado por meio de setItem.
    localStorage.setItem(chave, JSON.stringify(objeto));
}

// Declara a função idFinanceiroResposta usada por esta página.
function idFinanceiroResposta(dados) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
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

// Declara a função idFinanceiroTransacao usada por esta página.
function idFinanceiroTransacao(transacao) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return transacao?.id_financeiro || transacao?.ID_FINANCEIRO || transacao?.id || transacao?.ID;
}

// Declara a função normalizarTextoBusca usada por esta página.
function normalizarTextoBusca(valor) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

// Declara a função valorFinanceiroNumero usada por esta página.
function valorFinanceiroNumero(transacao) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return valorParaNumero(transacao?.valor ?? transacao?.VALOR ?? transacao?.valor_financeiro ?? transacao?.VALOR_FINANCEIRO);
}

// Declara a função buscarIdsReceitasFinanceiras usada por esta página.
async function buscarIdsReceitasFinanceiras(API, { descricaoReceita = "", idVenda = "", valor = 0 } = {}) {
    // Declara resposta para uso neste fluxo.
    const resposta = await fetch(`${API}/listar_financeiro`, {
        method: "GET",
        headers: cabecalhoAutorizacao(),
        credentials: "include"
    });
    // Declara dados para uso neste fluxo.
    const dados = await lerRespostaJson(resposta);

    // Verifica esta condição antes de continuar o fluxo.
    if (!resposta.ok) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Declara lista para uso neste fluxo.
    const lista = Array.isArray(dados)
        ? dados
        : dados.transacoes || dados.financeiro || [];
    // Declara descricaoEsperada para uso neste fluxo.
    const descricaoEsperada = normalizarTextoBusca(descricaoReceita);
    // Declara codigoVenda para uso neste fluxo.
    const codigoVenda = idVenda ? normalizarTextoBusca(`codigo da venda: ${idVenda}`) : "";
    // Declara vendaNumero para uso neste fluxo.
    const vendaNumero = idVenda ? normalizarTextoBusca(`venda #${idVenda}`) : "";
    // Declara valorEsperado para uso neste fluxo.
    const valorEsperado = valorParaNumero(valor);

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return lista.filter((transacao) => {
        // Declara tipo para uso neste fluxo.
        const tipo = String(transacao?.tipo || transacao?.TIPO_TEXTO || "").trim().toLowerCase();
        // Declara descricao para uso neste fluxo.
        const descricao = normalizarTextoBusca(transacao?.descricao || transacao?.DESCRICAO);
        // Declara ehReceita para uso neste fluxo.
        const ehReceita = tipo === "entrada" || tipo === "receita" || tipo === "0" || tipo === "";
        // Declara bateDescricao para uso neste fluxo.
        const bateDescricao = Boolean(descricaoEsperada && descricao === descricaoEsperada) ||
            Boolean(codigoVenda && descricao.includes(codigoVenda)) ||
            Boolean(vendaNumero && descricao.includes(vendaNumero));
        // Declara bateValor para uso neste fluxo.
        const bateValor = !valorEsperado || Math.abs(valorFinanceiroNumero(transacao) - valorEsperado) < 0.01;

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return ehReceita && bateDescricao && bateValor;
    }).map(idFinanceiroTransacao).filter(Boolean);
}

// Declara a função excluirReceitaFinanceira usada por esta página.
async function excluirReceitaFinanceira(API, chaveReceita, { descricaoReceita = "", idVenda = "", valor = 0 } = {}) {
    // Declara idsReceitas para uso neste fluxo.
    const idsReceitas = lerObjetoLocalStorage(receitasFinanceiroIdsLocalStorage);
    // Declara idsFinanceiros para uso neste fluxo.
    const idsFinanceiros = [
        idsReceitas[chaveReceita],
        ...await buscarIdsReceitasFinanceiras(API, { descricaoReceita, idVenda, valor })
    ].filter(Boolean);

    // Percorre os itens necessários para executar esta etapa.
    for (const idFinanceiro of [...new Set(idsFinanceiros)]) {
        // Declara resposta para uso neste fluxo.
        const resposta = await fetch(`${API}/excluir_financeiro/${idFinanceiro}`, {
            method: "DELETE",
            headers: cabecalhoAutorizacao(),
            credentials: "include"
        });

        // Verifica esta condição antes de continuar o fluxo.
        if (!resposta.ok && resposta.status !== 404) {
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error(dados.erro || dados.mensagem || "Pagamento cancelado, mas não foi possível remover a receita do financeiro.");
        }
    }

    // Executa removerItemLocalStorage nesta etapa do fluxo.
    removerItemLocalStorage(receitasRegistradasLocalStorage, chaveReceita);
    // Executa removerValorObjetoLocalStorage nesta etapa do fluxo.
    removerValorObjetoLocalStorage(receitasFinanceiroIdsLocalStorage, chaveReceita);
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

// Declara a função dataCompraParaOrdenacao usada por esta página.
function dataCompraParaOrdenacao(compra) {
    // Declara valor para uso neste fluxo.
    const valor = compra?.data_venda ?? compra?.DATA_VENDA ?? compra?.data ?? compra?.DATA ?? "";
    // Declara texto para uso neste fluxo.
    const texto = String(valor).trim();

    // Verifica esta condição antes de continuar o fluxo.
    if (!texto) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return 0;
    }

    // Declara data para uso neste fluxo.
    const data = new Date(texto);

    // Verifica esta condição antes de continuar o fluxo.
    if (!Number.isNaN(data.getTime())) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return data.getTime();
    }

    // Declara dataBr para uso neste fluxo.
    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataBr) {
        // Declara os dados usados neste fluxo.
        const [, dia, mes, ano] = dataBr;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime();
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return 0;
}

// Declara a função ordenarComprasCronologicamente usada por esta página.
function ordenarComprasCronologicamente(compras) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return [...compras].sort((a, b) => {
        // Declara dataA para uso neste fluxo.
        const dataA = dataCompraParaOrdenacao(a);
        // Declara dataB para uso neste fluxo.
        const dataB = dataCompraParaOrdenacao(b);

        // Verifica esta condição antes de continuar o fluxo.
        if (dataA !== dataB) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return dataA - dataB;
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return String(idVendaCompra(a) || "").localeCompare(String(idVendaCompra(b) || ""), "pt-BR", { numeric: true });
    });
}

// Declara a função aplicarPagamentoLocal usada por esta página.
function aplicarPagamentoLocal(compra) {
    // Declara idVenda para uso neste fluxo.
    const idVenda = idVendaCompra(compra);

    // Verifica esta condição antes de continuar o fluxo.
    if (idVenda && itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return { ...compra, status_pagamento: 1, STATUS_PAGAMENTO: 1 };
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (!idVenda || !itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return compra;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 };
}

// Declara a função aplicarParcelaPagaLocal usada por esta página.
function aplicarParcelaPagaLocal(idVenda, parcela) {
    // Declara chaveParcela para uso neste fluxo.
    const chaveParcela = parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`;

    // Verifica esta condição antes de continuar o fluxo.
    if (chaveParcela && itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, chaveParcela)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return { ...parcela, situacao: 0 };
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (!chaveParcela || !itemExisteNoLocalStorage(parcelasPagasLocalStorage, chaveParcela)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return parcela;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return { ...parcela, situacao: 1 };
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

    // Interrompe o fluxo informando o erro encontrado.
    throw new Error("Não foi possível confirmar o pagamento na API.");
}

//Quando o pagamento é confirmado, o backend retorna um JSON dizendo que 
// deu certo. Nesse JSON vem o status_pagamento: 0, o id_venda, se a receita 
// foi registrada e o id_financeiro. Aí o front usa esse retorno para atualizar 
// a compra na tela como paga e mostrar que a receita já foi registrada.

// Sprint: Criar página Minhas Compras.
// Este componente reúne a listagem das compras, os status e as opções de pagamento do cliente.
function MinhasCompras({ API }) {
    // Cria a função para navegar para outras páginas.
    const navigate = useNavigate();
    // Lê o usuário uma vez ao montar o componente.
    const usuario = useMemo(() => lerUsuarioLogado(), []);
    // Descobre o ID do usuário pelo objeto salvo ou pelo token.
    const idUsuario = usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken();

    // estados usados para criar e controlar a página "Minhas Compras".
    // Guarda a lista usada para criar os cards da página.
    // Quando setCompras é chamado, o React atualiza automaticamente a lista exibida.
    const [compras, setCompras] = useState([]);
    // Controla o carregamento inicial da lista.
    const [carregando, setCarregando] = useState(true);
    // Guarda erro geral da página.
    const [erro, setErro] = useState("");
    // Guarda as parcelas Pix separadas pelo ID da venda.
    // Exemplo: pixParcelas[54] contém todas as parcelas Pix da venda 54.
    const [pixParcelas, setPixParcelas] = useState({});
    // Controla carregamento de Pix das parcelas por venda.
    const [carregandoPixParcelas, setCarregandoPixParcelas] = useState({});
    // Guarda erros de Pix das parcelas por venda.
    const [erroPixParcelas, setErroPixParcelas] = useState({});
    // Guarda mensagens de sucesso de Pix das parcelas por venda.
    const [mensagemPixParcelas, setMensagemPixParcelas] = useState({});
    // Controla qual parcela está sendo confirmada para desabilitar o botão durante a requisição.
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
    // Declara os dados usados neste fluxo.
    const [pagandoPixVendas, setPagandoPixVendas] = useState({});
    // Controla qual compra está aberta para mostrar Pix ou parcelas.
    const [compraAbertaId, setCompraAbertaId] = useState("");

    // Monta URL completa para arquivos ou imagens.
    function montarUrlArquivo(valor) {
        // Se não houver valor, retorna vazio.
        if (!valor) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "";
        }

        // Converte o caminho recebido para texto.
        const caminho = String(valor);

        // Se já for URL completa ou base64/data URL, usa como veio.
        if (caminho.startsWith("http") || caminho.startsWith("data:")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return caminho;
        }

        // Se vier com barra inicial, concatena direto com a API.
        if (caminho.startsWith("/")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return `${API}${caminho}`;
        }

        // Se vier caminho relativo, adiciona a barra entre API e caminho.
        return `${API}/${caminho}`;
    }

    // Monta a URL do comprovante de uma compra.
    function comprovanteCompra(compra) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return montarUrlArquivo(compra?.comprovante || compra?.comprovante_url || compra?.arquivo_comprovante);
    }

    // Monta o parâmetro de chave Pix da empresa quando ela estiver salva.
    function parametroChavePixAtual() {
        // Busca a chave Pix salva no navegador.
        const chavePix = String(localStorage.getItem("chave_pix_empresa") || "").trim();
        // Se existir chave, adiciona na query string; senão, retorna vazio.
        return chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
    }

    //A página MinhasCompras pega o usuário logado, busca na API as compras desse usuário 
    // e salva no estado compras. Depois ela usa essa lista para montar os cards na tela, 
    // mostrando veículo, valor, forma de pagamento, parcelas e status. Também é nessa página
    //  que aparecem os Pix das parcelas e os botões de confirmar ou cancelar pagamento.
    // SPRINt Criar página Minhas Compras
    // Carrega somente as compras do usuário logado para montar o conteúdo da página.
    const carregarCompras = useCallback(async () => {
        // A API precisa do ID para devolver apenas as compras pertencentes ao cliente logado.
        // Sem esse ID, a página interrompe a busca para não exibir compras de outro usuário.
        if (!idUsuario) {
            // Garante que nenhuma compra antiga continue aparecendo sem um usuário identificado.
            setCompras([]);
            // Finaliza o indicador de carregamento porque a consulta não será realizada.
            setCarregando(false);
            // Informa ao cliente por que suas compras não puderam ser buscadas.
            setErro("Não foi possível identificar o usuário logado.");
            // Encerra a função antes de fazer qualquer requisição sem identificação.
            return;
        }

        // Ativa o carregamento da lista.
        setCarregando(true);
        // Limpa erros antigos.
        setErro("");

        // Estas são três versões conhecidas da rota de compras.
        // A página testa as alternativas porque diferentes versões do backend podem usar nomes diferentes.
        const rotas = [
            // Primeira opção: consulta as vendas cadastradas para o usuário.
            `/listar_vendas_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            // Segunda opção: consulta uma possível rota específica de compras do usuário.
            `/listar_compras_usuario?id_usuario=${encodeURIComponent(idUsuario)}`,
            // Terceira opção: consulta a rota alternativa chamada minhas_compras.
            `/minhas_compras?id_usuario=${encodeURIComponent(idUsuario)}`
        ];

        // Percorre as rotas em ordem e para assim que uma delas devolver uma resposta válida.
        for (const rota of rotas) {
            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Faz a requisição para a rota atual.
                const resposta = await fetch(`${API}${rota}`, {
                    // GET é usado porque esta operação somente consulta as compras.
                    method: "GET",
                    // Envia o token para o backend confirmar que o usuário está autenticado.
                    headers: cabecalhoAutorizacao(),
                    // Permite o envio de cookies de autenticação junto com a requisição.
                    credentials: "include"
                });

                // Se a rota não respondeu sucesso, tenta a próxima.
                if (!resposta.ok) {
                    // Avança para o próximo item da repetição.
                    continue;
                }

                // Converte a resposta em JSON.
                const dados = await lerRespostaJson(resposta);
                // Algumas APIs devolvem um array direto; outras colocam o array dentro de compras, vendas ou pedidos.
                const lista = Array.isArray(dados)
                    // Se a própria resposta já for uma lista, usa essa lista diretamente.
                    ? dados
                    // Caso contrário, procura a lista dentro dos nomes conhecidos ou usa uma lista vazia.
                    : dados.compras || dados.vendas || dados.pedidos || [];

                // Normaliza confirmações locais, ordena cronologicamente e atualiza os cards exibidos.
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

    // ITEM DA SPRINT: "Permitir pagamento via Pix nas parcelas".
    // Busca no backend o QR Code, o código copia e cola, o valor e o status de cada parcela.
    const carregarPixParcelas = useCallback(async (idVenda) => {
        // O ID informa ao backend de qual venda queremos as parcelas.
        // Se elas já estiverem no estado, evita uma requisição repetida.
        if (!idVenda || pixParcelas[idVenda]?.length) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Marca esta venda como carregando Pix de parcelas.
        setCarregandoPixParcelas((estado) => ({ ...estado, [idVenda]: true }));
        // Limpa erro de Pix desta venda.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta buscar os Pix das parcelas.
        try {
            // Solicita os dados Pix de todas as parcelas relacionadas à venda escolhida.
            const resposta = await fetch(`${API}/listar_pix_parcelas/${idVenda}`, {
                // GET somente consulta os dados Pix, sem alterar a parcela.
                method: "GET",
                // Envia o token de autenticação do cliente.
                headers: cabecalhoAutorizacao(),
                // Envia também os cookies usados pela sessão.
                credentials: "include"
            });
            // Converte a resposta para JSON.
            const dados = await lerRespostaJson(resposta);

            // Trata erro retornado pela API.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErroPixParcelas.
                setErroPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Erro ao carregar Pix das parcelas."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Localiza a lista mesmo que o backend use nomes diferentes na resposta.
            const lista = Array.isArray(dados)
                // Usa diretamente a resposta quando ela já for um array.
                ? dados
                // Procura as parcelas em diferentes propriedades aceitas pelo sistema.
                : dados.parcelas || dados.pix_parcelas || dados.faturas || dados.itens || [];

            // Converte todas as parcelas para o mesmo formato e salva por ID da venda.
            // Ao atualizar pixParcelas, a área visual de pagamento parcelado é renderizada.
            setPixParcelas((estado) => ({
                // Mantém as parcelas Pix que pertencem às outras vendas.
                ...estado,
                // Salva a lista carregada dentro da chave correspondente ao ID desta venda.
                [idVenda]: Array.isArray(lista)
                    // Normaliza cada parcela e aplica pagamentos já confirmados localmente.
                    ? lista.map((parcela) => aplicarParcelaPagaLocal(idVenda, normalizarParcelaPix(parcela)))
                    // Se a resposta não contiver uma lista válida, salva uma lista vazia.
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
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica se o Pix já foi carregado.
        const pixJaCarregado = pixVendas[idVenda];

        // Verifica esta condição antes de continuar o fluxo.
        if (itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Se não for recarregamento forçado e já tiver Pix, não busca novamente.
        if (!forcar && (pixJaCarregado?.qrcode || pixJaCarregado?.copiaCola)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Tenta aproveitar dados de Pix que já vieram dentro da compra.
        const pixDaCompra = normalizarPixVenda(compra);

        // Se a compra já contém Pix e não foi forçado, salva e encerra.
        if (!forcar && (pixDaCompra.qrcode || pixDaCompra.copiaCola)) {
            // Atualiza o estado por meio de setPixVendas.
            setPixVendas((estado) => ({ ...estado, [idVenda]: pixDaCompra }));
            // Retorna o resultado desta função ou o conteúdo visual da página.
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
                // Atualiza o estado por meio de setPixVendas.
                setPixVendas((estado) => ({ ...estado, [idVenda]: null }));
                // Atualiza o estado por meio de setErroPixVendas.
                setErroPixVendas((estado) => ({
                    ...estado,
                    [idVenda]: dados.erro || dados.mensagem || "Pix indisponível para esta compra."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
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
        // Executa carregarCompras nesta etapa do fluxo.
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
                // Executa carregarPixParcelas nesta etapa do fluxo.
                carregarPixParcelas(idVenda);
            }

            // Para venda Pix à vista, carrega o Pix da compra se ainda não carregou.
            if (ehVendaPixAVista(compra) && idVenda && pixVendas[idVenda] === undefined && !carregandoPixVendas[idVenda]) {
                // Executa carregarPixVenda nesta etapa do fluxo.
                carregarPixVenda(compra);
            }
        });
    }, [carregarPixParcelas, carregarPixVenda, carregandoPixParcelas, carregandoPixVendas, compras, pixParcelas, pixVendas]);

    // Copia o Pix de uma venda à vista sem alterar o status do pagamento.
    async function copiarPixVenda(codigo, idVenda) {
        // Se não houver código Pix, não faz nada.
        if (!codigo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
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
    
//Cria a função no front chamada "RegistrarReceitaViaPix"onde nela vai chamar a API 
// através da rota do CadastroFinanceiro e lá vai verificar os dados, se os dados forem
// correspondidos vai vir para o front e vai ver se os dados retornados são os mesmos e assim vai finalizar.
// Registra no financeiro a receita de uma compra Pix à vista confirmada pelo cliente.
async function registrarReceitaVendaPix(idVenda, compra) {
    // Cria uma chave única para impedir que a mesma venda gere duas receitas.
    const chaveReceita = `venda-${idVenda}`;

    // Se esta receita já foi registrada nesta máquina, encerra sem duplicar.
    if (itemExisteNoLocalStorage(receitasRegistradasLocalStorage, chaveReceita)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return;
    }

    // Monta a descrição que aparecerá na página financeira.
    const descricaoReceita =
        `Receita automática - Venda #${idVenda} - ${nomeVeiculoCompra(compra)}`;

    // Descobre o valor realmente recebido aceitando os diferentes campos retornados pela API.
    const valorVenda = valorParaNumero(
        // Primeiro tenta usar o valor recebido em letras minúsculas.
        compra?.valor_recebido ??
        // Depois tenta o mesmo campo em letras maiúsculas.
        compra?.VALOR_RECEBIDO ??
        // Se necessário, usa o valor da venda em letras minúsculas.
        compra?.valor_venda ??
        // Depois tenta o valor da venda em letras maiúsculas.
        compra?.VALOR_VENDA ??
        // Por último, tenta o campo alternativo valor_total.
        compra?.valor_total
    );

    // Sem venda ou valor válido não é seguro cadastrar uma receita.
    if (!idVenda || !valorVenda) {
        // Interrompe o fluxo informando o erro encontrado.
        throw new Error(
            "Pagamento confirmado, mas não foi possível montar a receita financeira."
        );
    }

    // Consulta o financeiro antes do cadastro para evitar receita duplicada no banco.
    const receitasExistentes = await buscarIdsReceitasFinanceiras(API, {
        // Compara a descrição esperada com as descrições existentes.
        descricaoReceita,
        // Compara também o número da venda.
        idVenda,
        // Compara o valor para reduzir o risco de encontrar outra receita.
        valor: valorVenda
    });

    // Se a receita já existir, apenas guarda a referência local e encerra.
    if (receitasExistentes.length > 0) {
        // Executa salvarValorObjetoLocalStorage nesta etapa do fluxo.
        salvarValorObjetoLocalStorage(
            // Define em qual objeto local o ID financeiro será guardado.
            receitasFinanceiroIdsLocalStorage,
            // Usa a chave exclusiva desta venda.
            chaveReceita,
            // Guarda o primeiro ID financeiro encontrado no banco.
            receitasExistentes[0]
        );

        // Executa salvarItemLocalStorage nesta etapa do fluxo.
        salvarItemLocalStorage(
            // Define a lista local de receitas já registradas.
            receitasRegistradasLocalStorage,
            // Marca esta venda como já registrada.
            chaveReceita
        );

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return;
    }
    
//Cria a função no front chamada "RegistrarReceitaViaPix"onde nela vai chamar a API 
// através da rota do CadastroFinanceiro e lá vai verificar os dados, se os dados forem
// correspondidos vai vir para o front e vai ver se os dados retornados são os mesmos e assim vai finalizar.

    // Envia uma nova entrada para o financeiro somente quando ela ainda não existe.
    const resposta = await fetch(`${API}/cadastro_financeiro`, {
        // POST cria uma nova transação financeira.
        method: "POST",
        headers: {
            // Informa que o corpo enviado está no formato JSON.
            "Content-Type": "application/json",
            // Acrescenta o token de autenticação.
            ...cabecalhoAutorizacao()
        },
        // Envia os cookies da sessão.
        credentials: "include",
        // Envia tipo entrada, veículo, data, descrição e valor da receita.
        body: JSON.stringify({
            // "entrada" informa que o dinheiro entrou no caixa da empresa.
            tipo: "entrada",
            // Relaciona a receita ao veículo comprado.
            id_veiculo: idVeiculoCompra(compra) || null,
            // Registra a data atual como data da confirmação.
            data: dataAtualParaApi(),
            // Registra uma descrição que identifica venda e veículo.
            descricao: descricaoReceita,
            // Registra o valor total recebido nesta compra à vista.
            valor: valorVenda
        })
    });

    // Lê os dados retornados mesmo quando a API responder sem um JSON válido.
    const dados = await resposta.json().catch(() => ({}));

    // O código 409 significa que o backend detectou uma receita já existente.
    if (!resposta.ok && resposta.status !== 409) {
        // Interrompe o fluxo informando o erro encontrado.
        throw new Error(
            dados.erro ||
            dados.mensagem ||
            "Pagamento confirmado, mas a receita não foi registrada."
        );
    }

    // Recupera o ID financeiro retornado ou procura o registro recém-criado.
    const idFinanceiro =
        idFinanceiroResposta(dados) ||
        (await buscarIdsReceitasFinanceiras(API, {
            descricaoReceita,
            idVenda,
            valor: valorVenda
        }))[0];

    // Guarda o ID financeiro para permitir remover a receita caso o pagamento seja cancelado.
    salvarValorObjetoLocalStorage(
        // Seleciona o armazenamento dos IDs financeiros.
        receitasFinanceiroIdsLocalStorage,
        // Usa a chave que representa esta venda.
        chaveReceita,
        // Salva o ID da receita cadastrada no financeiro.
        idFinanceiro
    );

    // Marca localmente que a receita desta venda já foi registrada.
    salvarItemLocalStorage(
        // Seleciona a lista de receitas já registradas.
        receitasRegistradasLocalStorage,
        // Marca a receita desta venda como concluída.
        chaveReceita
    );
}

    // Confirma a compra Pix à vista e chama o cadastro automático da receita.
    async function confirmarPagamentoPixVenda(idVenda, compra) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setErroPixVendas.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        // Atualiza o estado por meio de setMensagemPixVendas.
        setMensagemPixVendas((estado) => ({ ...estado, [idVenda]: "" }));
        // Atualiza o estado por meio de setPagandoPixVendas.
        setPagandoPixVendas((estado) => ({ ...estado, [idVenda]: true }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara statusAtualizado para uso neste fluxo.
            let statusAtualizado = true;

            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Executa confirmarStatusPagamentoVenda nesta etapa do fluxo.
                await confirmarStatusPagamentoVenda(API, idVenda);
            } catch {
                // Executa esta etapa do fluxo.
                statusAtualizado = false;
            }

            // Depois de confirmar o pagamento, registra automaticamente a entrada no financeiro.
            await registrarReceitaVendaPix(idVenda, compra);
            // Executa removerItemLocalStorage nesta etapa do fluxo.
            removerItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(comprasPagasLocalStorage, idVenda);
            // Atualiza o estado por meio de setCompras.
            setCompras((estado) => estado.map((item) => (
                String(idVendaCompra(item)) === String(idVenda)
                    ? { ...item, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                    : item
            )));
            // Atualiza o estado por meio de setMensagemPixVendas.
            setMensagemPixVendas((estado) => ({
                ...estado,
                [idVenda]: statusAtualizado
                    ? "Pagamento confirmado e receita registrada."
                    : "Pagamento confirmado nesta tela e receita registrada. A API de status não respondeu."
            }));
        } catch (erroAtual) {
            // Atualiza o estado por meio de setErroPixVendas.
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível confirmar o pagamento."
            }));
        } finally {
            // Atualiza o estado por meio de setPagandoPixVendas.
            setPagandoPixVendas((estado) => ({ ...estado, [idVenda]: false }));
        }
    }

    // Declara a função cancelarPagamentoPixVenda usada por esta página.
    async function cancelarPagamentoPixVenda(idVenda, compra) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setErroPixVendas.
        setErroPixVendas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Executa excluirReceitaFinanceira nesta etapa do fluxo.
            await excluirReceitaFinanceira(API, `venda-${idVenda}`, {
                descricaoReceita: `Receita automática - Venda #${idVenda} - ${nomeVeiculoCompra(compra)}`,
                idVenda,
                valor: valorParaNumero(compra?.valor_recebido ?? compra?.VALOR_RECEBIDO ?? compra?.valor_venda ?? compra?.VALOR_VENDA ?? compra?.valor_total)
            });
            // Executa removerItemLocalStorage nesta etapa do fluxo.
            removerItemLocalStorage(comprasPagasLocalStorage, idVenda);
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            // Atualiza o estado por meio de setCompras.
            setCompras((estado) => estado.map((item) => (
                String(idVendaCompra(item)) === String(idVenda)
                    ? { ...item, status_pagamento: 1, STATUS_PAGAMENTO: 1 }
                    : item
            )));
            // Atualiza o estado por meio de setMensagemPixVendas.
            setMensagemPixVendas((estado) => ({
                ...estado,
                [idVenda]: "Pagamento Pix cancelado. A receita foi removida do financeiro."
            }));
        } catch (erroAtual) {
            // Atualiza o estado por meio de setErroPixVendas.
            setErroPixVendas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível cancelar o pagamento no financeiro."
            }));
        }
    }

    // Declara a função cancelarPagamentoPixParcela usada por esta página.
    async function cancelarPagamentoPixParcela(idVenda, parcela, compra) {
        // Declara chaveParcela para uso neste fluxo.
        const chaveParcela = parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`;

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda || !chaveParcela) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setErroPixParcelas.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara numeroParcela para uso neste fluxo.
            const numeroParcela = parcela?.numero || "-";
            // Declara descricaoReceita para uso neste fluxo.
            const descricaoReceita = `Receita automática - Venda #${idVenda} - Parcela ${numeroParcela} - ${nomeVeiculoCompra(compra)}`;

            // Executa excluirReceitaFinanceira nesta etapa do fluxo.
            await excluirReceitaFinanceira(API, `parcela-${chaveParcela}`, {
                descricaoReceita,
                idVenda,
                valor: parcela?.valor
            });
            // Executa removerItemLocalStorage nesta etapa do fluxo.
            removerItemLocalStorage(parcelasPagasLocalStorage, chaveParcela);
            // Executa removerItemLocalStorage nesta etapa do fluxo.
            removerItemLocalStorage(comprasPagasLocalStorage, idVenda);
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(parcelasCanceladasLocalStorage, chaveParcela);
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            // Atualiza o estado por meio de setPixParcelas.
            setPixParcelas((estado) => ({
                ...estado,
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    String(item.id || item.numero) === String(parcela?.id || parcela?.numero)
                        ? { ...item, situacao: 0 }
                        : item
                ))
            }));
            // Atualiza o estado por meio de setCompras.
            setCompras((estado) => estado.map((compraAtual) => (
                String(idVendaCompra(compraAtual)) === String(idVenda)
                    ? { ...compraAtual, status_pagamento: 1, STATUS_PAGAMENTO: 1 }
                    : compraAtual
            )));
            // Atualiza o estado por meio de setMensagemPixParcelas.
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Pagamento da parcela cancelado. A receita foi removida do financeiro."
            }));
        } catch (erroAtual) {
            // Atualiza o estado por meio de setErroPixParcelas.
            setErroPixParcelas((estado) => ({
                ...estado,
                [idVenda]: erroAtual.message || "Não foi possível cancelar a parcela no financeiro."
            }));
        }
    }

    // Registrar automaticamente a receita após o pagamento
    // Registra no financeiro somente o valor da parcela Pix que acabou de ser paga.
    async function registrarReceitaParcela(idVenda, parcela, compra) {
        // Cria uma identificação exclusiva para esta receita.
        // Exemplo: "parcela-123" permite saber que a receita da parcela 123 já foi cadastrada.
        const chaveReceita = `parcela-${parcela?.id || `${idVenda}-${parcela?.numero || "sem-numero"}`}`;

        // Evita cadastrar novamente uma parcela já registrada por esta tela.
        if (itemExisteNoLocalStorage(receitasRegistradasLocalStorage, chaveReceita)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Converte o valor da parcela para número antes de enviar ao financeiro.
        const valorParcela = valorParaNumero(parcela?.valor);

        // Interrompe o cadastro quando faltam dados obrigatórios.
        if (!idVenda || !valorParcela) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error("Parcela paga, mas não foi possível montar a receita financeira.");
        }

        // Obtém o número da parcela e o nome do veículo para criar uma descrição compreensível.
        const numeroParcela = parcela?.numero || "-";
        // Declara veiculo para uso neste fluxo.
        const veiculo = nomeVeiculoCompra(compra);
        // Esta descrição permite identificar no financeiro qual venda, parcela e veículo geraram a receita.
        const descricaoReceita = `Receita automática - Venda #${idVenda} - Parcela ${numeroParcela} - ${veiculo}`;
        // Cadastra a parcela paga como uma nova entrada financeira.
        const resposta = await fetch(`${API}/cadastro_financeiro`, {
            // POST solicita a criação de uma nova receita financeira.
            method: "POST",
            headers: {
                // Informa ao backend que os dados enviados são JSON.
                "Content-Type": "application/json",
                // Envia o token do usuário autenticado.
                ...cabecalhoAutorizacao()
            },
            // Inclui os cookies da sessão na requisição.
            credentials: "include",
            // O objeto enviado cria uma receita do tipo "entrada":
            // id_veiculo relaciona o lançamento ao carro vendido;
            // data informa quando a parcela foi confirmada;
            // descricao identifica venda, parcela e veículo;
            // valor registra somente o valor desta parcela, não o valor total da compra.
            body: JSON.stringify({
                // Define o lançamento como dinheiro entrando no caixa.
                tipo: "entrada",
                // Relaciona o lançamento ao veículo comprado.
                id_veiculo: idVeiculoCompra(compra) || null,
                // Registra a data em que o cliente confirmou o pagamento.
                data: dataAtualParaApi(),
                // Identifica venda, parcela e veículo no histórico financeiro.
                descricao: descricaoReceita,
                // Registra apenas o valor da parcela confirmada.
                valor: valorParcela
            })
        });
        // Lê a resposta para validar o cadastro e recuperar o ID financeiro.
        const dados = await resposta.json().catch(() => ({}));

        // Aceita conflito 409 porque ele indica que a receita já estava cadastrada.
        if (!resposta.ok && resposta.status !== 409) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error(dados.erro || dados.mensagem || "Parcela paga, mas a receita não foi registrada no financeiro.");
        }

        // Recupera o ID da receita criada para permitir futuras operações, como cancelamento.
        const idFinanceiro = idFinanceiroResposta(dados) || (await buscarIdsReceitasFinanceiras(API, {
            // Procura pela mesma descrição criada para esta parcela.
            descricaoReceita,
            // Restringe a busca ao número desta venda.
            idVenda,
            // Confirma também que o valor encontrado é o valor da parcela.
            valor: valorParcela
        }))[0];
        // Guarda o vínculo entre a parcela e o registro financeiro.
        salvarValorObjetoLocalStorage(receitasFinanceiroIdsLocalStorage, chaveReceita, idFinanceiro);
        // Marca esta receita como registrada para evitar duplicação.
        salvarItemLocalStorage(receitasRegistradasLocalStorage, chaveReceita);
        // Retorna a resposta para quem confirmou o pagamento.
        return dados;
    }


    // Declara a função copiarPixParcela usada por esta página.
    async function copiarPixParcela(codigo, idVenda) {
        // Sem código Pix não existe conteúdo para copiar.
        if (!codigo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Limpa mensagens antigas antes de tentar uma nova cópia.
        setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));
        // Atualiza o estado por meio de setMensagemPixParcelas.
        setMensagemPixParcelas((estado) => ({ ...estado, [idVenda]: "" }));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Usa a área de transferência do navegador para copiar o Pix copia e cola.
            await navigator.clipboard.writeText(codigo);
            // Orienta o cliente a pagar no aplicativo bancário e depois confirmar nesta tela.
            setMensagemPixParcelas((estado) => ({
                ...estado,
                [idVenda]: "Pix copiado. Depois de pagar, clique em Confirmar pagamento."
            }));
        } catch {
            // Atualiza o estado por meio de setErroPixParcelas.
            setErroPixParcelas((estado) => ({ ...estado, [idVenda]: "Não foi possível copiar o Pix automaticamente." }));
        }
    }

    // ITEM DA SPRINT: "Permitir pagamento via Pix nas parcelas".
    // Confirma o Pix da parcela, atualiza seu status e registra a receita correspondente.
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
                // Atualiza o estado por meio de setMensagemPixParcelas.
                setMensagemPixParcelas((estado) => ({
                    ...estado,
                    [idVenda]: "Esta parcela já está paga."
                }));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Envia o ID específico da parcela para o backend.
            // Esta chamada altera a situação da parcela de pendente para paga.
            const resposta = await fetch(`${API}/pagar_parcela_pix/${parcela.id}`, {
                // POST solicita que o backend confirme esta parcela.
                method: "POST",
                // Envia a autenticação necessária para alterar o pagamento.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies da sessão.
                credentials: "include"
            });
            // Converte a resposta para JSON.
            const dados = await lerRespostaJson(resposta);

            // Se a API retornou erro, dispara exceção.
            if (!resposta.ok) {
                // Interrompe o fluxo informando o erro encontrado.
                throw new Error(dados.erro || dados.mensagem || "Não foi possível marcar a parcela como paga.");
            }

            // Algumas versões do backend já criam a receita junto com a confirmação.
            // Se a resposta informar que isso não ocorreu, o front chama registrarReceitaParcela.
            if (!pagamentoRegistrouReceita(dados)) {
                // Executa registrarReceitaParcela nesta etapa do fluxo.
                await registrarReceitaParcela(idVenda, parcela, compra);
            }

            // Remove marcações antigas de cancelamento e grava localmente que a parcela foi confirmada.
            // Isso mantém a interface correta mesmo antes de uma nova consulta ao backend.
            removerItemLocalStorage(parcelasCanceladasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`);
            // Executa removerItemLocalStorage nesta etapa do fluxo.
            removerItemLocalStorage(comprasCanceladasLocalStorage, idVenda);
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(parcelasPagasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`);

            // Cria uma nova lista em que somente a parcela confirmada recebe situação paga.
            const parcelasAtualizadas = (pixParcelas[idVenda] || []).map((item) => (
                // Compara cada item da lista com a parcela que acabou de ser confirmada.
                String(item.id) === String(parcela.id)
                    // Quando encontra a parcela, troca sua situação para paga.
                    ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                    // Mantém as demais parcelas sem alterações.
                    : item
            ));
            // Verifica se, depois desta confirmação, todas as parcelas da compra estão pagas.
            const compraQuitadaLocalmente = parcelasAtualizadas.length > 0 && parcelasAtualizadas.every(parcelaEstaPaga);

            // Salva a nova situação no estado para atualizar imediatamente a tela.
            setPixParcelas((estado) => ({
                // Preserva os dados Pix de todas as outras vendas.
                ...estado,
                // Atualiza somente as parcelas desta venda.
                [idVenda]: (estado[idVenda] || []).map((item) => (
                    // Localiza a parcela que foi confirmada.
                    String(item.id) === String(parcela.id)
                        // Atualiza sua situação para paga.
                        ? { ...item, situacao: dados.situacao_parcela ?? 1 }
                        // Mantém as outras parcelas como estavam.
                        : item
                ))
            }));

            // A compra inteira só recebe status "Pago" quando todas as parcelas estiverem quitadas.
            if (dados.compra_quitada || compraQuitadaLocalmente) {
                // Guarda a quitação para manter o status correto no navegador.
                salvarItemLocalStorage(comprasPagasLocalStorage, idVenda);

                // Tenta executar a operação e permite tratar possíveis falhas.
                try {
                    // Tenta também atualizar o status geral da venda no backend.
                    await confirmarStatusPagamentoVenda(API, idVenda);
                } catch {
                    // A compra fica paga localmente mesmo quando a API de status nao existe.
                }

                // Atualiza o objeto da compra para o código 0, que representa "Pago".
                setCompras((estado) => estado.map((compra) => (
                    // Encontra na lista a compra que acabou de ser quitada.
                    String(idVendaCompra(compra)) === String(idVenda)
                        // Atualiza os dois formatos possíveis de status para o código Pago.
                        ? { ...compra, status_pagamento: 0, STATUS_PAGAMENTO: 0 }
                        // Mantém as demais compras sem alterações.
                        : compra
                )));
            }

            // Mostra mensagem de sucesso conforme a compra esteja quitada ou não.
            setMensagemPixParcelas((estado) => ({
                // Mantém mensagens de outras vendas.
                ...estado,
                // Define a mensagem mostrada apenas nesta venda.
                [idVenda]: dados.compra_quitada || compraQuitadaLocalmente
                    // Informa quitação quando todas as parcelas foram pagas.
                    ? "Todas as parcelas foram pagas. Compra quitada e receita registrada."
                    // Informa apenas a confirmação quando ainda existem parcelas pendentes.
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

    // ITEM DA SPRINT: "Exibir o status de cada compra".
    // Escolhe a cor visual do status: paga ou em andamento.
    function classeStatusPagamento(valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return textoStatusPagamento(valor) === "Pago" ? css.compra_pago : css.compra_andamento;
    }

    // Declara a função alternarCompra usada por esta página.
    function alternarCompra(idVenda, pagamentoConcluido) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda || pagamentoConcluido) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setCompraAbertaId.
        setCompraAbertaId((idAtual) => String(idAtual) === String(idVenda) ? "" : String(idVenda));
    }

    // Decide o status exibido considerando API, confirmações locais e parcelas pagas.
    function compraEstaPagaExibicao(compra) {
        // Descobre qual venda está sendo analisada.
        const idVenda = idVendaCompra(compra);
        // Obtém as parcelas já carregadas desta venda.
        const parcelas = idVenda ? pixParcelas[idVenda] || [] : [];

        // Um cancelamento confirmado localmente tem prioridade e mantém a compra em andamento.
        if (idVenda && itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Considera a compra paga quando qualquer uma destas condições for verdadeira:
        // 1. a API já devolveu status Pago;
        // 2. o pagamento foi confirmado localmente;
        // 3. a compra é parcelada e todas as parcelas carregadas estão pagas.
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
                {/* Agrupa os elementos desta parte da interface. */}
                <div>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Área do cliente</span>
                    {/* Exibe o título principal desta página. */}
                    <h1>Minhas compras</h1>
                </div>
            </header>

            {/* ITEM DA SPRINT: "Exibir o status de cada compra". Resumo totaliza compras pagas e em andamento. */}
            {/* Abre a seção visual que contém os três contadores da página. */}
            <section className={css.resumo}>
                {/* Primeiro card apresenta a quantidade total de compras encontradas. */}
                <article>
                    {/* Texto que identifica o primeiro contador. */}
                    <span>Total de compras</span>
                    {/* Exibe o tamanho completo da lista de compras. */}
                    <strong>{compras.length}</strong>
                </article>
                {/* Segundo card apresenta quantas compras estão totalmente pagas. */}
                <article>
                    {/* Texto que identifica o contador de compras pagas. */}
                    <span>Pagas</span>
                    {/* Filtra a lista usando a regra de pagamento e conta os resultados. */}
                    <strong>{compras.filter(compraEstaPagaExibicao).length}</strong>
                </article>
                {/* Terceiro card apresenta quantas compras ainda possuem pagamento pendente. */}
                <article>
                    {/* Texto que identifica o contador de compras em andamento. */}
                    <span>Em andamento</span>
                    {/* Mantém as compras que não estão pagas e conta os resultados. */}
                    <strong>{compras.filter((compra) => !compraEstaPagaExibicao(compra)).length}</strong>
                </article>
            {/* Fecha a seção de resumo dos status. */}
            </section>

            {/* Estado exibido durante carregamento. */}
            {carregando && (
                <div className={css.estado}>Carregando suas compras...</div>
            )}

            {/* Estado exibido quando ocorreu erro ao carregar compras. */}
            {!carregando && erro && (
                <div className={css.estado}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>Não foi possível carregar suas compras agora.</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>{erro}</span>
                </div>
            )}

            {/* Estado vazio quando o usuário ainda não possui compras. */}
            {!carregando && !erro && compras.length === 0 && (
                <div className={css.estado}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>Você ainda não possui compras registradas.</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
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
                        // Declara pagandoPixVenda para uso neste fluxo.
                        const pagandoPixVenda = Boolean(pagandoPixVendas[idVenda]);
                        // Lê erro do Pix da venda à vista.
                        const erroPixVenda = erroPixVendas[idVenda];
                        // Lê mensagem do Pix da venda à vista.
                        const mensagemPixVenda = mensagemPixVendas[idVenda];
                        // Declara compraCanceladaLocalmente para uso neste fluxo.
                        const compraCanceladaLocalmente = itemExisteNoLocalStorage(comprasCanceladasLocalStorage, idVenda);
                        // Declara compraPagaLocalmente para uso neste fluxo.
                        const compraPagaLocalmente = itemExisteNoLocalStorage(comprasPagasLocalStorage, idVenda) && !compraCanceladaLocalmente;
                        // Declara temParcelaPagaLocalmente para uso neste fluxo.
                        const temParcelaPagaLocalmente = parcelasComPix.some((parcela) => (
                            itemExisteNoLocalStorage(parcelasPagasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`) &&
                            !itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, parcela.id || `${idVenda}-${parcela.numero || "sem-numero"}`)
                        ));
                        // Verifica se todas as parcelas foram pagas.
                        const compraQuitadaParcelas = vendaParcelada && parcelasComPix.length > 0 && parcelasComPix.every(parcelaEstaPaga);
                        // Se todas as parcelas estão pagas ou a compra foi confirmada localmente, considera a compra paga.
                        const compraPaga = compraEstaPagaExibicao(compra);
                        // Define o código final mostrado no card:
                        // cancelada localmente = 1/Em andamento; paga = 0/Pago; senão usa o status da API.
                        const statusPagamentoCompra = compraCanceladaLocalmente ? 1 : compraPaga ? 0 : (compra.status_pagamento ?? compra.STATUS_PAGAMENTO);
                        // Compra concluída não abre detalhes de pagamento.
                        const pagamentoConcluido = textoStatusPagamento(statusPagamentoCompra) === "Pago";
                        // Exibe Pix ou parcelas apenas na compra clicada.
                        const compraAberta = String(compraAbertaId) === String(idVenda);
                        // Mostra detalhes somente quando a compra ainda não foi concluída.
                        const podeAbrirPagamento = !pagamentoConcluido || compraPagaLocalmente || temParcelaPagaLocalmente;
                        // Declara mostrarDetalhesPagamento para uso neste fluxo.
                        const mostrarDetalhesPagamento = compraAberta && podeAbrirPagamento;
                        // Recupera o índice salvo da parcela selecionada.
                        const indiceSalvoPix = Number(parcelaPixSelecionada[idVenda] ?? 0);
                        // Garante que o índice selecionado fique dentro do tamanho da lista.
                        const indiceParcelaPix = Number.isFinite(indiceSalvoPix)
                            ? Math.min(Math.max(indiceSalvoPix, 0), Math.max(parcelasComPix.length - 1, 0))
                            : 0;
                        // Seleciona a parcela Pix atual.
                        const parcelaPixAtual = parcelasComPix[indiceParcelaPix];
                        // Declara chaveParcelaAtual para uso neste fluxo.
                        const chaveParcelaAtual = parcelaPixAtual?.id || `${idVenda}-${parcelaPixAtual?.numero || "sem-numero"}`;
                        // Declara parcelaAtualCanceladaLocalmente para uso neste fluxo.
                        const parcelaAtualCanceladaLocalmente = itemExisteNoLocalStorage(parcelasCanceladasLocalStorage, chaveParcelaAtual);
                        // Declara parcelaAtualPagaLocalmente para uso neste fluxo.
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
                                    // Verifica esta condição antes de continuar o fluxo.
                                    if (evento.key === "Enter" || evento.key === " ") {
                                        // Executa preventDefault nesta etapa do fluxo.
                                        evento.preventDefault();
                                        // Executa alternarCompra nesta etapa do fluxo.
                                        alternarCompra(idVenda, !podeAbrirPagamento);
                                    }
                                }}
                            >
                                {/* ITEM DA SPRINT: "Exibir o status de cada compra". Mostra o status individual no topo do card. */}
                                {/* Abre o cabeçalho do card que reúne veículo e status da compra. */}
                                <div className={css.topo_compra}>
                                    {/* Agrupa o rótulo e o nome do veículo comprado. */}
                                    <div>
                                        {/* Informa que o texto abaixo representa o veículo. */}
                                        <span>Veículo</span>
                                        {/* Exibe o nome do veículo relacionado à compra. */}
                                        <h2>{nomeVeiculoCompra(compra)}</h2>
                                    </div>
                                    {/* Aplica a cor correspondente e abre o texto visual do status. */}
                                    <strong className={`${css.status_compra} ${classeStatusPagamento(statusPagamentoCompra)}`}>
                                        {/* Converte o código final para o texto "Pago" ou "Em andamento". */}
                                        {textoStatusPagamento(statusPagamentoCompra)}
                                    {/* Fecha o texto visual do status. */}
                                    </strong>
                                {/* Fecha o cabeçalho do card da compra. */}
                                </div>

                                {/* Dados principais da compra. */}
                                <div className={css.grade_compra}>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p><strong>Data:</strong> {formatarData(compra.data_venda ?? compra.DATA_VENDA)}</p>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p><strong>Pagamento:</strong> {textoFormaPagamento(compra.forma_pagamento ?? compra.FORMA_PAGAMENTO)}</p>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p><strong>Valor:</strong> {formatarMoeda(valor)}</p>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p><strong>Recebido:</strong> {formatarMoeda(recebido)}</p>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p><strong>Parcelas:</strong> {parcelas || "À vista"}</p>
                                </div>

                                {/* Ações gerais da compra. */}
                                <div className={css.acoes_compra} onClick={(evento) => evento.stopPropagation()}>
                                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                    {podeAbrirPagamento && (
                                        <button type="button" onClick={() => alternarCompra(idVenda, !podeAbrirPagamento)}>
                                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
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
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p className={css.sucesso_pix_parcelas}>
                                            Compra paga por completo. Todas as parcelas foram quitadas.
                                        </p>
                                    </div>
                                )}

                                {/* Área de Pix para compras à vista. */}
                                {vendaPixAVista && idVenda && mostrarDetalhesPagamento && (
                                    <div className={css.area_pix_parcelas} onClick={(evento) => evento.stopPropagation()}>
                                        {/* Agrupa os elementos desta parte da interface. */}
                                        <div className={css.topo_pix_parcelas}>
                                            {/* Agrupa os elementos desta parte da interface. */}
                                            <div>
                                                {/* Renderiza o elemento span nesta parte da página. */}
                                                <span>Pagamento à vista</span>
                                                {/* Renderiza o elemento h3 nesta parte da página. */}
                                                <h3>Pix da compra</h3>
                                            </div>
                                        </div>

                                        {/* Mensagens do Pix da venda à vista. */}
                                        {erroPixVenda && <p className={css.erro_pix_parcelas}>{erroPixVenda}</p>}
                                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
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
                                                {/* Agrupa os elementos desta parte da interface. */}
                                                <div className={css.pix_qrcode_area}>
                                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                                    {pixVenda.qrcode ? (
                                                        <img src={montarUrlArquivo(pixVenda.qrcode)} alt={`QR Code Pix da compra ${idVenda || ""}`} />
                                                    ) : (
                                                        <span>QR Code indisponível</span>
                                                    )}
                                                </div>

                                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                                <label className={css.pix_copia_cola}>
                                                    {/* Renderiza o elemento span nesta parte da página. */}
                                                    <span>Pix cópia e cola</span>
                                                    {/* Renderiza o elemento textarea nesta parte da página. */}
                                                    <textarea value={pixVenda.copiaCola || ""} readOnly />
                                                    {/* Agrupa os elementos desta parte da interface. */}
                                                    <div className={css.acoes_pix_parcela}>
                                                        {/* Exibe este botão de ação. */}
                                                        <button type="button" onClick={() => copiarPixVenda(pixVenda.copiaCola, idVenda)}>
                                                            Copiar Pix
                                                        </button>
                                                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                                        {!compraPagaLocalmente && (
                                                            <button
                                                                type="button"
                                                                onClick={() => confirmarPagamentoPixVenda(idVenda, compra)}
                                                                disabled={pagandoPixVenda || compraPaga}
                                                            >
                                                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                                                {pagandoPixVenda ? "Confirmando..." : "Confirmar pagamento"}
                                                            </button>
                                                        )}
                                                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
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

                                {/* ITEM DA SPRINT: "Permitir pagamento via Pix nas parcelas". Área completa de pagamento parcelado. */}
                                {/* A área só aparece para venda parcelada identificada e quando o cliente abriu o pagamento. */}
                                {vendaParcelada && idVenda && mostrarDetalhesPagamento && (
                                    /* Abre a área Pix e impede que cliques internos fechem o card. */
                                    <div className={css.area_pix_parcelas} onClick={(evento) => evento.stopPropagation()}>
                                        {/* Abre o cabeçalho da área de pagamento parcelado. */}
                                        <div className={css.topo_pix_parcelas}>
                                            {/* Agrupa o tipo e o título do pagamento. */}
                                            <div>
                                                {/* Informa que esta área pertence a uma compra parcelada. */}
                                                <span>Pagamento parcelado</span>
                                                {/* Identifica que os dados exibidos são os Pix das parcelas. */}
                                                <h3>Pix das parcelas</h3>
                                            {/* Fecha o agrupamento do título. */}
                                            </div>
                                        {/* Fecha o cabeçalho da área Pix. */}
                                        </div>

                                        {/* Mensagens do Pix das parcelas. */}
                                        {/* Mostra a mensagem de erro somente quando existir erro nesta venda. */}
                                        {erroPix && <p className={css.erro_pix_parcelas}>{erroPix}</p>}
                                        {/* Mostra a mensagem de sucesso somente quando existir mensagem nesta venda. */}
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
                                            /* Abre o conteúdo quando existem parcelas e uma delas está selecionada. */
                                            <div className={css.pix_parcela_unica}>
                                                {/* Relaciona o texto "Escolha a parcela" ao campo select. */}
                                                <label className={css.seletor_pix_parcela} htmlFor={`pix-parcela-${idVenda}`}>
                                                    {/* Explica ao cliente o que deve ser escolhido. */}
                                                    <span>Escolha a parcela</span>
                                                    {/* Guarda qual parcela o cliente escolheu para visualizar e pagar. */}
                                                    {/* O ID liga o campo ao label, value mantém a escolha e onChange salva a nova parcela. */}
                                                    <select
                                                        id={`pix-parcela-${idVenda}`}
                                                        value={indiceParcelaPix}
                                                        onChange={(evento) => setParcelaPixSelecionada((estado) => ({
                                                            /* Mantém as escolhas feitas nas outras vendas. */
                                                            ...estado,
                                                            /* Salva o novo índice selecionado para esta venda. */
                                                            [idVenda]: Number(evento.target.value)
                                                        }))}
                                                    >
                                                        {/* Percorre todas as parcelas para criar as opções do seletor. */}
                                                        {parcelasComPix.map((parcela, indice) => (
                                                            /* Cada opção mostra número, valor e vencimento da parcela. */
                                                            <option key={parcela.id || parcela.numero || indice} value={indice}>
                                                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                                                Parcela {parcela.numero || indice + 1} - {formatarMoeda(parcela.valor)} - vence em {parcela.vencimento || "-"}
                                                            </option>
                                                        ))}
                                                    {/* Fecha o seletor das parcelas. */}
                                                    </select>
                                                {/* Fecha o campo de seleção de parcela. */}
                                                </label>

                                                {/* Resumo da parcela selecionada. */}
                                                {/* Abre o resumo que apresenta os principais dados da parcela atual. */}
                                                <div className={css.pix_resumo_parcela}>
                                                    {/* Primeiro bloco apresenta número e valor da parcela. */}
                                                    <div>
                                                        {/* Exibe o número da parcela selecionada. */}
                                                        <span>Parcela {parcelaPixAtual.numero || "-"}</span>
                                                        {/* Exibe o valor da parcela formatado em reais. */}
                                                        <strong>{formatarMoeda(parcelaPixAtual.valor)}</strong>
                                                    </div>
                                                    {/* Segundo bloco apresenta a data de vencimento. */}
                                                    <div>
                                                        {/* Identifica que o texto abaixo é o vencimento. */}
                                                        <span>Vencimento</span>
                                                        {/* Exibe o vencimento ou hífen quando ele não foi informado. */}
                                                        <strong>{parcelaPixAtual.vencimento || "-"}</strong>
                                                    </div>
                                                    {/* Terceiro bloco apresenta o status individual da parcela. */}
                                                    <div>
                                                        {/* Identifica que o texto abaixo é o status. */}
                                                        <span>Status</span>
                                                        {/* Aplica cor de paga ou pendente conforme a situação da parcela. */}
                                                        <strong className={parcelaEstaPaga(parcelaPixAtual) ? css.parcela_paga : css.parcela_pendente}>
                                                            {/* Converte a situação da parcela para "Pago" ou "Pendente". */}
                                                            {textoSituacaoParcela(parcelaPixAtual)}
                                                        </strong>
                                                    </div>
                                                {/* Fecha o resumo da parcela selecionada. */}
                                                </div>

                                                {/* Exibe o QR Code, o Pix copia e cola e os botões para confirmar ou cancelar a parcela. */}
                                                {/* Abre a área com as informações usadas para realizar o pagamento Pix. */}
                                                <div className={css.pix_conteudo_unico}>
                                                    {/* Abre o espaço visual reservado para o QR Code. */}
                                                    <div className={css.pix_qrcode_area}>
                                                        {/* Verifica se a API forneceu uma imagem de QR Code. */}
                                                        {parcelaPixAtual.qrcode ? (
                                                            /* Quando existe QR Code, monta sua URL e exibe a imagem. */
                                                            <img src={montarUrlArquivo(parcelaPixAtual.qrcode)} alt={`QR Code Pix da parcela ${parcelaPixAtual.numero || ""}`} />
                                                        ) : (
                                                            /* Quando não existe QR Code, informa que ele está indisponível. */
                                                            <span>QR Code indisponível</span>
                                                        )}
                                                    {/* Fecha o espaço do QR Code. */}
                                                    </div>

                                                    {/* Abre o campo que mostra o código Pix copia e cola. */}
                                                    <label className={css.pix_copia_cola}>
                                                        {/* Identifica o conteúdo do campo de texto. */}
                                                        <span>Pix cópia e cola</span>
                                                        {/* Exibe o código Pix sem permitir edição manual. */}
                                                        <textarea value={parcelaPixAtual.copiaCola || ""} readOnly />
                                                        {/* Abre o grupo de botões relacionados ao pagamento desta parcela. */}
                                                        <div className={css.acoes_pix_parcela}>
                                                            {/* Botão que envia o código Pix para a área de transferência. */}
                                                            <button
                                                                type="button"
                                                                onClick={() => copiarPixParcela(parcelaPixAtual.copiaCola, idVenda)}
                                                                disabled={pagandoPixAtual}
                                                            >
                                                                Copiar Pix
                                                            </button>
                                                            {/* Só mostra o botão de confirmação enquanto a parcela estiver pendente. */}
                                                            {!parcelaEstaPaga(parcelaPixAtual) && (
                                                                /* Este botão inicia confirmação, atualização do status e registro da receita. */
                                                                <button
                                                                    type="button"
                                                                    onClick={() => confirmarPagamentoPixParcela(idVenda, parcelaPixAtual, compra)}
                                                                    disabled={pagandoPixAtual}
                                                                >
                                                                    {/* Durante a requisição mostra Confirmando; fora dela mostra Confirmar pagamento. */}
                                                                    {pagandoPixAtual ? "Confirmando..." : "Confirmar pagamento"}
                                                                </button>
                                                            )}
                                                            {/* Se a API informou pagamento, mostra um botão Pago desabilitado. */}
                                                            {parcelaEstaPaga(parcelaPixAtual) && !parcelaAtualPagaLocalmente && (
                                                                <button type="button" disabled>
                                                                    Pago
                                                                </button>
                                                            )}
                                                            {/* Se o pagamento foi confirmado nesta tela, permite cancelar a confirmação. */}
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
                                                        {/* Fecha o grupo de ações da parcela. */}
                                                        </div>
                                                    {/* Fecha o campo Pix copia e cola. */}
                                                    </label>
                                                {/* Fecha a área completa de pagamento Pix. */}
                                                </div>
                                            {/* Fecha o conteúdo da parcela selecionada. */}
                                            </div>
                                        )}
                                    {/* Fecha a área Pix das parcelas. */}
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
