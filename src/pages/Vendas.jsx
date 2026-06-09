// Importa hooks do React usados para estado, efeitos, memoizacao e funcoes memorizadas.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook de navegacao para trocar de rota quando cancelar ou voltar.
import { useNavigate } from "react-router-dom";
// Importa o componente de mascara para campos monetarios.
import { IMaskInput } from "react-imask";
// Importa os estilos CSS Modules usados nesta pagina.
import css from "./Vendas.module.css";

// Lista as formas de pagamento que aparecem no select.
const formasPagamento = [
    // Opcao usada quando a venda sera paga por Pix.
    { id: "0", nome: "Pix" },
    // Opcao usada quando a venda sera parcelada.
    { id: "1", nome: "Parcelamento" }
];
// Guarda o id que representa Pix para evitar numeros soltos no codigo.
const formaPagamentoPix = "0";
// Guarda o id que representa parcelamento para comparar com o estado atual.
const formaPagamentoParcelamento = "1";
// Lista os status de pagamento exibidos no formulario.
const statusPagamento = [
    // Status para venda ja paga.
    { id: "0", nome: "Pago" },
    // Status para venda ainda em andamento.
    { id: "1", nome: "Em andamento" }
];
// Define o status inicial da venda como "Em andamento".
const statusEmAndamento = "1";
// Agrupa os valores usados para salvar a situacao do parcelamento.
const situacaoParcelamento = {
    // Valor enviado para a API quando o parcelamento ainda esta ativo.
    emAndamento: "1"
};
// Define a taxa de juros mensal padrao quando nao houver configuracao salva.
const JUROS_PADRAO = 4; // Ajustado de 0 para 4 (4% de juros padrão)

// Converte valores digitados em campos monetarios/texto para numero.
function numeroDoCampo(valor) {
    // Transforma o valor em texto e remove simbolos que nao sejam numero, virgula, ponto ou sinal.
    const texto = String(valor || "0").replace(/[^\d,.-]/g, "");

    // Se o texto tiver virgula, assume o formato brasileiro, como "1.234,56".
    if (texto.includes(",")) {
        // Remove pontos de milhar, troca virgula decimal por ponto e converte para Number.
        return Number(texto.replace(/\./g, "").replace(",", ".")) || 0;
    }

    // Converte valores sem virgula diretamente para numero.
    return Number(texto) || 0;
}

// Transforma uma taxa percentual, como 4, em decimal, como 0.04.
function taxaJurosParaDecimal(valor) {
    // Primeiro normaliza o valor usando a mesma regra dos campos numericos.
    const taxa = numeroDoCampo(valor);

    // Taxas invalidas, zeradas ou negativas viram 0 para nao quebrar o calculo.
    if (!Number.isFinite(taxa) || taxa <= 0) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return 0;
    }

    // Divide por 100 para transformar porcentagem em decimal.
    return taxa / 100;
}

// Garante que taxa vazia ou zerada use o juros padrao da empresa.
function taxaJurosConfigurada(valor) {
    // Converte o valor recebido para numero.
    const taxa = numeroDoCampo(valor);

    // Se nao houver taxa valida, usa 4%.
    if (!Number.isFinite(taxa) || taxa <= 0) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return JUROS_PADRAO;
    }

    // Retorna a taxa configurada quando ela for maior que zero.
    return taxa;
}

// Formata um numero como moeda brasileira.
function formatarMoeda(valor) {
    // Usa Intl/toLocaleString para mostrar o valor como "R$ 1.234,56".
    return Number(valor || 0).toLocaleString("pt-BR", {
        // Define que a formatacao sera de moeda.
        style: "currency",
        // Define a moeda como Real brasileiro.
        currency: "BRL",
        // Limita a exibicao a duas casas decimais.
        maximumFractionDigits: 2
    });
}

// Formata a quilometragem do veiculo para exibir no card.
function formatarQuilometragem(valor) {
    // Converte o valor recebido para numero.
    const numero = Number(valor);

    // Se nao for numero valido, mostra o valor original ou um traco.
    if (!Number.isFinite(numero)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return valor || "-";
    }

    // Exibe a quilometragem com separador brasileiro e sufixo "km".
    return `${numero.toLocaleString("pt-BR")} km`;
}

// Monta o cabecalho Authorization quando existe token salvo.
function cabecalhoAutorizacao() {
    // Busca o token de acesso gravado no navegador.
    const token = localStorage.getItem("access_token");
    // Retorna o Bearer token ou undefined quando nao houver token.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Extrai apenas usuarios que podem ser clientes a partir da resposta da API.
function extrairListaUsuarios(dados) {
    // Aceita resposta como array direto ou dentro de "usuarios"/"clientes".
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    // Filtra usuarios cujo tipo_usuario indica cliente.
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario) === 0);

    // Se encontrou clientes explicitamente, usa essa lista.
    if (clientes.length > 0) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return clientes;
    }

    // Caso contrario, remove apenas administradores/tipo 2 e usa o restante.
    return lista.filter((usuario) => Number(usuario.tipo_usuario) !== 2);
}

// Converte a data do input datetime-local para o formato esperado pela API.
function formatarDataParaApi(data) {
    // Se nao houver data, envia string vazia.
    if (!data) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Separa data e hora do formato "YYYY-MM-DDTHH:mm".
    const [dataCampo, horaCampo = "00:00"] = data.split("T");
    // Separa ano, mes e dia para reorganizar no padrao brasileiro.
    const [ano, mes, dia] = dataCampo.split("-");

    // Se a data nao estiver no formato esperado, devolve como veio.
    if (!ano || !mes || !dia) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return data;
    }

    // Retorna "DD/MM/YYYY HH:mm" para a API.
    return `${dia}/${mes}/${ano} ${horaCampo}`;
}

// Declara a função formatarDataHora usada por esta página.
function formatarDataHora(valor) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "-";
    }

    // Declara texto para uso neste fluxo.
    const texto = String(valor);
    // Declara dataIso para uso neste fluxo.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataIso) {
        // Declara os dados usados neste fluxo.
        const [, ano, mes, dia, hora, minuto] = dataIso;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }

    // Declara dataBr para uso neste fluxo.
    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataBr) {
        // Declara os dados usados neste fluxo.
        const [, dia, mes, ano, hora, minuto] = dataBr;
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

// Gera a data e hora atual no formato aceito pelo input datetime-local.
function dataHoraAtualParaInput() {
    // Captura o momento atual.
    const agora = new Date();
    // Pega o ano atual.
    const ano = agora.getFullYear();
    // Pega o mes atual e garante dois digitos.
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    // Pega o dia atual e garante dois digitos.
    const dia = String(agora.getDate()).padStart(2, "0");
    // Pega a hora atual e garante dois digitos.
    const hora = String(agora.getHours()).padStart(2, "0");
    // Pega o minuto atual e garante dois digitos.
    const minuto = String(agora.getMinutes()).padStart(2, "0");

    // Retorna no formato "YYYY-MM-DDTHH:mm" usado pelo input.
    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

// Descobre o id do veiculo aceitando nomes diferentes vindos da API.
function idVeiculo(veiculo) {
    // Tenta id, id_veiculo e id_carro, nessa ordem.
    return veiculo?.id || veiculo?.id_veiculo || veiculo?.id_carro;
}

// Declara a função textoValido usada por esta página.
function textoValido(valor) {
    // Verifica esta condição antes de continuar o fluxo.
    if (valor === null || valor === undefined) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return String(valor).trim();
}

// Declara a função idCliente usada por esta página.
function idCliente(item) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return textoValido(item?.id_usuario) || textoValido(item?.ID_USUARIO) || textoValido(item?.id) || textoValido(item?.ID);
}

// Declara a função idUsuarioReservaVeiculo usada por esta página.
function idUsuarioReservaVeiculo(veiculo) {
    // Declara reserva para uso neste fluxo.
    const reserva = veiculo?.reserva || veiculo?.RESERVA || {};
    // Declara usuarioReserva para uso neste fluxo.
    const usuarioReserva = reserva?.usuario || reserva?.USUARIO || veiculo?.usuario_reserva || veiculo?.USUARIO_RESERVA || {};
    // Declara clienteReserva para uso neste fluxo.
    const clienteReserva = reserva?.cliente || reserva?.CLIENTE || veiculo?.cliente_reserva || veiculo?.CLIENTE_RESERVA || {};

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        textoValido(veiculo?.id_usuario_reserva) ||
        textoValido(veiculo?.ID_USUARIO_RESERVA) ||
        textoValido(veiculo?.id_usuario_reservado) ||
        textoValido(veiculo?.ID_USUARIO_RESERVADO) ||
        textoValido(veiculo?.id_cliente_reserva) ||
        textoValido(veiculo?.ID_CLIENTE_RESERVA) ||
        textoValido(reserva?.id_usuario) ||
        textoValido(reserva?.ID_USUARIO) ||
        textoValido(reserva?.id_cliente) ||
        textoValido(reserva?.ID_CLIENTE) ||
        textoValido(usuarioReserva?.id_usuario) ||
        textoValido(usuarioReserva?.ID_USUARIO) ||
        textoValido(usuarioReserva?.id) ||
        textoValido(usuarioReserva?.ID) ||
        textoValido(clienteReserva?.id_usuario) ||
        textoValido(clienteReserva?.ID_USUARIO) ||
        textoValido(clienteReserva?.id) ||
        textoValido(clienteReserva?.ID)
    );
}

// Declara a função nomeUsuarioReservaVeiculo usada por esta página.
function nomeUsuarioReservaVeiculo(veiculo) {
    // Declara reserva para uso neste fluxo.
    const reserva = veiculo?.reserva || veiculo?.RESERVA || {};
    // Declara usuarioReserva para uso neste fluxo.
    const usuarioReserva = reserva?.usuario || reserva?.USUARIO || veiculo?.usuario_reserva || veiculo?.USUARIO_RESERVA || {};
    // Declara clienteReserva para uso neste fluxo.
    const clienteReserva = reserva?.cliente || reserva?.CLIENTE || veiculo?.cliente_reserva || veiculo?.CLIENTE_RESERVA || {};

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        textoValido(veiculo?.nome_usuario_reserva) ||
        textoValido(veiculo?.NOME_USUARIO_RESERVA) ||
        textoValido(veiculo?.nome_cliente_reserva) ||
        textoValido(veiculo?.NOME_CLIENTE_RESERVA) ||
        textoValido(reserva?.nome_usuario) ||
        textoValido(reserva?.NOME_USUARIO) ||
        textoValido(reserva?.nome_cliente) ||
        textoValido(reserva?.NOME_CLIENTE) ||
        textoValido(usuarioReserva?.nome) ||
        textoValido(usuarioReserva?.NOME) ||
        textoValido(clienteReserva?.nome) ||
        textoValido(clienteReserva?.NOME) ||
        textoValido(usuarioReserva?.email) ||
        textoValido(clienteReserva?.email)
    );
}

// Declara a função clienteReservaExistenteNoSelect usada por esta página.
function clienteReservaExistenteNoSelect(veiculo, clientes) {
    // Declara idReserva para uso neste fluxo.
    const idReserva = idUsuarioReservaVeiculo(veiculo);

    // Verifica esta condição antes de continuar o fluxo.
    if (!idReserva || !Array.isArray(clientes) || clientes.length === 0) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Declara clienteEncontrado para uso neste fluxo.
    const clienteEncontrado = clientes.find((cliente) => idCliente(cliente) === idReserva);
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return clienteEncontrado ? idCliente(clienteEncontrado) : "";
}

// Declara a função statusVendaVeiculo usada por esta página.
function statusVendaVeiculo(veiculo) {
    // Declara statusVendaApi para uso neste fluxo.
    const statusVendaApi = textoValido(veiculo?.status_venda) || textoValido(veiculo?.STATUS_VENDA) || textoValido(veiculo?.statusVenda);

    // Verifica esta condição antes de continuar o fluxo.
    if (statusVendaApi) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return statusVendaApi.toUpperCase();
    }

    // Declara statusEstoque para uso neste fluxo.
    const statusEstoque = statusEstoqueVeiculo(veiculo).toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (statusEstoque === "2" || statusEstoque.includes("vend")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "VENDIDO";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (statusEstoque === "3" || statusEstoque.includes("reserv") || statusEstoque.includes("indispon")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "RESERVADO_PENDENTE_CONCLUSAO";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (statusEstoque === "1" || statusEstoque.includes("dispon") || statusEstoque.includes("estoque")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "DISPONIVEL";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "";
}

// Declara a função mensagemVendaVeiculo usada por esta página.
function mensagemVendaVeiculo(veiculo) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return textoValido(veiculo?.mensagem_venda) || textoValido(veiculo?.MENSAGEM_VENDA);
}

// Declara a função precisaConcluirVendaVeiculo usada por esta página.
function precisaConcluirVendaVeiculo(veiculo) {
    // Declara indicadorApi para uso neste fluxo.
    const indicadorApi = veiculo?.precisa_concluir_venda ?? veiculo?.PRECISA_CONCLUIR_VENDA;

    // Verifica esta condição antes de continuar o fluxo.
    if (typeof indicadorApi === "boolean") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return indicadorApi;
    }

    // Declara indicadorTexto para uso neste fluxo.
    const indicadorTexto = String(indicadorApi ?? "").trim().toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (["1", "true", "sim", "s"].includes(indicadorTexto)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return true;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (["0", "false", "nao", "não", "n"].includes(indicadorTexto)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return false;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return statusVendaVeiculo(veiculo) === "RESERVADO_PENDENTE_CONCLUSAO";
}

// Declara a função textoStatusVendaPainel usada por esta página.
function textoStatusVendaPainel(statusVenda) {
    // Declara status para uso neste fluxo.
    const status = String(statusVenda || "").toUpperCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "RESERVADO_PENDENTE_CONCLUSAO") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Reservado";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "VENDIDO") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Vendido";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "DISPONIVEL") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Disponível";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return status || "Não informado";
}

// Descobre o status de estoque do veiculo aceitando nomes diferentes de campo.
function statusEstoqueVeiculo(veiculo) {
    // Retorna uma string mesmo quando o status vier nulo ou indefinido.
    return String(
        // Campo em snake_case.
        veiculo?.status_estoque ??
        // Campo em maiusculo.
        veiculo?.STATUS_ESTOQUE ??
        // Campo em camelCase.
        veiculo?.statusEstoque ??
        // Valor padrao quando nenhum campo existe.
        ""
    );
}

// Normaliza o status de estoque para a tela de venda.
function tipoStatusEstoqueVeiculo(veiculo) {
    // Declara statusVenda para uso neste fluxo.
    const statusVenda = statusVendaVeiculo(veiculo);

    // Verifica esta condição antes de continuar o fluxo.
    if (statusVenda === "VENDIDO") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "vendido";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (statusVenda === "RESERVADO_PENDENTE_CONCLUSAO") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "reservado";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (statusVenda === "DISPONIVEL") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "estoque";
    }

    // Normaliza o status para minusculo antes de comparar.
    const status = statusEstoqueVeiculo(veiculo).toLowerCase();

    // Status 2 ou texto vendido nao deve aparecer para uma nova venda.
    if (status === "2" || status.includes("vend")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "vendido";
    }

    // Status 3 e usado pelo fluxo de reserva do cliente.
    if (status === "3" || status.includes("reserv") || status.includes("indispon")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "reservado";
    }

    // Status 1 ou texto de disponibilidade continua vendavel.
    if (status === "1" || status.includes("dispon") || status.includes("estoque")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "estoque";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "";
}

// Verifica se o veiculo pode aparecer na tela de vendas.
function veiculoVendavel(veiculo) {
    // Declara status para uso neste fluxo.
    const status = tipoStatusEstoqueVeiculo(veiculo);

    // Carros em estoque e carros reservados pelo cliente podem virar venda.
    return status === "estoque" || status === "reservado";
}

// Mostra o status no select para diferenciar reserva de estoque normal.
function textoStatusVenda(veiculo) {
    // Declara status para uso neste fluxo.
    const status = tipoStatusEstoqueVeiculo(veiculo);

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "reservado") {
        // Declara nomeReserva para uso neste fluxo.
        const nomeReserva = nomeUsuarioReservaVeiculo(veiculo);
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return nomeReserva ? `Reservado para ${nomeReserva} - precisa concluir venda` : "Reservado - precisa concluir venda";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "vendido") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Vendido";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "estoque") {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Disponível";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "Status não informado";
}

// Monta o nome que sera exibido no select de veiculos.
function nomeVeiculo(veiculo) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return veiculo?.nome || [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(" ") || "Veículo";
}

// Declara a função extrairListaPendencias usada por esta página.
function extrairListaPendencias(dados) {
    // Verifica esta condição antes de continuar o fluxo.
    if (Array.isArray(dados)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (Array.isArray(dados?.pendencias)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados.pendencias;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (Array.isArray(dados?.pendencias_venda)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados.pendencias_venda;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (Array.isArray(dados?.reservas)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados.reservas;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return [];
}

// Declara a função idVeiculoPendencia usada por esta página.
function idVeiculoPendencia(pendencia) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return textoValido(pendencia?.id_veiculo) || textoValido(pendencia?.ID_VEICULO) || textoValido(pendencia?.id_carro) || textoValido(pendencia?.ID_CARRO);
}

// Declara a função nomeVeiculoPendencia usada por esta página.
function nomeVeiculoPendencia(pendencia) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return textoValido(pendencia?.veiculo) || textoValido(pendencia?.nome_veiculo) || textoValido(pendencia?.modelo);
}

// Declara a função nomeClientePendencia usada por esta página.
function nomeClientePendencia(pendencia) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return textoValido(pendencia?.nome_usuario_reserva) || textoValido(pendencia?.NOME_USUARIO_RESERVA);
}

// Monta a URL da imagem do veiculo.
function montarUrlImagem(API, veiculo) {
    // Aceita diferentes nomes de campo para imagem/foto.
    const imagem = veiculo?.imagem || veiculo?.foto || veiculo?.foto_veiculo;

    // Se nao houver imagem, usa o icone padrao.
    if (!imagem) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "/IconCar.png";
    }

    // Se a imagem ja for URL completa, usa como esta.
    if (String(imagem).startsWith("http")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return imagem;
    }

    // Se o caminho comecar com barra, junta direto com a base da API.
    if (String(imagem).startsWith("/")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${API}${imagem}`;
    }

    // Se for caminho relativo, adiciona uma barra entre API e caminho.
    return `${API}/${imagem}`;
}

// Monta a URL do QR Code Pix retornado pela API.
function montarUrlPix(API, caminhoPix) {
    // Sem caminho Pix, nao ha imagem para mostrar.
    if (!caminhoPix) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "";
    }

    // Garante que o caminho sera tratado como texto.
    const caminho = String(caminhoPix);

    // URLs completas e imagens base64/data URL sao usadas diretamente.
    if (caminho.startsWith("http") || caminho.startsWith("data:")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return caminho;
    }

    // Caminhos absolutos sao juntados diretamente com a API.
    if (caminho.startsWith("/")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${API}${caminho}`;
    }

    // Caminhos relativos recebem barra entre API e caminho.
    return `${API}/${caminho}`;
}

// Calcula o valor de cada parcela usando juros compostos quando houver taxa.
function calcularValorParcela(valor, parcelas, juros) {
    // Sem valor ou sem parcelas, nao ha parcela a calcular.
    if (!valor || !parcelas) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return 0;
    }

    // Sem juros, divide o valor igualmente pela quantidade de parcelas.
    if (!juros) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return valor / parcelas;
    }

    // Com juros, aplica a formula de parcela fixa de financiamento.
    return valor * juros / (1 - (1 + juros) ** -parcelas);
}

// Componente principal da pagina de vendas.
function Vendas({ API }) {
    // Permite navegar para outra rota pelo codigo.
    const navigate = useNavigate();
    // Guarda a lista de clientes carregada da API.
    const [clientes, setClientes] = useState([]);
    // Controla se os clientes ainda estao sendo carregados.
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    // Guarda mensagem de erro ao carregar clientes.
    const [erroClientes, setErroClientes] = useState("");
    // Guarda a lista de veiculos disponiveis carregada da API.
    const [veiculos, setVeiculos] = useState([]);
    // Controla se os veiculos ainda estao sendo carregados.
    const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
    // Guarda mensagem de erro ao carregar veiculos.
    const [erroVeiculos, setErroVeiculos] = useState("");
    // Guarda pendencias de reserva que aguardam conclusao de venda.
    const [pendenciasVenda, setPendenciasVenda] = useState([]);
    // Controla o carregamento da lista de pendencias.
    const [carregandoPendencias, setCarregandoPendencias] = useState(true);
    // Guarda erro da lista de pendencias.
    const [erroPendencias, setErroPendencias] = useState("");
    // Declara os dados usados neste fluxo.
    const [cancelandoPendenciaId, setCancelandoPendenciaId] = useState("");
    // Guarda o id do cliente selecionado no formulario.
    const [clienteId, setClienteId] = useState("");
    // Marca quando o cliente foi alterado manualmente apos o auto-preenchimento.
    const [clienteAlteradoManualmente, setClienteAlteradoManualmente] = useState(false);
    // Guarda o id do veiculo selecionado no formulario.
    const [veiculoId, setVeiculoId] = useState("");
    // Guarda a forma de pagamento escolhida.
    const [formaPagamento, setFormaPagamento] = useState("");
    // Guarda a data da venda, iniciando com a data e hora atuais.
    const [dataVenda, setDataVenda] = useState(() => dataHoraAtualParaInput());
    // Guarda o valor bruto da venda digitado ou vindo do veiculo.
    const [valorVenda, setValorVenda] = useState("");
    // Guarda o valor recebido; no Pix ele acompanha o valor com desconto.
    const [valorRecebido, setValorRecebido] = useState("");
    // Guarda o status de pagamento selecionado.
    const [status, setStatus] = useState(statusEmAndamento);
    // Guarda observacoes escritas sobre a venda.
    const [comentarios, setComentarios] = useState("");
    // Guarda o percentual de desconto digitado.
    const [desconto, setDesconto] = useState("");
    // Guarda o arquivo de comprovante/NF escolhido.
    const [comprovante, setComprovante] = useState(null);
    // Guarda dados do Pix gerado, como QR Code e copia e cola.
    const [pixGerado, setPixGerado] = useState(null);
    // Controla o estado de carregamento especifico da geracao do Pix.
    const [gerandoPix, setGerandoPix] = useState(false);
    // Guarda se o Pix atual foi cancelado manualmente.
    const [pixCancelado, setPixCancelado] = useState(false);
    // Guarda mensagem de erro especifica do Pix.
    const [erroPix, setErroPix] = useState("");
    // Guarda a quantidade de parcelas escolhida para financiamento.
    const [parcelasFinanciamento, setParcelasFinanciamento] = useState(48);
    // Controla se o modal com todas as parcelas esta aberto.
    const [modalParcelasAberto, setModalParcelasAberto] = useState(false);
    // Controla se a venda esta sendo enviada para a API.
    const [salvando, setSalvando] = useState(false);
    // Guarda mensagens gerais de sucesso ou erro no topo da pagina.
    const [mensagem, setMensagem] = useState(null);
    // Indica se a venda ja foi finalizada para evitar cadastro duplicado.
    const [vendaFinalizada, setVendaFinalizada] = useState(false);
    // Guarda a taxa de juros mensal em decimal, usando localStorage ou valor padrao.
    const [jurosMensal, setJurosMensal] = useState(() => taxaJurosParaDecimal(taxaJurosConfigurada(localStorage.getItem("taxa_juro_mensal"))));
    // Guarda a chave Pix configurada para a empresa.
    const [chavePixEmpresa, setChavePixEmpresa] = useState(() => localStorage.getItem("chave_pix_empresa") || "");

    // Facilita saber se a forma de pagamento atual e parcelamento.
    const ehParcelamento = formaPagamento === formaPagamentoParcelamento;
    // Facilita saber se a forma de pagamento atual e Pix.
    const ehPix = formaPagamento === formaPagamentoPix;

    // Carrega clientes da API e memoriza a funcao para uso no useEffect.
    const carregarClientes = useCallback(async () => {
        // Mostra estado de carregamento no select de clientes.
        setCarregandoClientes(true);
        // Limpa erros antigos antes de tentar carregar novamente.
        setErroClientes("");

        // Tenta buscar os usuarios no backend.
        try {
            // Faz requisicao GET para listar usuarios.
            const resposta = await fetch(`${API}/listar_usuario`, {
                // Define o metodo HTTP.
                method: "GET",
                // Envia o token quando existir.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies/sessao na chamada.
                credentials: "include"
            });
            // Converte a resposta da API para objeto JavaScript.
            const dados = await resposta.json();

            // Se a API retornou erro, mostra a mensagem e limpa a lista.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErroClientes.
                setErroClientes(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                // Atualiza o estado por meio de setClientes.
                setClientes([]);
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Filtra a resposta para manter apenas usuarios que podem ser clientes.
            const lista = extrairListaUsuarios(dados);
            // Salva os clientes no estado.
            setClientes(lista);

            // Mantem o formulario novo sem cliente selecionado.
            setClienteId((clienteAtual) => {
                // Verifica esta condição antes de continuar o fluxo.
                if (clienteAtual && lista.some((cliente) => idCliente(cliente) === clienteAtual)) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return clienteAtual;
                }

                // Retorna o resultado desta função ou o conteúdo visual da página.
                return "";
            });
        // Caso a requisicao falhe, mostra erro de conexao.
        } catch {
            // Atualiza o estado por meio de setErroClientes.
            setErroClientes("Erro de conexão com o servidor.");
            // Atualiza o estado por meio de setClientes.
            setClientes([]);
        // No fim, remove o estado de carregamento.
        } finally {
            // Atualiza o estado por meio de setCarregandoClientes.
            setCarregandoClientes(false);
        }
    // Recria essa funcao apenas se a URL base da API mudar.
    }, [API]);

    // Carrega os veiculos da API e deixa apenas os que podem virar venda.
    const carregarVeiculos = useCallback(async () => {
        // Mostra estado de carregamento no select de veiculos.
        setCarregandoVeiculos(true);
        // Limpa erros antigos antes da nova busca.
        setErroVeiculos("");

        // Tenta buscar carros no backend.
        try {
            // Faz requisicao GET para listar carros.
            const resposta = await fetch(`${API}/listar_carro`, {
                // Define o metodo HTTP.
                method: "GET",
                headers: cabecalhoAutorizacao(),
                // Inclui cookies/sessao na chamada.
                credentials: "include"
            });
            // Converte a resposta da API para objeto JavaScript.
            const dados = await resposta.json();

            // Se a API retornar erro, mostra mensagem e limpa os veiculos.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErroVeiculos.
                setErroVeiculos(dados.erro || "Erro ao carregar veículos.");
                // Atualiza o estado por meio de setVeiculos.
                setVeiculos([]);
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Pega o array de carros dentro da resposta.
            const lista = Array.isArray(dados) ? dados : (dados.carros || dados.veiculos || []);
            // Mantem veiculos em estoque e os reservados por cliente.
            const vendaveis = lista.filter(veiculoVendavel);
            // Declara vendaveisOrdenados para uso neste fluxo.
            const vendaveisOrdenados = [...vendaveis].sort((a, b) => {
                // Declara prioridadeA para uso neste fluxo.
                const prioridadeA = tipoStatusEstoqueVeiculo(a) === "reservado" ? 0 : 1;
                // Declara prioridadeB para uso neste fluxo.
                const prioridadeB = tipoStatusEstoqueVeiculo(b) === "reservado" ? 0 : 1;

                // Verifica esta condição antes de continuar o fluxo.
                if (prioridadeA !== prioridadeB) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return prioridadeA - prioridadeB;
                }

                // Retorna o resultado desta função ou o conteúdo visual da página.
                return nomeVeiculo(a).localeCompare(nomeVeiculo(b), "pt-BR", { sensitivity: "base" });
            });
            // Salva os veiculos vendaveis no estado.
            setVeiculos(vendaveisOrdenados);

            // Evita selecionar veiculo automaticamente ao abrir uma venda nova.
            setVeiculoId((veiculoAtual) => {
                // Verifica esta condição antes de continuar o fluxo.
                if (veiculoAtual && vendaveisOrdenados.some((veiculo) => String(idVeiculo(veiculo)) === veiculoAtual)) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return veiculoAtual;
                }

                // Retorna o resultado desta função ou o conteúdo visual da página.
                return "";
            });
            // Atualiza o estado por meio de setValorVenda.
            setValorVenda("");
            // Atualiza o estado por meio de setValorRecebido.
            setValorRecebido("");

            // Verifica esta condição antes de continuar o fluxo.
            if (vendaveisOrdenados.length === 0) {
                // Atualiza o estado por meio de setVeiculoId.
                setVeiculoId("");
                // Atualiza o estado por meio de setValorVenda.
                setValorVenda("");
                // Atualiza o estado por meio de setValorRecebido.
                setValorRecebido("");
                // Atualiza o estado por meio de setErroVeiculos.
                setErroVeiculos("Nenhum veículo em estoque ou reservado para venda.");
            }
        // Caso a requisicao falhe, mostra erro de conexao.
        } catch {
            // Atualiza o estado por meio de setErroVeiculos.
            setErroVeiculos("Erro de conexão com o servidor.");
            // Atualiza o estado por meio de setVeiculos.
            setVeiculos([]);
        // No fim, remove o estado de carregamento.
        } finally {
            // Atualiza o estado por meio de setCarregandoVeiculos.
            setCarregandoVeiculos(false);
        }
    // Recria essa funcao apenas se a URL base da API mudar.
    }, [API]);

    // Declara carregarPendenciasVenda para uso neste fluxo.
    const carregarPendenciasVenda = useCallback(async () => {
        // Atualiza o estado por meio de setCarregandoPendencias.
        setCarregandoPendencias(true);
        // Atualiza o estado por meio de setErroPendencias.
        setErroPendencias("");

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/listar_pendencias_venda`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErroPendencias.
                setErroPendencias(dados.erro || dados.mensagem || "Erro ao carregar pendências de venda.");
                // Atualiza o estado por meio de setPendenciasVenda.
                setPendenciasVenda([]);
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setPendenciasVenda.
            setPendenciasVenda(extrairListaPendencias(dados));
        } catch {
            // Atualiza o estado por meio de setErroPendencias.
            setErroPendencias("Erro de conexão ao carregar pendências de venda.");
            // Atualiza o estado por meio de setPendenciasVenda.
            setPendenciasVenda([]);
        } finally {
            // Atualiza o estado por meio de setCarregandoPendencias.
            setCarregandoPendencias(false);
        }
    }, [API]);

    // Quando a tela monta, carrega clientes e veiculos.
    useEffect(() => {
        // Busca clientes na API.
        carregarClientes();
        // Busca veiculos na API.
        carregarVeiculos();
        // Busca pendencias de venda por reserva.
        carregarPendenciasVenda();
    // Executa de novo se as funcoes de carregamento mudarem.
    }, [carregarClientes, carregarPendenciasVenda, carregarVeiculos]);

    // Carrega e acompanha a taxa de juros usada no parcelamento.
    useEffect(() => {
        // Aplica a taxa salva no navegador ou a taxa padrao.
        function aplicarJurosSalvo() {
            // Busca taxa salva no localStorage.
            const taxaSalva = taxaJurosConfigurada(localStorage.getItem("taxa_juro_mensal"));
            // Executa log nesta etapa do fluxo.
            console.log("Taxa de juros aplicada na venda (salva/padrão):", taxaSalva, "%");
            // Atualiza o estado por meio de setItem.
            localStorage.setItem("taxa_juro_mensal", String(taxaSalva));
            // Atualiza o estado da taxa em formato decimal.
            setJurosMensal(taxaJurosParaDecimal(taxaSalva));
            // Atualiza o estado por meio de setChavePixEmpresa.
            setChavePixEmpresa(localStorage.getItem("chave_pix_empresa") || "");
        }

        // Tenta buscar a taxa de juros mais recente na API.
        async function carregarJuros() {
            // Protege a tela contra falhas de rede ou da API.
            try {
                // Chama a rota de configuracoes.
                const resposta = await fetch(`${API}/configuracoes`, {
                    // Define o metodo HTTP.
                    method: "GET",
                    // Envia token quando existir.
                    headers: cabecalhoAutorizacao(),
                    // Inclui cookies/sessao na chamada.
                    credentials: "include"
                });

                // Se a API falhar, usa a taxa salva/local.
                if (!resposta.ok) {
                    // Executa aplicarJurosSalvo nesta etapa do fluxo.
                    aplicarJurosSalvo();
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Converte a resposta para objeto JavaScript.
                const dados = await resposta.json();
                // Aceita nomes diferentes para a taxa retornada pela API.
                const taxa = taxaJurosConfigurada(dados.taxa_juro ?? dados.taxa_juros);
                // Declara chavePixConfigurada para uso neste fluxo.
                const chavePixConfigurada = dados.chave_pix ?? dados.chave_pix_empresa ?? dados.pix_chave ?? "";
                // Salva a taxa no navegador para reaproveitar depois.
                localStorage.setItem("taxa_juro_mensal", String(taxa));
                // Atualiza o estado por meio de setItem.
                localStorage.setItem("chave_pix_empresa", String(chavePixConfigurada));
                // Executa log nesta etapa do fluxo.
                console.log("Taxa de juros aplicada na venda (via API):", taxa, "%");
                // Atualiza a taxa em decimal no estado.
                setJurosMensal(taxaJurosParaDecimal(taxa));
                // Atualiza o estado por meio de setChavePixEmpresa.
                setChavePixEmpresa(String(chavePixConfigurada));
            // Se houver erro de conexao, usa a taxa salva/local.
            } catch {
                // Executa aplicarJurosSalvo nesta etapa do fluxo.
                aplicarJurosSalvo();
            }
        }

        // Executa o carregamento da taxa ao montar a tela.
        carregarJuros();
        // Atualiza a taxa se outra parte do app disparar esse evento.
        window.addEventListener("juros-atualizado", aplicarJurosSalvo);
        // Executa addEventListener nesta etapa do fluxo.
        window.addEventListener("pix-empresa-atualizado", aplicarJurosSalvo);
        // Remove o listener quando o componente desmontar.
        return () => {
            // Executa removeEventListener nesta etapa do fluxo.
            window.removeEventListener("juros-atualizado", aplicarJurosSalvo);
            // Executa removeEventListener nesta etapa do fluxo.
            window.removeEventListener("pix-empresa-atualizado", aplicarJurosSalvo);
        };
    // Reexecuta se a base da API mudar.
    }, [API]);

    // Encontra o objeto completo do veiculo atualmente selecionado.
    const veiculoSelecionado = useMemo(() => {
        // Procura no array pelo id escolhido no select.
        return veiculos.find((veiculo) => String(idVeiculo(veiculo)) === veiculoId) || null;
    // Recalcula apenas quando id ou lista de veiculos mudarem.
    }, [veiculoId, veiculos]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Declara clienteReserva para uso neste fluxo.
        const clienteReserva = clienteReservaExistenteNoSelect(veiculoSelecionado, clientes);

        // Verifica esta condição antes de continuar o fluxo.
        if (!clienteAlteradoManualmente && clienteReserva) {
            // Atualiza o estado por meio de setClienteId.
            setClienteId(clienteReserva);
        }
    }, [clienteAlteradoManualmente, clientes, veiculoSelecionado]);

    // Declara veiculoSelecionadoReservado para uso neste fluxo.
    const veiculoSelecionadoReservado = tipoStatusEstoqueVeiculo(veiculoSelecionado) === "reservado";
    // Declara precisaConcluirSelecionado para uso neste fluxo.
    const precisaConcluirSelecionado = precisaConcluirVendaVeiculo(veiculoSelecionado) || statusVendaVeiculo(veiculoSelecionado) === "RESERVADO_PENDENTE_CONCLUSAO";
    // Declara nomeReservaSelecionada para uso neste fluxo.
    const nomeReservaSelecionada = nomeUsuarioReservaVeiculo(veiculoSelecionado);
    // Declara mensagemVendaSelecionada para uso neste fluxo.
    const mensagemVendaSelecionada = mensagemVendaVeiculo(veiculoSelecionado);

    // Converte o valor da venda para numero.
    const valorNumerico = numeroDoCampo(valorVenda);
    // Converte o desconto para numero.
    const descontoNumerico = numeroDoCampo(desconto);
    // Calcula o valor final garantindo que nunca fique negativo.
    const valorComDesconto = Math.max(valorNumerico - (valorNumerico * descontoNumerico / 100), 0);
    // Usa o valor com desconto como base do parcelamento.
    const valorParcelado = valorComDesconto;
    // Converte juros decimal de volta para percentual para exibir na tela.
    const taxaJurosPercentual = jurosMensal * 100;

    // Limpa informacoes do Pix quando mudam dados que alteram a venda.
    useEffect(() => {
        // Remove Pix gerado anteriormente.
        setPixGerado(null);
        // Limpa erro antigo do Pix.
        setErroPix("");
        // Libera nova geracao automatica para os novos dados.
        setPixCancelado(false);
        // Libera novo envio porque a venda mudou.
        setVendaFinalizada(false);
    // Roda quando forma de pagamento, valor final ou veiculo mudarem.
    }, [formaPagamento, valorComDesconto, veiculoId]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (!ehPix || vendaFinalizada || pixCancelado) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!valorComDesconto) {
            // Atualiza o estado por meio de setPixGerado.
            setPixGerado(null);
            // Atualiza o estado por meio de setErroPix.
            setErroPix("");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara cancelado para uso neste fluxo.
        let cancelado = false;
        // Declara timeout para uso neste fluxo.
        const timeout = setTimeout(async () => {
            // Atualiza o estado por meio de setGerandoPix.
            setGerandoPix(true);
            // Atualiza o estado por meio de setErroPix.
            setErroPix("");

            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Declara resposta para uso neste fluxo.
                const resposta = await fetch(`${API}/gerar_pix_venda`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...cabecalhoAutorizacao()
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        valor: valorComDesconto.toFixed(2),
                        chave_pix: chavePixEmpresa.trim(),
                        chave_pix_empresa: chavePixEmpresa.trim(),
                        pix_chave: chavePixEmpresa.trim(),
                        txid: `VENDA${veiculoId || "PIX"}${Date.now().toString().slice(-6)}`
                    })
                });
                // Declara dados para uso neste fluxo.
                const dados = await resposta.json().catch(() => ({}));

                // Verifica esta condição antes de continuar o fluxo.
                if (cancelado) {
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Verifica esta condição antes de continuar o fluxo.
                if (!resposta.ok) {
                    // Atualiza o estado por meio de setPixGerado.
                    setPixGerado(null);
                    // Atualiza o estado por meio de setErroPix.
                    setErroPix(dados.erro || dados.mensagem || "Não foi possível gerar o Pix.");
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Declara qrCode para uso neste fluxo.
                const qrCode = montarUrlPix(API, dados.pix_qrcode || dados.qr_code || dados.qr_code_base64);
                // Declara copiaECola para uso neste fluxo.
                const copiaECola = dados.pix_copia_cola || dados.pix_copia_e_cola || dados.payload;

                // Verifica esta condição antes de continuar o fluxo.
                if (!qrCode && !copiaECola) {
                    // Atualiza o estado por meio de setPixGerado.
                    setPixGerado(null);
                    // Atualiza o estado por meio de setErroPix.
                    setErroPix("O backend não retornou o QR Code Pix.");
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Atualiza o estado por meio de setPixGerado.
                setPixGerado({ qrCode, copiaECola });
            } catch {
                // Verifica esta condição antes de continuar o fluxo.
                if (!cancelado) {
                    // Atualiza o estado por meio de setPixGerado.
                    setPixGerado(null);
                    // Atualiza o estado por meio de setErroPix.
                    setErroPix("Não foi possível conectar ao backend para gerar o Pix.");
                }
            } finally {
                // Verifica esta condição antes de continuar o fluxo.
                if (!cancelado) {
                    // Atualiza o estado por meio de setGerandoPix.
                    setGerandoPix(false);
                }
            }
        }, 350);

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return () => {
            // Executa esta etapa do fluxo.
            cancelado = true;
            // Executa clearTimeout nesta etapa do fluxo.
            clearTimeout(timeout);
        };
    }, [API, chavePixEmpresa, ehPix, pixCancelado, valorComDesconto, veiculoId, vendaFinalizada]);

    // Quando a venda e Pix, o valor recebido acompanha automaticamente o valor com desconto.
    useEffect(() => {
        // So altera o valor recebido quando a forma atual for Pix.
        if (ehPix) {
            // Grava o valor com duas casas decimais.
            setValorRecebido(String(valorComDesconto.toFixed(2)));
        }
    // Recalcula quando Pix ou valor com desconto mudarem.
    }, [ehPix, valorComDesconto]);

    // Calcula o valor da parcela da quantidade selecionada.
    const valorParcelaParcelamento = useMemo(() => {
        // Garante que a quantidade de parcelas seja numerica e tenha valor minimo.
        const parcelas = Number(parcelasFinanciamento) || 1;

        // Retorna o valor da parcela com base no valor, quantidade e juros.
        return calcularValorParcela(valorParcelado, parcelas, jurosMensal);
    // Recalcula quando juros, parcelas ou valor base mudarem.
    }, [jurosMensal, parcelasFinanciamento, valorParcelado]);

    // Monta a lista de opcoes de parcelamento de 1 ate 120 vezes.
    const opcoesParcelamento = useMemo(() => {
        // Cria 120 opcoes de parcelamento.
        return Array.from({ length: 120 }, (_, indice) => {
            // A quantidade de parcelas e o indice mais 1.
            const quantidade = indice + 1;
            // Calcula o valor da parcela para esta quantidade.
            const valorParcela = calcularValorParcela(valorParcelado, quantidade, jurosMensal);

            // Retorna o objeto usado para renderizar cada botao do modal.
            return {
                // Quantidade de parcelas.
                quantidade,
                // Valor individual da parcela.
                valorParcela,
                // Total pago ao final do parcelamento.
                total: valorParcela * quantidade
            };
        });
    // Recria a lista quando juros ou valor parcelado mudarem.
    }, [jurosMensal, valorParcelado]);

    // Declara a função atualizarClienteManual usada por esta página.
    function atualizarClienteManual(evento) {
        // Atualiza o estado por meio de setClienteAlteradoManualmente.
        setClienteAlteradoManualmente(true);
        // Atualiza o estado por meio de setClienteId.
        setClienteId(evento.target.value);
    }

    // Declara a função selecionarVeiculoPorId usada por esta página.
    function selecionarVeiculoPorId(id, { resetarOverrideCliente = true } = {}) {
        // Declara idSelecionado para uso neste fluxo.
        const idSelecionado = String(id || "");
        // Declara veiculo para uso neste fluxo.
        const veiculo = veiculos.find((item) => String(idVeiculo(item)) === idSelecionado);

        // Verifica esta condição antes de continuar o fluxo.
        if (resetarOverrideCliente) {
            // Atualiza o estado por meio de setClienteAlteradoManualmente.
            setClienteAlteradoManualmente(false);
        }

        // Atualiza o estado por meio de setVeiculoId.
        setVeiculoId(idSelecionado);

        // Verifica esta condição antes de continuar o fluxo.
        if (!veiculo) {
            // Atualiza o estado por meio de setValorVenda.
            setValorVenda("");
            // Atualiza o estado por meio de setValorRecebido.
            setValorRecebido("");
            // Atualiza o estado por meio de setClienteId.
            setClienteId("");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setValorVenda.
        setValorVenda(String(veiculo.preco || 0));
        // Atualiza o estado por meio de setValorRecebido.
        setValorRecebido(String(veiculo.preco || 0));

        // Declara clienteReserva para uso neste fluxo.
        const clienteReserva = clienteReservaExistenteNoSelect(veiculo, clientes);

        // Verifica esta condição antes de continuar o fluxo.
        if (clienteReserva) {
            // Atualiza o estado por meio de setClienteId.
            setClienteId(clienteReserva);
        }
    }

    // Atualiza o veiculo selecionado e seus valores quando o select muda.
    function trocarVeiculo(e) {
        // Executa selecionarVeiculoPorId nesta etapa do fluxo.
        selecionarVeiculoPorId(e.target.value, { resetarOverrideCliente: true });
    }

    // Declara a função concluirVendaDaPendencia usada por esta página.
    function concluirVendaDaPendencia(id) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!id) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Executa selecionarVeiculoPorId nesta etapa do fluxo.
        selecionarVeiculoPorId(id, { resetarOverrideCliente: true });
        // Executa subirParaTopo nesta etapa do fluxo.
        subirParaTopo();
    }

    // Declara a função cancelarReservaVeiculoPorId usada por esta página.
    async function cancelarReservaVeiculoPorId(id) {
        // Declara resposta para uso neste fluxo.
        const resposta = await fetch(`${API}/cancelar_reserva_carro/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                ...cabecalhoAutorizacao()
            },
            credentials: "include",
            body: JSON.stringify({})
        });
        // Declara dados para uso neste fluxo.
        const dados = await resposta.json().catch(() => ({}));

        // Verifica esta condição antes de continuar o fluxo.
        if (!resposta.ok) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error(dados.erro || dados.mensagem || "Não foi possível cancelar a reserva anterior.");
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados;
    }

    // Declara a função cancelarPendenciaReserva usada por esta página.
    async function cancelarPendenciaReserva(id) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!id || cancelandoPendenciaId) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setCancelandoPendenciaId.
        setCancelandoPendenciaId(String(id));

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara dados para uso neste fluxo.
            const dados = await cancelarReservaVeiculoPorId(id);
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("sucesso", dados.mensagem || "Pendencia de reserva cancelada com sucesso.");
            // Executa all nesta etapa do fluxo.
            await Promise.all([carregarPendenciasVenda(), carregarVeiculos()]);
        } catch (erroCancelamento) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", erroCancelamento.message || "Não foi possível conectar ao servidor para cancelar a pendência.");
        } finally {
            // Atualiza o estado por meio de setCancelandoPendenciaId.
            setCancelandoPendenciaId("");
        }
    }

    // Salva o arquivo escolhido no input de comprovante.
    function selecionarComprovante(e) {
        // Pega o primeiro arquivo selecionado ou null.
        const arquivo = e.target.files?.[0] || null;
        // Guarda o arquivo no estado para enviar no FormData.
        setComprovante(arquivo);
    }

    // Define a quantidade de parcelas escolhida no modal.
    function selecionarQuantidadeParcelas(quantidade) {
        // Atualiza a quantidade de parcelas.
        setParcelasFinanciamento(quantidade);
        // Fecha o modal apos escolher.
        setModalParcelasAberto(false);
    }

    // Rola a pagina para o topo para o usuario ver a mensagem.
    function subirParaTopo() {
        // Usa rolagem suave ate o topo.
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Mostra uma mensagem geral no topo da pagina.
    function mostrarMensagem(tipo, texto) {
        // Salva tipo e texto da mensagem.
        setMensagem({ tipo, texto });
        // Leva o usuario ate a mensagem.
        subirParaTopo();
    }

    // Declara a função limparFormularioVenda usada por esta página.
    function limparFormularioVenda() {
        // Atualiza o estado por meio de setClienteId.
        setClienteId("");
        // Atualiza o estado por meio de setClienteAlteradoManualmente.
        setClienteAlteradoManualmente(false);
        // Atualiza o estado por meio de setVeiculoId.
        setVeiculoId("");
        // Atualiza o estado por meio de setComentarios.
        setComentarios("");
        // Atualiza o estado por meio de setComprovante.
        setComprovante(null);
        // Atualiza o estado por meio de setValorVenda.
        setValorVenda("");
        // Atualiza o estado por meio de setValorRecebido.
        setValorRecebido("");
        // Atualiza o estado por meio de setDesconto.
        setDesconto("");
        // Atualiza o estado por meio de setStatus.
        setStatus(statusEmAndamento);
        // Atualiza o estado por meio de setFormaPagamento.
        setFormaPagamento("");
        // Atualiza o estado por meio de setParcelasFinanciamento.
        setParcelasFinanciamento(48);
        // Atualiza o estado por meio de setDataVenda.
        setDataVenda(dataHoraAtualParaInput());
        // Atualiza o estado por meio de setVendaFinalizada.
        setVendaFinalizada(false);
    }

    // Copia o codigo Pix copia e cola para a area de transferencia.
    async function copiarPix() {
        // Se nao houver codigo Pix, nao faz nada.
        if (!pixGerado?.copiaECola) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Tenta copiar usando a API do navegador.
        try {
            // Escreve o codigo Pix na area de transferencia.
            await navigator.clipboard.writeText(pixGerado.copiaECola);
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("sucesso", "Código Pix copiado.");
        // Se o navegador bloquear a copia, mostra erro.
        } catch {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Não foi possível copiar o código Pix automaticamente.");
        }
    }

    // Declara a função gerarNovoPix usada por esta página.
    function gerarNovoPix() {
        // Verifica esta condição antes de continuar o fluxo.
        if (!valorComDesconto || salvando || vendaFinalizada) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setPixCancelado.
        setPixCancelado(false);
        // Atualiza o estado por meio de setErroPix.
        setErroPix("");
        // Executa mostrarMensagem nesta etapa do fluxo.
        mostrarMensagem("sucesso", "Gerando novo Pix.");
    }

    // Monta o FormData que sera enviado para cadastrar a venda.
    function montarFormData() {
        // Cria um FormData para suportar campos de texto e arquivo.
        const formData = new FormData();

        // Adiciona o cliente selecionado.
        formData.append("id_usuario", clienteId);
        // Adiciona o veiculo selecionado.
        formData.append("id_veiculo", veiculoId);
        // Adiciona a forma de pagamento.
        formData.append("forma_pagamento", formaPagamento);
        // Adiciona a data formatada para a API.
        formData.append("data_venda", formatarDataParaApi(dataVenda));
        // Adiciona o valor bruto da venda.
        formData.append("valor_venda", String(valorNumerico));
        // Adiciona o valor recebido, usando valor com desconto automaticamente no Pix.
        formData.append("valor_recebido", String(ehPix ? valorComDesconto.toFixed(2) : numeroDoCampo(valorRecebido)));
        // Adiciona a chave Pix da empresa para o backend gerar o pagamento.
        formData.append("chave_pix", chavePixEmpresa.trim());
        // Executa append nesta etapa do fluxo.
        formData.append("chave_pix_empresa", chavePixEmpresa.trim());
        // Executa append nesta etapa do fluxo.
        formData.append("pix_chave", chavePixEmpresa.trim());
        // Adiciona o status de pagamento.
        formData.append("status_pagamento", status);
        // Adiciona os comentarios da venda.
        formData.append("comentarios", comentarios);
        // Adiciona o percentual de desconto.
        formData.append("desconto", String(descontoNumerico));

        // Se houver arquivo, anexa o comprovante/NF.
        if (comprovante) {
            // Executa append nesta etapa do fluxo.
            formData.append("comprovante", comprovante);
        }

        // Se for parcelamento, adiciona os campos extras do financiamento.
        if (ehParcelamento) {
            // Data de inicio do parcelamento.
            formData.append("data_parcelamento", formatarDataParaApi(dataVenda));
            // Valor original usado para calcular parcelas.
            formData.append("valor_original", String(valorComDesconto.toFixed(2)));
            // Valor de cada parcela.
            formData.append("valor_parcelado", String(valorParcelaParcelamento.toFixed(2)));
            // Valor total com juros.
            formData.append("valor_total_parcelado", String((valorParcelaParcelamento * parcelasFinanciamento).toFixed(2)));
            // Quantidade de parcelas escolhida.
            formData.append("quantidade_parcelas", String(parcelasFinanciamento));
            // Situacao inicial do parcelamento.
            formData.append("situacao_parcelamento", situacaoParcelamento.emAndamento);
        }

        // Retorna o pacote pronto para enviar no body do fetch.
        return formData;
    }

    // Valida os campos obrigatorios antes de enviar a venda.
    function validarVenda() {
        // Limpa mensagem anterior.
        setMensagem(null);
        // Sobe a tela para exibir possiveis alertas.
        subirParaTopo();

        // Bloqueia envio se nenhum cliente foi selecionado.
        if (!clienteId) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Selecione um cliente antes de salvar a venda.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Bloqueia envio se nenhum veiculo valido foi selecionado.
        if (!veiculoSelecionado) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Selecione um veículo antes de salvar a venda.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!formaPagamento) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Selecione a forma de pagamento antes de salvar a venda.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Bloqueia envio se faltar data, valor ou dados obrigatorios de pagamento.
        if (!dataVenda || !valorNumerico || (!ehPix && !numeroDoCampo(valorRecebido)) || (!ehPix && !status)) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Preencha todos os campos obrigatórios da venda.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Bloqueia desconto acima do limite permitido pela tela.
        if (descontoNumerico > 10) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "O desconto pode ser de no máximo 10%.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Se passou por todas as regras, a venda esta valida.
        return true;
    }

    // Le os dados de Pix retornados pela API e joga no estado da tela.
    function aplicarPixDaVenda(dados) {
        // Monta URL do QR Code aceitando nomes diferentes de campo.
        const qrCode = montarUrlPix(API, dados.pix_qrcode || dados.qr_code || dados.qr_code_base64);
        // Pega o codigo copia e cola aceitando nomes diferentes de campo.
        const copiaECola = dados.pix_copia_cola || dados.pix_copia_e_cola || dados.payload;

        // Se a API nao retornou nada de Pix, informa que nao aplicou.
        if (!qrCode && !copiaECola) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Salva os dados do Pix para renderizar na tela.
        setPixGerado({ qrCode, copiaECola });
        // Informa que encontrou dados Pix validos.
        return true;
    }

    // Declara a função idVendaResposta usada por esta página.
    function idVendaResposta(dados) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados?.id_venda || dados?.ID_VENDA || dados?.id || dados?.ID || dados?.venda?.id_venda || dados?.venda?.id;
    }

    // Declara a função buscarPixVendaGerada usada por esta página.
    async function buscarPixVendaGerada(dadosVenda) {
        // Declara idVenda para uso neste fluxo.
        const idVenda = idVendaResposta(dadosVenda);

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Declara chavePix para uso neste fluxo.
        const chavePix = String(chavePixEmpresa || localStorage.getItem("chave_pix_empresa") || "").trim();
        // Declara params para uso neste fluxo.
        const params = chavePix ? `?chave_pix=${encodeURIComponent(chavePix)}` : "";
        // Declara respostaPix para uso neste fluxo.
        const respostaPix = await fetch(`${API}/pix_venda/${idVenda}${params}`, {
            method: "GET",
            headers: cabecalhoAutorizacao(),
            credentials: "include"
        });
        // Declara dadosPix para uso neste fluxo.
        const dadosPix = await respostaPix.json().catch(() => ({}));

        // Verifica esta condição antes de continuar o fluxo.
        if (!respostaPix.ok) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return aplicarPixDaVenda(dadosPix);
    }

    // Envia a venda para a API e, se necessario, tambem trata o Pix retornado.
    async function enviarVenda() {
        // Evita cadastrar a mesma venda novamente depois de finalizada.
        if (vendaFinalizada) {
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("sucesso", "Esta venda já foi cadastrada.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Para o fluxo se a validacao falhar.
        if (!validarVenda()) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Ativa o estado de salvamento.
        setSalvando(true);
        // Ativa o carregamento do Pix sempre que a venda for Pix.
        setGerandoPix(ehPix);
        // Limpa erro antigo do Pix.
        setErroPix("");
        // Remove Pix antigo antes de gerar/salvar de novo.
        setPixGerado(null);

        // Tenta cadastrar a venda no backend.
        try {
            // Envia os dados da venda por POST.
            const resposta = await fetch(`${API}/cadastrar_venda`, {
                // Define o metodo HTTP.
                method: "POST",
                // Envia o token quando existir.
                headers: cabecalhoAutorizacao(),
                // Inclui cookies/sessao na chamada.
                credentials: "include",
                // Envia o FormData com campos e possivel arquivo.
                body: montarFormData()
            });
            // Converte a resposta para objeto JavaScript.
            const dados = await resposta.json();

            // Se a API retornar erro, mostra mensagem e encerra.
            if (!resposta.ok) {
                // Executa mostrarMensagem nesta etapa do fluxo.
                mostrarMensagem("erro", dados.erro || dados.error || dados.mensagem || "Erro ao cadastrar venda.");
                // Se o fluxo era Pix, mostra erro tambem na area do Pix.
                if (ehPix) {
                    // Atualiza o estado por meio de setErroPix.
                    setErroPix(dados.erro || dados.error || dados.mensagem || "Erro ao gerar Pix.");
                }
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Marca a venda como finalizada para bloquear novo envio.
            setVendaFinalizada(true);
            // Atualiza o estado por meio de setStatus.
            setStatus(statusEmAndamento);
            // Mostra mensagem de sucesso da API ou texto padrao.
            mostrarMensagem("sucesso", dados.mensagem || "Venda cadastrada com sucesso.");
            // Executa all nesta etapa do fluxo.
            await Promise.all([carregarVeiculos(), carregarPendenciasVenda()]);

            // Verifica esta condição antes de continuar o fluxo.
            if (ehPix) {
                // Declara pixAplicado para uso neste fluxo.
                const pixAplicado = aplicarPixDaVenda(dados) || await buscarPixVendaGerada(dados);

                // Verifica esta condição antes de continuar o fluxo.
                if (pixAplicado) {
                    // Atualiza o estado por meio de setClienteId.
                    setClienteId("");
                    // Atualiza o estado por meio de setClienteAlteradoManualmente.
                    setClienteAlteradoManualmente(false);
                    // Atualiza o estado por meio de setVeiculoId.
                    setVeiculoId("");
                    // Atualiza o estado por meio de setValorVenda.
                    setValorVenda("");
                    // Atualiza o estado por meio de setValorRecebido.
                    setValorRecebido("");
                    // Atualiza o estado por meio de setDesconto.
                    setDesconto("");
                    // Atualiza o estado por meio de setComentarios.
                    setComentarios("");
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Atualiza o estado por meio de setErroPix.
                setErroPix("Venda salva, mas o QR Code Pix não foi retornado pela API.");
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setFormaPagamento.
            setFormaPagamento("");
            // Executa limparFormularioVenda nesta etapa do fluxo.
            limparFormularioVenda();
        // Trata erro de conexao ou falha inesperada.
        } catch {
            // Se era geracao de Pix, mostra erro especifico.
            if (ehPix) {
                // Atualiza o estado por meio de setErroPix.
                setErroPix("Não foi possível conectar ao servidor para gerar o Pix.");
            }
            // Executa mostrarMensagem nesta etapa do fluxo.
            mostrarMensagem("erro", "Não foi possível conectar ao servidor.");
        // Sempre desliga os estados de carregamento ao final.
        } finally {
            // Atualiza o estado por meio de setSalvando.
            setSalvando(false);
            // Atualiza o estado por meio de setGerandoPix.
            setGerandoPix(false);
        }
    }

    // Handler do submit principal do formulario.
    async function salvarVenda(e) {
        // Impede o reload padrao do formulario.
        e.preventDefault();
        // Envia a venda normalmente.
        await enviarVenda();
    }

    // Renderiza toda a interface da pagina.
    return (
        <main className={css.pagina}>
            {/* Titulo principal da tela. */}
            <h1>Vendas</h1>

            {/* Mostra alerta de sucesso ou erro quando existe mensagem no estado. */}
            {mensagem && (
                <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagemAlertaSucesso : css.mensagemAlertaErro}`}>
                    {/* Texto da mensagem mostrada ao usuario. */}
                    <span>{mensagem.texto}</span>
                    {/* Botao para fechar/limpar a mensagem. */}
                    <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                        x
                    </button>
                </div>
            )}

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.pendenciasBox}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.pendenciasTopo}>
                    {/* Exibe o título desta seção. */}
                    <h2>Pendências de venda</h2>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Reservas aguardando conclusão</span>
                </div>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {carregandoPendencias && (
                    <p className={css.pendenciasEstado}>Carregando pendências...</p>
                )}

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregandoPendencias && erroPendencias && (
                    <p className={css.mensagemErro}>{erroPendencias}</p>
                )}

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregandoPendencias && !erroPendencias && pendenciasVenda.length === 0 && (
                    <p className={css.pendenciasEstado}>Nenhuma pendência de venda no momento.</p>
                )}

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregandoPendencias && !erroPendencias && pendenciasVenda.length > 0 && (
                    <div className={css.pendenciasLista}>
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {pendenciasVenda.map((pendencia, indice) => {
                            // Declara idVeiculoItem para uso neste fluxo.
                            const idVeiculoItem = idVeiculoPendencia(pendencia);
                            // Declara statusVendaItem para uso neste fluxo.
                            const statusVendaItem = statusVendaVeiculo(pendencia);
                            // Declara precisaConcluirItem para uso neste fluxo.
                            const precisaConcluirItem = precisaConcluirVendaVeiculo(pendencia) || statusVendaItem === "RESERVADO_PENDENTE_CONCLUSAO";
                            // Declara mensagemVendaItem para uso neste fluxo.
                            const mensagemVendaItem = mensagemVendaVeiculo(pendencia) || textoValido(pendencia?.mensagem_venda) || textoValido(pendencia?.MENSAGEM_VENDA);
                            // Declara nomeVeiculoItem para uso neste fluxo.
                            const nomeVeiculoItem = nomeVeiculoPendencia(pendencia) || `Veículo ${idVeiculoItem || indice + 1}`;
                            // Declara nomeClienteItem para uso neste fluxo.
                            const nomeClienteItem = nomeClientePendencia(pendencia) || "-";
                            // Declara idClienteItem para uso neste fluxo.
                            const idClienteItem = textoValido(pendencia?.id_usuario_reserva) || textoValido(pendencia?.ID_USUARIO_RESERVA) || "-";
                            // Declara dataReservaItem para uso neste fluxo.
                            const dataReservaItem = formatarDataHora(textoValido(pendencia?.data_reserva) || textoValido(pendencia?.DATA_RESERVA));
                            // Declara precoItem para uso neste fluxo.
                            const precoItem = Number(pendencia?.preco ?? pendencia?.valor_venda ?? 0);

                            // Retorna o resultado desta função ou o conteúdo visual da página.
                            return (
                                <article key={`${idVeiculoItem || "pendencia"}-${indice}`} className={css.pendenciaCard}>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.pendenciaGrid}>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Veículo:</strong> {nomeVeiculoItem}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>ID veículo:</strong> {idVeiculoItem || "-"}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Preço:</strong> {formatarMoeda(precoItem)}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Cliente reservado:</strong> {nomeClienteItem}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>ID cliente:</strong> {idClienteItem}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Data reserva:</strong> {dataReservaItem}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Status:</strong> {textoStatusVendaPainel(statusVendaItem)}</p>
                                        {/* Exibe esta mensagem ou informação. */}
                                        <p><strong>Mensagem:</strong> {mensagemVendaItem || "-"}</p>
                                    </div>

                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.pendenciaAcoes}>
                                        {/* Exibe este botão de ação. */}
                                        <button
                                            type="button"
                                            className={css.botaoConcluirPendencia}
                                            onClick={() => concluirVendaDaPendencia(idVeiculoItem)}
                                            disabled={!idVeiculoItem || !precisaConcluirItem}
                                        >
                                            Concluir venda
                                        </button>
                                        {/* Exibe este botão de ação. */}
                                        <button
                                            type="button"
                                            className={css.botaoCancelarPendencia}
                                            onClick={() => cancelarPendenciaReserva(idVeiculoItem)}
                                            disabled={!idVeiculoItem || cancelandoPendenciaId === String(idVeiculoItem)}
                                        >
                                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                            {cancelandoPendenciaId === String(idVeiculoItem) ? "Cancelando..." : "Cancelar pendência"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Formulario principal de cadastro da venda. */}
            <form className={css.card} onSubmit={salvarVenda}>
                {/* Coluna esquerda com cliente, veiculo e comentarios. */}
                <section className={css.coluna}>
                    {/* Campo de selecao do cliente comprador. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Cliente</span>
                        {/* Select controlado pelo estado clienteId. */}
                        <select value={clienteId} onChange={atualizarClienteManual} disabled={carregandoClientes || clientes.length === 0}>
                            {/* Opcao inicial, mudando texto enquanto carrega. */}
                            <option value="">
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {carregandoClientes ? "Carregando clientes..." : "Selecione um cliente"}
                            </option>
                            {/* Cria uma opcao para cada cliente carregado. */}
                            {clientes.map((item) => (
                                <option key={item.id_usuario || item.id} value={item.id_usuario || item.id}>
                                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                    {item.nome || item.email || `Cliente ${item.id_usuario || item.id}`}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Exibe erro de clientes quando houver. */}
                    {erroClientes && <p className={css.mensagemErro}>{erroClientes}</p>}

                    {/* Campo de selecao do veiculo vendido. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Veículo vendido</span>
                        {/* Select controlado pelo estado veiculoId. */}
                        <select value={veiculoId} onChange={trocarVeiculo} disabled={carregandoVeiculos || veiculos.length === 0}>
                            {/* Opcao inicial, mudando texto enquanto carrega. */}
                            <option value="">
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {carregandoVeiculos ? "Carregando veículos..." : "Selecione um veículo"}
                            </option>
                            {/* Cria uma opcao para cada veiculo vendavel. */}
                            {veiculos.map((veiculo) => (
                                <option key={idVeiculo(veiculo)} value={idVeiculo(veiculo)}>
                                    {/* Percorre os dados para renderizar os itens desta área. */}
                                    {nomeVeiculo(veiculo)} - {textoStatusVenda(veiculo)}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Exibe erro de veiculos quando houver. */}
                    {erroVeiculos && <p className={css.mensagemErro}>{erroVeiculos}</p>}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {veiculoSelecionadoReservado && (
                        <p className={css.avisoReserva}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {nomeReservaSelecionada
                                ? `Este veículo está reservado para ${nomeReservaSelecionada}${precisaConcluirSelecionado ? " e precisa concluir a venda." : "."}`
                                : `Este veículo está reservado${precisaConcluirSelecionado ? " e precisa concluir a venda." : "."}`}
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {mensagemVendaSelecionada ? ` ${mensagemVendaSelecionada}` : ""}
                        </p>
                    )}

                    {/* Mostra o card do veiculo apenas quando existe veiculo selecionado. */}
                    {veiculoSelecionado && (
                        <article className={css.veiculoCard}>
                            {/* Imagem do veiculo, com fallback caso carregue com erro. */}
                            <img
                                src={montarUrlImagem(API, veiculoSelecionado)}
                                alt={nomeVeiculo(veiculoSelecionado)}
                                onError={(e) => {
                                    // Executa esta etapa do fluxo.
                                    e.currentTarget.src = "/IconCar.png";
                                }}
                            />

                            {/* Bloco com informacoes resumidas do veiculo. */}
                            <div className={css.veiculoInfo}>
                                {/* Linha do modelo. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Modelo:</strong>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>{veiculoSelecionado.modelo || "-"}</span>
                                </p>
                                {/* Linha da marca. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Marca:</strong>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>{veiculoSelecionado.marca || "-"}</span>
                                </p>
                                {/* Linha da quilometragem formatada. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Quilometragem:</strong>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>{formatarQuilometragem(veiculoSelecionado.quilometragem)}</span>
                                </p>
                                {/* Linha da cor. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Cor:</strong>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>{veiculoSelecionado.cor || "-"}</span>
                                </p>
                                {/* Exibe esta mensagem ou informação. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Status:</strong>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>{textoStatusVenda(veiculoSelecionado)}</span>
                                </p>
                                {/* Linha do preco de venda formatado. */}
                                <p>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>Preço de venda:</strong>
                                    {/* Renderiza o elemento b nesta parte da página. */}
                                    <b>{formatarMoeda(veiculoSelecionado.preco)}</b>
                                </p>
                            </div>
                        </article>
                    )}

                    {/* Campo de texto livre para observacoes da venda. */}
                    <label className={`${css.campo} ${css.comentarios}`}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Comentários</span>
                        {/* Renderiza o elemento textarea nesta parte da página. */}
                        <textarea
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            placeholder="Digite uma observação sobre a venda..."
                        />
                    </label>
                </section>

                {/* Coluna direita com dados financeiros e acoes de pagamento. */}
                <section className={css.coluna}>
                    {/* Titulo visual do grupo financeiro. */}
                    <div className={css.grupoTitulo}>Financeiro</div>

                    {/* Campo para escolher Pix ou parcelamento. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Forma de Pagamento</span>
                        {/* Select controlado pelo estado formaPagamento. */}
                        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="">Selecione a forma de pagamento</option>
                            {/* Renderiza as opcoes definidas no array formasPagamento. */}
                            {formasPagamento.map((item) => (
                                <option key={item.id} value={item.id}>{item.nome}</option>
                            ))}
                        </select>
                    </label>

                    {/* Mostra resumo de financiamento apenas quando a forma e parcelamento. */}
                    {ehParcelamento && (
                        <div className={css.financiamento}>
                            {/* Card com valor atual da parcela e total financiado. */}
                            <div className={css.parcela}>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Valor da parcela</span>
                                {/* Valor calculado da parcela selecionada. */}
                                <strong>{formatarMoeda(valorParcelaParcelamento)}</strong>
                                {/* Texto com quantidade, juros mensal e total. */}
                                <small>
                                    {/* Percorre os dados para renderizar os itens desta área. */}
                                    {parcelasFinanciamento} parcelas, {taxaJurosPercentual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ao mês, total de {formatarMoeda(valorParcelaParcelamento * parcelasFinanciamento)}
                                </small>
                                {/* Abre o modal para escolher outra quantidade de parcelas. */}
                                <button type="button" className={css.verParcelas} onClick={() => setModalParcelasAberto(true)}>
                                    Ver todas as parcelas
                                </button>
                            </div>
                        </div>
                    )}


                    {/*
                        <div className={css.areaPagamento}>
                            <label className={css.campo}>
                                <span>Chave Pix</span>
                                <input
                                    type="text"
                                    value={chavePix}
                                    onChange={(e) => setChavePix(e.target.value)}
                                    placeholder="Digite a chave Pix"
                                />
                            </label>

                            <label className={css.campo}>
                                <span>ID da transação</span>
                                <input
                                    type="text"
                                    value={transacaoPix}
                                    onChange={(e) => setTransacaoPix(e.target.value)}
                                    placeholder="Digite o código da transação"
                                />
                            </label>
                        </div>
                    )}

                    {ehPix && (
                        <div className={css.pixBox}>
                            <div className={css.pixTopo}>
                                <span>Pix da venda</span>
                                <strong>{formatarMoeda(valorComDesconto)}</strong>
                            </div>

                            <button
                                type="button"
                                className={css.botaoGerarPix}
                                onClick={gerarPix}
                                disabled={gerandoPix || salvando || vendaFinalizada || !valorComDesconto}
                            >
                                {vendaFinalizada ? "Venda salva" : gerandoPix ? "Gerando Pix..." : "Salvar e gerar Pix"}
                            </button>

                            {erroPix && <p className={css.mensagemErro}>{erroPix}</p>}

                            {pixGerado && (
                                <div className={css.pixResultado}>
                                    <img src={pixGerado.qrCode} alt="QR Code Pix" />

                                    <label className={css.campo}>
                                        <span>Pix cópia e cola</span>
                                        <textarea value={pixGerado.copiaECola} readOnly />
                                    </label>

                                    <button type="button" className={css.botaoCopiarPix} onClick={copiarPix}>
                                        Copiar código
                                    </button>
                                </div>
                            )}
                        </div>
                    */}

                    {/* Mostra a area de Pix apenas quando a forma de pagamento e Pix. */}
                    {ehPix && (
                        <div className={css.pixBox}>
                            {/* Cabecalho da area Pix com valor final. */}
                            <div className={css.pixTopo}>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Pix da venda</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{formatarMoeda(valorComDesconto)}</strong>
                            </div>

                            {/* Exibe erro especifico de Pix quando houver. */}
                            {erroPix && <p className={css.mensagemErro}>{erroPix}</p>}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {gerandoPix && !pixGerado && (
                                <p className={css.pixEstado}>Gerando QR Code Pix e cópia e cola...</p>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!vendaFinalizada && !gerandoPix && !pixGerado && valorComDesconto > 0 && (
                                <div className={css.pixEstado}>
                                    {/* Exibe esta mensagem ou informação. */}
                                    <p>{pixCancelado ? "Pix cancelado. Gere outro Pix para continuar." : "O backend vai gerar o QR Code Pix automaticamente."}</p>
                                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                    {pixCancelado && (
                                        <button
                                            type="button"
                                            className={css.botaoGerarPix}
                                            onClick={gerarNovoPix}
                                            disabled={gerandoPix || salvando || vendaFinalizada}
                                        >
                                            Gerar novo Pix
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!vendaFinalizada && !gerandoPix && !pixGerado && !valorComDesconto && (
                                <p className={css.pixEstado}>Informe o veículo ou o valor da venda para gerar o QR Code Pix.</p>
                            )}

                            {/* Mostra QR Code e copia e cola depois que o Pix for gerado. */}
                            {pixGerado && (
                                <div className={css.pixResultado}>
                                    {/* QR Code Pix retornado pela API. */}
                                    <div className={css.pixQrMoldura}>
                                        {/* Exibe esta imagem na interface. */}
                                        <img src={pixGerado.qrCode} alt="QR Code Pix" />
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Pix gerado</span>
                                    </div>

                                    {/* Campo somente leitura com o codigo Pix copia e cola. */}
                                    <label className={`${css.campo} ${css.pixCopiaCampo}`}>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Pix cópia e cola</span>
                                        {/* Renderiza o elemento textarea nesta parte da página. */}
                                        <textarea value={pixGerado.copiaECola} readOnly />
                                    </label>

                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.pixAcoes}>
                                        {/* Exibe este botão de ação. */}
                                        <button type="button" className={css.botaoCopiarPix} onClick={copiarPix}>
                                            Copiar código
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Campo de data e hora da venda. */}
                    <label className={`${css.campo} ${css.campoDataHora}`}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Data e hora</span>
                        {/* Input controlado pelo estado dataVenda. */}
                        <input type="datetime-local" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
                    </label>

                    {/* Linha com upload de comprovante e placa do veiculo. */}
                    <div className={css.linhaDupla}>
                        {/* Campo visual para anexar comprovante ou nota fiscal. */}
                        <div className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Comprovante/NF</span>
                            {/* Input real de arquivo, escondido pelo CSS. */}
                            <input
                                type="file"
                                id="comprovante"
                                className={css.inputArquivo}
                                onChange={selecionarComprovante}
                            />
                            {/* Label usado como botao para abrir o seletor de arquivo. */}
                            <label htmlFor="comprovante" className={css.botaoArquivo}>
                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                + {comprovante?.name || "Anexar arquivo"}
                            </label>
                        </div>

                        {/* Campo somente leitura com a placa do veiculo escolhido. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Placa</span>
                            {/* Exibe este campo de entrada de dados. */}
                            <input type="text" value={veiculoSelecionado?.placa || ""} readOnly />
                        </label>
                    </div>

                    {/* Campo monetario do valor bruto da venda. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Valor da Venda</span>
                        {/* Input com mascara de moeda brasileira. */}
                        <IMaskInput
                            mask={Number}
                            scale={2}
                            thousandsSeparator="."
                            radix=","
                            mapToRadix={["."]}
                            normalizeZeros
                            padFractionalZeros
                            min={0}
                            prefix="R$ "
                            inputMode="decimal"
                            value={valorVenda}
                            onAccept={(valor) => setValorVenda(valor)}
                        />
                    </label>

                    {/* Campo numerico do percentual de desconto. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Desconto (%)</span>
                        {/* Exibe este campo de entrada de dados. */}
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            value={desconto}
                            onChange={(e) => setDesconto(e.target.value)}
                            placeholder="0"
                        />
                    </label>

                    {/* Resumo mostrando o valor final depois do desconto. */}
                    <div className={css.resumoDesconto}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Valor com desconto</span>
                        {/* Renderiza o elemento strong nesta parte da página. */}
                        <strong>{formatarMoeda(valorComDesconto)}</strong>
                    </div>

                    {/* Campo monetario do valor recebido. */}
                    <label className={css.campo}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Valor Recebido</span>
                        {/* No Pix, fica somente leitura porque o valor vem do total com desconto. */}
                        <IMaskInput
                            mask={Number}
                            scale={2}
                            thousandsSeparator="."
                            radix=","
                            mapToRadix={["."]}
                            normalizeZeros
                            padFractionalZeros
                            min={0}
                            prefix="R$ "
                            inputMode="decimal"
                            value={valorRecebido}
                            onAccept={(valor) => setValorRecebido(valor)}
                            readOnly={ehPix}
                        />
                    </label>

                    {/* Linha do status de pagamento. */}
                    <div className={css.linhaStatus}>
                        {/* Select com o status atual do pagamento. */}
                        <label className={css.campo}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>Status de Pagamento</span>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                {/* Renderiza as opcoes de status de pagamento. */}
                                {statusPagamento.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                </section>

                {/* Area de botoes finais do formulario. */}
                <div className={css.acoes}>
                    {/* Botao principal que envia o formulario. */}
                    <button type="submit" className={css.salvar} disabled={salvando || vendaFinalizada}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {vendaFinalizada ? "Venda salva" : salvando && ehPix ? "Gerando Pix..." : salvando ? "Salvando..." : "Salvar"}
                    </button>
                    {/* Botao secundario que volta para a tela de vendas/cancela. */}
                    <button type="button" className={css.cancelar} onClick={() => navigate("/dashboardAdmVendas")}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {vendaFinalizada ? "Voltar" : "Cancelar"}
                    </button>
                </div>
            </form>

            {/* Modal de parcelamento exibido apenas quando esta aberto. */}
            {modalParcelasAberto && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloParcelamento">
                    {/* Conteudo central do modal. */}
                    <div className={css.modalParcelas}>
                        {/* Topo do modal com titulo e botao de fechar. */}
                        <div className={css.modalTopo}>
                            {/* Exibe o título desta seção. */}
                            <h2 id="tituloParcelamento">Parcelamento</h2>
                            {/* Fecha o modal sem alterar a parcela. */}
                            <button type="button" onClick={() => setModalParcelasAberto(false)} aria-label="Fechar">
                                x
                            </button>
                        </div>

                        {/* Cabecalho da lista de opcoes de parcelas. */}
                        <div className={css.modalCabecalho}>
                            {/* Renderiza o elemento strong nesta parte da página. */}
                            <strong>Parcelas</strong>
                            {/* Renderiza o elemento strong nesta parte da página. */}
                            <strong>Total</strong>
                        </div>

                        {/* Lista de botoes com todas as opcoes de parcelamento. */}
                        <div className={css.listaParcelas}>
                            {/* Renderiza uma opcao para cada quantidade de parcelas. */}
                            {opcoesParcelamento.map((opcao) => (
                                <button
                                    type="button"
                                    key={opcao.quantidade}
                                    className={`${css.itemParcela} ${
                                        Number(parcelasFinanciamento) === opcao.quantidade ? css.itemParcelaAtivo : ""
                                    }`}
                                    onClick={() => selecionarQuantidadeParcelas(opcao.quantidade)}
                                >
                                    {/* Lado esquerdo: quantidade de parcelas e valor de cada uma. */}
                                    <span>
                                        {/* Renderiza o elemento b nesta parte da página. */}
                                        <b>
                                            {/* Percorre os dados para renderizar os itens desta área. */}
                                            {String(opcao.quantidade).padStart(2, "0")}x de {formatarMoeda(opcao.valorParcela)}
                                        </b>
                                        {/* Renderiza o elemento small nesta parte da página. */}
                                        <small>com juros</small>
                                    </span>
                                    {/* Lado direito: total pago naquela opcao. */}
                                    <strong>{formatarMoeda(opcao.total)}</strong>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default Vendas;
