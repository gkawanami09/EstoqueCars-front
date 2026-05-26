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
        return clientes;
    }

    // Caso contrario, remove apenas administradores/tipo 2 e usa o restante.
    return lista.filter((usuario) => Number(usuario.tipo_usuario) !== 2);
}

// Converte a data do input datetime-local para o formato esperado pela API.
function formatarDataParaApi(data) {
    // Se nao houver data, envia string vazia.
    if (!data) {
        return "";
    }

    // Separa data e hora do formato "YYYY-MM-DDTHH:mm".
    const [dataCampo, horaCampo = "00:00"] = data.split("T");
    // Separa ano, mes e dia para reorganizar no padrao brasileiro.
    const [ano, mes, dia] = dataCampo.split("-");

    // Se a data nao estiver no formato esperado, devolve como veio.
    if (!ano || !mes || !dia) {
        return data;
    }

    // Retorna "DD/MM/YYYY HH:mm" para a API.
    return `${dia}/${mes}/${ano} ${horaCampo}`;
}

function formatarDataHora(valor) {
    if (!valor) {
        return "-";
    }

    const texto = String(valor);
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);

    if (dataIso) {
        const [, ano, mes, dia, hora, minuto] = dataIso;
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }

    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

    if (dataBr) {
        const [, dia, mes, ano, hora, minuto] = dataBr;
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

function textoValido(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor).trim();
}

function idCliente(item) {
    return textoValido(item?.id_usuario) || textoValido(item?.ID_USUARIO) || textoValido(item?.id) || textoValido(item?.ID);
}

function idUsuarioReservaVeiculo(veiculo) {
    const reserva = veiculo?.reserva || veiculo?.RESERVA || {};
    const usuarioReserva = reserva?.usuario || reserva?.USUARIO || veiculo?.usuario_reserva || veiculo?.USUARIO_RESERVA || {};
    const clienteReserva = reserva?.cliente || reserva?.CLIENTE || veiculo?.cliente_reserva || veiculo?.CLIENTE_RESERVA || {};

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

function nomeUsuarioReservaVeiculo(veiculo) {
    const reserva = veiculo?.reserva || veiculo?.RESERVA || {};
    const usuarioReserva = reserva?.usuario || reserva?.USUARIO || veiculo?.usuario_reserva || veiculo?.USUARIO_RESERVA || {};
    const clienteReserva = reserva?.cliente || reserva?.CLIENTE || veiculo?.cliente_reserva || veiculo?.CLIENTE_RESERVA || {};

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

function clienteReservaExistenteNoSelect(veiculo, clientes) {
    const idReserva = idUsuarioReservaVeiculo(veiculo);

    if (!idReserva || !Array.isArray(clientes) || clientes.length === 0) {
        return "";
    }

    const clienteEncontrado = clientes.find((cliente) => idCliente(cliente) === idReserva);
    return clienteEncontrado ? idCliente(clienteEncontrado) : "";
}

function statusVendaVeiculo(veiculo) {
    const statusVendaApi = textoValido(veiculo?.status_venda) || textoValido(veiculo?.STATUS_VENDA) || textoValido(veiculo?.statusVenda);

    if (statusVendaApi) {
        return statusVendaApi.toUpperCase();
    }

    const statusEstoque = statusEstoqueVeiculo(veiculo).toLowerCase();

    if (statusEstoque === "2" || statusEstoque.includes("vend")) {
        return "VENDIDO";
    }

    if (statusEstoque === "3" || statusEstoque.includes("reserv") || statusEstoque.includes("indispon")) {
        return "RESERVADO_PENDENTE_CONCLUSAO";
    }

    if (statusEstoque === "1" || statusEstoque.includes("dispon") || statusEstoque.includes("estoque")) {
        return "DISPONIVEL";
    }

    return "";
}

function mensagemVendaVeiculo(veiculo) {
    return textoValido(veiculo?.mensagem_venda) || textoValido(veiculo?.MENSAGEM_VENDA);
}

function precisaConcluirVendaVeiculo(veiculo) {
    const indicadorApi = veiculo?.precisa_concluir_venda ?? veiculo?.PRECISA_CONCLUIR_VENDA;

    if (typeof indicadorApi === "boolean") {
        return indicadorApi;
    }

    const indicadorTexto = String(indicadorApi ?? "").trim().toLowerCase();

    if (["1", "true", "sim", "s"].includes(indicadorTexto)) {
        return true;
    }

    if (["0", "false", "nao", "não", "n"].includes(indicadorTexto)) {
        return false;
    }

    return statusVendaVeiculo(veiculo) === "RESERVADO_PENDENTE_CONCLUSAO";
}

function textoStatusVendaPainel(statusVenda) {
    const status = String(statusVenda || "").toUpperCase();

    if (status === "RESERVADO_PENDENTE_CONCLUSAO") {
        return "Reservado";
    }

    if (status === "VENDIDO") {
        return "Vendido";
    }

    if (status === "DISPONIVEL") {
        return "Disponível";
    }

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
    const statusVenda = statusVendaVeiculo(veiculo);

    if (statusVenda === "VENDIDO") {
        return "vendido";
    }

    if (statusVenda === "RESERVADO_PENDENTE_CONCLUSAO") {
        return "reservado";
    }

    if (statusVenda === "DISPONIVEL") {
        return "estoque";
    }

    // Normaliza o status para minusculo antes de comparar.
    const status = statusEstoqueVeiculo(veiculo).toLowerCase();

    // Status 2 ou texto vendido nao deve aparecer para uma nova venda.
    if (status === "2" || status.includes("vend")) {
        return "vendido";
    }

    // Status 3 e usado pelo fluxo de reserva do cliente.
    if (status === "3" || status.includes("reserv") || status.includes("indispon")) {
        return "reservado";
    }

    // Status 1 ou texto de disponibilidade continua vendavel.
    if (status === "1" || status.includes("dispon") || status.includes("estoque")) {
        return "estoque";
    }

    return "";
}

// Verifica se o veiculo pode aparecer na tela de vendas.
function veiculoVendavel(veiculo) {
    const status = tipoStatusEstoqueVeiculo(veiculo);

    // Carros em estoque e carros reservados pelo cliente podem virar venda.
    return status === "estoque" || status === "reservado";
}

// Mostra o status no select para diferenciar reserva de estoque normal.
function textoStatusVenda(veiculo) {
    const status = tipoStatusEstoqueVeiculo(veiculo);

    if (status === "reservado") {
        const nomeReserva = nomeUsuarioReservaVeiculo(veiculo);
        return nomeReserva ? `Reservado para ${nomeReserva} - precisa concluir venda` : "Reservado - precisa concluir venda";
    }

    if (status === "vendido") {
        return "Vendido";
    }

    if (status === "estoque") {
        return "Disponível";
    }

    return "Status não informado";
}

// Monta o nome que sera exibido no select de veiculos.
function nomeVeiculo(veiculo) {
    return veiculo?.nome || [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(" ") || "Veículo";
}

function extrairListaPendencias(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    if (Array.isArray(dados?.pendencias)) {
        return dados.pendencias;
    }

    if (Array.isArray(dados?.pendencias_venda)) {
        return dados.pendencias_venda;
    }

    if (Array.isArray(dados?.reservas)) {
        return dados.reservas;
    }

    return [];
}

function idVeiculoPendencia(pendencia) {
    return textoValido(pendencia?.id_veiculo) || textoValido(pendencia?.ID_VEICULO) || textoValido(pendencia?.id_carro) || textoValido(pendencia?.ID_CARRO);
}

function nomeVeiculoPendencia(pendencia) {
    return textoValido(pendencia?.veiculo) || textoValido(pendencia?.nome_veiculo) || textoValido(pendencia?.modelo);
}

function nomeClientePendencia(pendencia) {
    return textoValido(pendencia?.nome_usuario_reserva) || textoValido(pendencia?.NOME_USUARIO_RESERVA);
}

// Monta a URL da imagem do veiculo.
function montarUrlImagem(API, veiculo) {
    // Aceita diferentes nomes de campo para imagem/foto.
    const imagem = veiculo?.imagem || veiculo?.foto || veiculo?.foto_veiculo;

    // Se nao houver imagem, usa o icone padrao.
    if (!imagem) {
        return "/IconCar.png";
    }

    // Se a imagem ja for URL completa, usa como esta.
    if (String(imagem).startsWith("http")) {
        return imagem;
    }

    // Se o caminho comecar com barra, junta direto com a base da API.
    if (String(imagem).startsWith("/")) {
        return `${API}${imagem}`;
    }

    // Se for caminho relativo, adiciona uma barra entre API e caminho.
    return `${API}/${imagem}`;
}

// Monta a URL do QR Code Pix retornado pela API.
function montarUrlPix(API, caminhoPix) {
    // Sem caminho Pix, nao ha imagem para mostrar.
    if (!caminhoPix) {
        return "";
    }

    // Garante que o caminho sera tratado como texto.
    const caminho = String(caminhoPix);

    // URLs completas e imagens base64/data URL sao usadas diretamente.
    if (caminho.startsWith("http") || caminho.startsWith("data:")) {
        return caminho;
    }

    // Caminhos absolutos sao juntados diretamente com a API.
    if (caminho.startsWith("/")) {
        return `${API}${caminho}`;
    }

    // Caminhos relativos recebem barra entre API e caminho.
    return `${API}/${caminho}`;
}

// Calcula o valor de cada parcela usando juros compostos quando houver taxa.
function calcularValorParcela(valor, parcelas, juros) {
    // Sem valor ou sem parcelas, nao ha parcela a calcular.
    if (!valor || !parcelas) {
        return 0;
    }

    // Sem juros, divide o valor igualmente pela quantidade de parcelas.
    if (!juros) {
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
                setErroClientes(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                setClientes([]);
                return;
            }

            // Filtra a resposta para manter apenas usuarios que podem ser clientes.
            const lista = extrairListaUsuarios(dados);
            // Salva os clientes no estado.
            setClientes(lista);

            // Mantem o formulario novo sem cliente selecionado.
            setClienteId((clienteAtual) => {
                if (clienteAtual && lista.some((cliente) => idCliente(cliente) === clienteAtual)) {
                    return clienteAtual;
                }

                return "";
            });
        // Caso a requisicao falhe, mostra erro de conexao.
        } catch {
            setErroClientes("Erro de conexão com o servidor.");
            setClientes([]);
        // No fim, remove o estado de carregamento.
        } finally {
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
                setErroVeiculos(dados.erro || "Erro ao carregar veículos.");
                setVeiculos([]);
                return;
            }

            // Pega o array de carros dentro da resposta.
            const lista = Array.isArray(dados) ? dados : (dados.carros || dados.veiculos || []);
            // Mantem veiculos em estoque e os reservados por cliente.
            const vendaveis = lista.filter(veiculoVendavel);
            const vendaveisOrdenados = [...vendaveis].sort((a, b) => {
                const prioridadeA = tipoStatusEstoqueVeiculo(a) === "reservado" ? 0 : 1;
                const prioridadeB = tipoStatusEstoqueVeiculo(b) === "reservado" ? 0 : 1;

                if (prioridadeA !== prioridadeB) {
                    return prioridadeA - prioridadeB;
                }

                return nomeVeiculo(a).localeCompare(nomeVeiculo(b), "pt-BR", { sensitivity: "base" });
            });
            // Salva os veiculos vendaveis no estado.
            setVeiculos(vendaveisOrdenados);

            // Evita selecionar veiculo automaticamente ao abrir uma venda nova.
            setVeiculoId((veiculoAtual) => {
                if (veiculoAtual && vendaveisOrdenados.some((veiculo) => String(idVeiculo(veiculo)) === veiculoAtual)) {
                    return veiculoAtual;
                }

                return "";
            });
            setValorVenda("");
            setValorRecebido("");

            if (vendaveisOrdenados.length === 0) {
                setVeiculoId("");
                setValorVenda("");
                setValorRecebido("");
                setErroVeiculos("Nenhum veículo em estoque ou reservado para venda.");
            }
        // Caso a requisicao falhe, mostra erro de conexao.
        } catch {
            setErroVeiculos("Erro de conexão com o servidor.");
            setVeiculos([]);
        // No fim, remove o estado de carregamento.
        } finally {
            setCarregandoVeiculos(false);
        }
    // Recria essa funcao apenas se a URL base da API mudar.
    }, [API]);

    const carregarPendenciasVenda = useCallback(async () => {
        setCarregandoPendencias(true);
        setErroPendencias("");

        try {
            const resposta = await fetch(`${API}/listar_pendencias_venda`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroPendencias(dados.erro || dados.mensagem || "Erro ao carregar pendências de venda.");
                setPendenciasVenda([]);
                return;
            }

            setPendenciasVenda(extrairListaPendencias(dados));
        } catch {
            setErroPendencias("Erro de conexão ao carregar pendências de venda.");
            setPendenciasVenda([]);
        } finally {
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
            console.log("Taxa de juros aplicada na venda (salva/padrão):", taxaSalva, "%");
            localStorage.setItem("taxa_juro_mensal", String(taxaSalva));
            // Atualiza o estado da taxa em formato decimal.
            setJurosMensal(taxaJurosParaDecimal(taxaSalva));
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
                    aplicarJurosSalvo();
                    return;
                }

                // Converte a resposta para objeto JavaScript.
                const dados = await resposta.json();
                // Aceita nomes diferentes para a taxa retornada pela API.
                const taxa = taxaJurosConfigurada(dados.taxa_juro ?? dados.taxa_juros);
                const chavePixConfigurada = dados.chave_pix ?? dados.chave_pix_empresa ?? dados.pix_chave ?? "";
                // Salva a taxa no navegador para reaproveitar depois.
                localStorage.setItem("taxa_juro_mensal", String(taxa));
                localStorage.setItem("chave_pix_empresa", String(chavePixConfigurada));
                console.log("Taxa de juros aplicada na venda (via API):", taxa, "%");
                // Atualiza a taxa em decimal no estado.
                setJurosMensal(taxaJurosParaDecimal(taxa));
                setChavePixEmpresa(String(chavePixConfigurada));
            // Se houver erro de conexao, usa a taxa salva/local.
            } catch {
                aplicarJurosSalvo();
            }
        }

        // Executa o carregamento da taxa ao montar a tela.
        carregarJuros();
        // Atualiza a taxa se outra parte do app disparar esse evento.
        window.addEventListener("juros-atualizado", aplicarJurosSalvo);
        window.addEventListener("pix-empresa-atualizado", aplicarJurosSalvo);
        // Remove o listener quando o componente desmontar.
        return () => {
            window.removeEventListener("juros-atualizado", aplicarJurosSalvo);
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

    useEffect(() => {
        const clienteReserva = clienteReservaExistenteNoSelect(veiculoSelecionado, clientes);

        if (!clienteAlteradoManualmente && clienteReserva) {
            setClienteId(clienteReserva);
        }
    }, [clienteAlteradoManualmente, clientes, veiculoSelecionado]);

    const veiculoSelecionadoReservado = tipoStatusEstoqueVeiculo(veiculoSelecionado) === "reservado";
    const precisaConcluirSelecionado = precisaConcluirVendaVeiculo(veiculoSelecionado) || statusVendaVeiculo(veiculoSelecionado) === "RESERVADO_PENDENTE_CONCLUSAO";
    const nomeReservaSelecionada = nomeUsuarioReservaVeiculo(veiculoSelecionado);
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
        // Libera novo envio porque a venda mudou.
        setVendaFinalizada(false);
    // Roda quando forma de pagamento, valor final ou veiculo mudarem.
    }, [formaPagamento, valorComDesconto, veiculoId]);

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

    function atualizarClienteManual(evento) {
        setClienteAlteradoManualmente(true);
        setClienteId(evento.target.value);
    }

    function selecionarVeiculoPorId(id, { resetarOverrideCliente = true } = {}) {
        const idSelecionado = String(id || "");
        const veiculo = veiculos.find((item) => String(idVeiculo(item)) === idSelecionado);

        if (resetarOverrideCliente) {
            setClienteAlteradoManualmente(false);
        }

        setVeiculoId(idSelecionado);

        if (!veiculo) {
            setValorVenda("");
            setValorRecebido("");
            setClienteId("");
            return;
        }

        setValorVenda(String(veiculo.preco || 0));
        setValorRecebido(String(veiculo.preco || 0));

        const clienteReserva = clienteReservaExistenteNoSelect(veiculo, clientes);

        if (clienteReserva) {
            setClienteId(clienteReserva);
        }
    }

    // Atualiza o veiculo selecionado e seus valores quando o select muda.
    function trocarVeiculo(e) {
        selecionarVeiculoPorId(e.target.value, { resetarOverrideCliente: true });
    }

    function concluirVendaDaPendencia(id) {
        if (!id) {
            return;
        }

        selecionarVeiculoPorId(id, { resetarOverrideCliente: true });
        subirParaTopo();
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

    // Copia o codigo Pix copia e cola para a area de transferencia.
    async function copiarPix() {
        // Se nao houver codigo Pix, nao faz nada.
        if (!pixGerado?.copiaECola) {
            return;
        }

        // Tenta copiar usando a API do navegador.
        try {
            // Escreve o codigo Pix na area de transferencia.
            await navigator.clipboard.writeText(pixGerado.copiaECola);
            mostrarMensagem("sucesso", "Código Pix copiado.");
        // Se o navegador bloquear a copia, mostra erro.
        } catch {
            mostrarMensagem("erro", "Não foi possível copiar o código Pix automaticamente.");
        }
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
        formData.append("chave_pix_empresa", chavePixEmpresa.trim());
        formData.append("pix_chave", chavePixEmpresa.trim());
        // Adiciona o status de pagamento.
        formData.append("status_pagamento", status);
        // Adiciona os comentarios da venda.
        formData.append("comentarios", comentarios);
        // Adiciona o percentual de desconto.
        formData.append("desconto", String(descontoNumerico));

        // Se houver arquivo, anexa o comprovante/NF.
        if (comprovante) {
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
            mostrarMensagem("erro", "Selecione um cliente antes de salvar a venda.");
            return false;
        }

        // Bloqueia envio se nenhum veiculo valido foi selecionado.
        if (!veiculoSelecionado) {
            mostrarMensagem("erro", "Selecione um veículo antes de salvar a venda.");
            return false;
        }

        if (!formaPagamento) {
            mostrarMensagem("erro", "Selecione a forma de pagamento antes de salvar a venda.");
            return false;
        }

        // Bloqueia envio se faltar data, valor ou dados obrigatorios de pagamento.
        if (!dataVenda || !valorNumerico || (!ehPix && !numeroDoCampo(valorRecebido)) || (!ehPix && !status)) {
            mostrarMensagem("erro", "Preencha todos os campos obrigatórios da venda.");
            return false;
        }

        // Bloqueia desconto acima do limite permitido pela tela.
        if (descontoNumerico > 10) {
            mostrarMensagem("erro", "O desconto pode ser de no máximo 10%.");
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
            return false;
        }

        // Salva os dados do Pix para renderizar na tela.
        setPixGerado({ qrCode, copiaECola });
        // Informa que encontrou dados Pix validos.
        return true;
    }

    // Envia a venda para a API e, se necessario, tambem trata o Pix retornado.
    async function enviarVenda({ gerarPixVenda = false } = {}) {
        // Evita cadastrar a mesma venda novamente depois de finalizada.
        if (vendaFinalizada) {
            mostrarMensagem("sucesso", "Esta venda ja foi cadastrada.");
            return;
        }

        // Para o fluxo se a validacao falhar.
        if (!validarVenda()) {
            return;
        }

        // Ativa o estado de salvamento.
        setSalvando(true);
        // Ativa o carregamento do Pix quando o botao de Pix foi usado.
        setGerandoPix(gerarPixVenda);
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
                mostrarMensagem("erro", dados.erro || dados.error || dados.mensagem || "Erro ao cadastrar venda.");
                // Se o fluxo era Pix, mostra erro tambem na area do Pix.
                if (gerarPixVenda) {
                    setErroPix(dados.erro || dados.error || dados.mensagem || "Erro ao gerar Pix.");
                }
                return;
            }

            // Marca a venda como finalizada para bloquear novo envio.
            setVendaFinalizada(true);
            // Mostra mensagem de sucesso da API ou texto padrao.
            mostrarMensagem("sucesso", dados.mensagem || "Venda cadastrada com sucesso.");
            await Promise.all([carregarVeiculos(), carregarPendenciasVenda()]);

            // Se for Pix e a API retornou dados Pix, deixa o QR Code na tela.
            if (ehPix && aplicarPixDaVenda(dados)) {
                return;
            }
        // Trata erro de conexao ou falha inesperada.
        } catch {
            // Se era geracao de Pix, mostra erro especifico.
            if (gerarPixVenda) {
                setErroPix("Não foi possível conectar ao servidor para gerar o Pix.");
            }
            mostrarMensagem("erro", "Não foi possível conectar ao servidor.");
        // Sempre desliga os estados de carregamento ao final.
        } finally {
            setSalvando(false);
            setGerandoPix(false);
        }
    }

    // Atalho chamado pelo botao "Salvar e gerar Pix".
    async function gerarPix() {
        // Envia a venda informando que tambem deve tratar Pix.
        await enviarVenda({ gerarPixVenda: true });
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

            <section className={css.pendenciasBox}>
                <div className={css.pendenciasTopo}>
                    <h2>Pendências de venda</h2>
                    <span>Reservas aguardando conclusão</span>
                </div>

                {carregandoPendencias && (
                    <p className={css.pendenciasEstado}>Carregando pendências...</p>
                )}

                {!carregandoPendencias && erroPendencias && (
                    <p className={css.mensagemErro}>{erroPendencias}</p>
                )}

                {!carregandoPendencias && !erroPendencias && pendenciasVenda.length === 0 && (
                    <p className={css.pendenciasEstado}>Nenhuma pendência de venda no momento.</p>
                )}

                {!carregandoPendencias && !erroPendencias && pendenciasVenda.length > 0 && (
                    <div className={css.pendenciasLista}>
                        {pendenciasVenda.map((pendencia, indice) => {
                            const idVeiculoItem = idVeiculoPendencia(pendencia);
                            const statusVendaItem = statusVendaVeiculo(pendencia);
                            const precisaConcluirItem = precisaConcluirVendaVeiculo(pendencia) || statusVendaItem === "RESERVADO_PENDENTE_CONCLUSAO";
                            const mensagemVendaItem = mensagemVendaVeiculo(pendencia) || textoValido(pendencia?.mensagem_venda) || textoValido(pendencia?.MENSAGEM_VENDA);
                            const nomeVeiculoItem = nomeVeiculoPendencia(pendencia) || `Veículo ${idVeiculoItem || indice + 1}`;
                            const nomeClienteItem = nomeClientePendencia(pendencia) || "-";
                            const idClienteItem = textoValido(pendencia?.id_usuario_reserva) || textoValido(pendencia?.ID_USUARIO_RESERVA) || "-";
                            const dataReservaItem = formatarDataHora(textoValido(pendencia?.data_reserva) || textoValido(pendencia?.DATA_RESERVA));
                            const precoItem = Number(pendencia?.preco ?? pendencia?.valor_venda ?? 0);

                            return (
                                <article key={`${idVeiculoItem || "pendencia"}-${indice}`} className={css.pendenciaCard}>
                                    <div className={css.pendenciaGrid}>
                                        <p><strong>Veículo:</strong> {nomeVeiculoItem}</p>
                                        <p><strong>ID veículo:</strong> {idVeiculoItem || "-"}</p>
                                        <p><strong>Preço:</strong> {formatarMoeda(precoItem)}</p>
                                        <p><strong>Cliente reservado:</strong> {nomeClienteItem}</p>
                                        <p><strong>ID cliente:</strong> {idClienteItem}</p>
                                        <p><strong>Data reserva:</strong> {dataReservaItem}</p>
                                        <p><strong>Status:</strong> {textoStatusVendaPainel(statusVendaItem)}</p>
                                        <p><strong>Mensagem:</strong> {mensagemVendaItem || "-"}</p>
                                    </div>

                                    <div className={css.pendenciaAcoes}>
                                        <button
                                            type="button"
                                            className={css.botaoConcluirPendencia}
                                            onClick={() => concluirVendaDaPendencia(idVeiculoItem)}
                                            disabled={!idVeiculoItem || !precisaConcluirItem}
                                        >
                                            Concluir venda
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
                        <span>Cliente</span>
                        {/* Select controlado pelo estado clienteId. */}
                        <select value={clienteId} onChange={atualizarClienteManual} disabled={carregandoClientes || clientes.length === 0}>
                            {/* Opcao inicial, mudando texto enquanto carrega. */}
                            <option value="">
                                {carregandoClientes ? "Carregando clientes..." : "Selecione um cliente"}
                            </option>
                            {/* Cria uma opcao para cada cliente carregado. */}
                            {clientes.map((item) => (
                                <option key={item.id_usuario || item.id} value={item.id_usuario || item.id}>
                                    {item.nome || item.email || `Cliente ${item.id_usuario || item.id}`}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Exibe erro de clientes quando houver. */}
                    {erroClientes && <p className={css.mensagemErro}>{erroClientes}</p>}

                    {/* Campo de selecao do veiculo vendido. */}
                    <label className={css.campo}>
                        <span>Veículo vendido</span>
                        {/* Select controlado pelo estado veiculoId. */}
                        <select value={veiculoId} onChange={trocarVeiculo} disabled={carregandoVeiculos || veiculos.length === 0}>
                            {/* Opcao inicial, mudando texto enquanto carrega. */}
                            <option value="">
                                {carregandoVeiculos ? "Carregando veículos..." : "Selecione um veículo"}
                            </option>
                            {/* Cria uma opcao para cada veiculo vendavel. */}
                            {veiculos.map((veiculo) => (
                                <option key={idVeiculo(veiculo)} value={idVeiculo(veiculo)}>
                                    {nomeVeiculo(veiculo)} - {textoStatusVenda(veiculo)}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Exibe erro de veiculos quando houver. */}
                    {erroVeiculos && <p className={css.mensagemErro}>{erroVeiculos}</p>}

                    {veiculoSelecionadoReservado && (
                        <p className={css.avisoReserva}>
                            {nomeReservaSelecionada
                                ? `Este veículo está reservado para ${nomeReservaSelecionada}${precisaConcluirSelecionado ? " e precisa concluir a venda." : "."}`
                                : `Este veículo está reservado${precisaConcluirSelecionado ? " e precisa concluir a venda." : "."}`}
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
                                    e.currentTarget.src = "/IconCar.png";
                                }}
                            />

                            {/* Bloco com informacoes resumidas do veiculo. */}
                            <div className={css.veiculoInfo}>
                                {/* Linha do modelo. */}
                                <p>
                                    <strong>Modelo:</strong>
                                    <span>{veiculoSelecionado.modelo || "-"}</span>
                                </p>
                                {/* Linha da marca. */}
                                <p>
                                    <strong>Marca:</strong>
                                    <span>{veiculoSelecionado.marca || "-"}</span>
                                </p>
                                {/* Linha da quilometragem formatada. */}
                                <p>
                                    <strong>Quilometragem:</strong>
                                    <span>{formatarQuilometragem(veiculoSelecionado.quilometragem)}</span>
                                </p>
                                {/* Linha da cor. */}
                                <p>
                                    <strong>Cor:</strong>
                                    <span>{veiculoSelecionado.cor || "-"}</span>
                                </p>
                                <p>
                                    <strong>Status:</strong>
                                    <span>{textoStatusVenda(veiculoSelecionado)}</span>
                                </p>
                                {/* Linha do preco de venda formatado. */}
                                <p>
                                    <strong>Preço de venda:</strong>
                                    <b>{formatarMoeda(veiculoSelecionado.preco)}</b>
                                </p>
                            </div>
                        </article>
                    )}

                    {/* Campo de texto livre para observacoes da venda. */}
                    <label className={`${css.campo} ${css.comentarios}`}>
                        <span>Comentários</span>
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
                        <span>Forma de Pagamento</span>
                        {/* Select controlado pelo estado formaPagamento. */}
                        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
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
                                <span>Valor da parcela</span>
                                {/* Valor calculado da parcela selecionada. */}
                                <strong>{formatarMoeda(valorParcelaParcelamento)}</strong>
                                {/* Texto com quantidade, juros mensal e total. */}
                                <small>
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
                                        <span>Pix copia e cola</span>
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
                                <span>Pix da venda</span>
                                <strong>{formatarMoeda(valorComDesconto)}</strong>
                            </div>

                            {/* Botao que salva a venda e pede o Pix para a API. */}
                            <button
                                type="button"
                                className={css.botaoGerarPix}
                                onClick={gerarPix}
                                disabled={gerandoPix || salvando || vendaFinalizada || !valorComDesconto}
                            >
                                {vendaFinalizada ? "Venda salva" : gerandoPix ? "Gerando Pix..." : "Salvar e gerar Pix"}
                            </button>

                            {/* Exibe erro especifico de Pix quando houver. */}
                            {erroPix && <p className={css.mensagemErro}>{erroPix}</p>}

                            {/* Mostra QR Code e copia e cola depois que o Pix for gerado. */}
                            {pixGerado && (
                                <div className={css.pixResultado}>
                                    {/* QR Code Pix retornado pela API. */}
                                    <img src={pixGerado.qrCode} alt="QR Code Pix" />

                                    {/* Campo somente leitura com o codigo Pix copia e cola. */}
                                    <label className={css.campo}>
                                        <span>Pix copia e cola</span>
                                        <textarea value={pixGerado.copiaECola} readOnly />
                                    </label>

                                    {/* Botao para copiar o codigo Pix para a area de transferencia. */}
                                    <button type="button" className={css.botaoCopiarPix} onClick={copiarPix}>
                                        Copiar código
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Campo de data e hora da venda. */}
                    <label className={`${css.campo} ${css.campoDataHora}`}>
                        <span>Data e hora</span>
                        {/* Input controlado pelo estado dataVenda. */}
                        <input type="datetime-local" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
                    </label>

                    {/* Linha com upload de comprovante e placa do veiculo. */}
                    <div className={css.linhaDupla}>
                        {/* Campo visual para anexar comprovante ou nota fiscal. */}
                        <div className={css.campo}>
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
                                + {comprovante?.name || "Anexar arquivo"}
                            </label>
                        </div>

                        {/* Campo somente leitura com a placa do veiculo escolhido. */}
                        <label className={css.campo}>
                            <span>Placa</span>
                            <input type="text" value={veiculoSelecionado?.placa || ""} readOnly />
                        </label>
                    </div>

                    {/* Campo monetario do valor bruto da venda. */}
                    <label className={css.campo}>
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
                        <span>Desconto (%)</span>
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
                        <span>Valor com desconto</span>
                        <strong>{formatarMoeda(valorComDesconto)}</strong>
                    </div>

                    {/* Campo monetario do valor recebido. */}
                    <label className={css.campo}>
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
                            <span>Status de Pagamento</span>
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
                        {vendaFinalizada ? "Venda salva" : salvando ? "Salvando..." : "Salvar"}
                    </button>
                    {/* Botao secundario que volta para a tela de vendas/cancela. */}
                    <button type="button" className={css.cancelar} onClick={() => navigate("/dashboardAdmVendas")}>
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
                            <h2 id="tituloParcelamento">Parcelamento</h2>
                            {/* Fecha o modal sem alterar a parcela. */}
                            <button type="button" onClick={() => setModalParcelasAberto(false)} aria-label="Fechar">
                                x
                            </button>
                        </div>

                        {/* Cabecalho da lista de opcoes de parcelas. */}
                        <div className={css.modalCabecalho}>
                            <strong>Parcelas</strong>
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
                                        <b>
                                            {String(opcao.quantidade).padStart(2, "0")}x de {formatarMoeda(opcao.valorParcela)}
                                        </b>
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

export default Vendas;
