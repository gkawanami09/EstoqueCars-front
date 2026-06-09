// Importa hooks do React usados para estado, efeito e funcoes estaveis.
import { useCallback, useEffect, useState } from "react";
// Importa hooks de rota: um pega o ID da URL e o outro navega entre paginas.
import { useNavigate, useParams } from "react-router-dom";
// Importa os estilos desta pagina.
import css from "./DetalhesVeiculos.module.css";

// Le respostas da API mesmo quando a rota retorna corpo vazio.
async function lerRespostaJson(resposta) {
    // Le o corpo da resposta como texto antes de tentar converter.
    const texto = await resposta.text();

    // Quando a API responde sem corpo, evita erro de JSON vazio.
    if (!texto) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return {};
    }

    // Tenta executar a operação e permite tratar possíveis falhas.
    try {
        // Converte a resposta da API para objeto JavaScript.
        return JSON.parse(texto);
    } catch {
        // Se a resposta nao for JSON valido, devolve objeto vazio.
        return {};
    }
}

// Declara a função cabecalhoAutorizacao usada por esta página.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Declara receitasPixDetalheStorage para uso neste fluxo.
const receitasPixDetalheStorage = "estoquecars_receitas_pix_detalhe";
// Declara comprasPagasLocalStorage para uso neste fluxo.
const comprasPagasLocalStorage = "estoquecars_compras_pagas_confirmadas";

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

// Declara a função dataAtualFinanceiro usada por esta página.
function dataAtualFinanceiro() {
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

// Declara a função extrairListaCarros usada por esta página.
function extrairListaCarros(dados) {
    // Verifica esta condição antes de continuar o fluxo.
    if (Array.isArray(dados)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return dados;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return dados?.carros || dados?.veiculos || dados?.veiculo || [];
}

// Tela que mostra todos os detalhes de um veiculo especifico.
function DetalhesVeiculos({ API }) {
    // Pega o parametro ":id" da rota /detalhesVeiculos/:id.
    const { id } = useParams();

    // Permite voltar ou abrir outra pagina pelo codigo.
    const navigate = useNavigate();

    // Busca os dados do usuario logado no localStorage.
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado");

    // Transforma os dados salvos em texto para objeto JavaScript.
    const usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : {};

    // Visitantes podem ver os detalhes, mas precisam entrar para reservar.
    const usuarioEstaLogado = Boolean(usuarioSalvo);

    // Verifica se o usuario usa o painel administrativo: vendedor (1) ou administrador (2).
    const isPainelAdm = [1, 2].includes(Number(usuarioLogado.tipo_usuario || usuarioLogado["tipo_usuário"]));

    // Vendedor/admin volta para a tela de veiculos do admin; usuario comum logado volta para a dashboard.
    // Quando nao houver login, volta para a home publica.
    const rotaVoltar = isPainelAdm ? "/dashboardAdmVeiculos" : (usuarioEstaLogado ? "/dashboard" : "/");

    // Guarda o carro encontrado na API.
    const [carro, setCarro] = useState(null);

    // Guarda as manutencoes vinculadas ao veiculo.
    const [manutencoes, setManutencoes] = useState([]);

    // Controla o carregamento das informacoes principais.
    const [carregando, setCarregando] = useState(true);

    // Controla o carregamento da lista de manutencoes.
    const [carregandoManutencoes, setCarregandoManutencoes] = useState(true);

    // Guarda erro ao buscar o veiculo.
    const [erro, setErro] = useState("");

    // Declara os dados usados neste fluxo.
    const [reservando, setReservando] = useState(false);

    // Declara os dados usados neste fluxo.
    const [cancelandoReserva, setCancelandoReserva] = useState(false);

    // Declara os dados usados neste fluxo.
    const [mensagemReserva, setMensagemReserva] = useState(null);

    // Declara os dados usados neste fluxo.
    const [comprandoPix, setComprandoPix] = useState(false);

    // Declara os dados usados neste fluxo.
    const [pagandoPixCompra, setPagandoPixCompra] = useState(false);

    // Declara os dados usados neste fluxo.
    const [pagamentoPixConfirmado, setPagamentoPixConfirmado] = useState(false);

    // Declara os dados usados neste fluxo.
    const [statusAntesCompraPix, setStatusAntesCompraPix] = useState(null);

    // Declara os dados usados neste fluxo.
    const [pixCompra, setPixCompra] = useState(null);

    // Declara os dados usados neste fluxo.
    const [mensagemCompra, setMensagemCompra] = useState(null);

    // Guarda erro ao buscar as manutencoes.
    const [erroManutencoes, setErroManutencoes] = useState("");

    // Busca as manutencoes vinculadas ao veiculo exibido no detalhe.
    const carregarManutencoes = useCallback(async (idVeiculo) => {
        // Liga o carregamento da parte de manutencoes.
        setCarregandoManutencoes(true);

        // Limpa erro antigo antes de fazer uma nova busca.
        setErroManutencoes("");

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Chama a rota que busca manutencao pelo ID do veiculo.
            const resposta = await fetch(`${API}/buscar_manutencao`, {
                // O backend espera POST nesta busca.
                method: "POST",
                // Avisa para a API que o corpo enviado e JSON.
                headers: { "Content-Type": "application/json" },
                // Envia cookies junto, caso a API use login por cookie.
                credentials: "include",
                // Envia o ID do veiculo no corpo da requisicao.
                body: JSON.stringify({ id_veiculo: Number(idVeiculo) })
            });

            // Le a resposta com seguranca, mesmo se vier vazia.
            const dados = await lerRespostaJson(resposta);

            // Se a resposta nao foi sucesso, trata o erro.
            if (!resposta.ok) {
                // Status 404 aqui significa que o carro nao tem manutencoes cadastradas.
                if (resposta.status === 404) {
                    // Atualiza o estado por meio de setManutencoes.
                    setManutencoes([]);
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Para outros erros, mostra a mensagem na tela.
                setErroManutencoes(dados.erro || "Não foi possível carregar as manutenções.");
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Salva a lista de manutencoes; se nao vier lista, salva vazio.
            setManutencoes(Array.isArray(dados) ? dados : []);
        } catch {
            // Erro de rede ou servidor fora do ar.
            setErroManutencoes("Erro de conexão ao carregar manutenções.");
            // Atualiza o estado por meio de setManutencoes.
            setManutencoes([]);
        } finally {
            // Desliga o carregamento no sucesso ou no erro.
            setCarregandoManutencoes(false);
        }
    }, [API]);

    // Busca o veiculo pelo id da rota e depois carrega suas manutencoes.
    const carregarCarro = useCallback(async () => {
        // Liga o carregamento principal.
        setCarregando(true);

        // Limpa erro antigo.
        setErro("");

        // Limpa manutencoes antigas antes de carregar outro carro.
        setManutencoes([]);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Busca a lista de carros na API.
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                credentials: "include"
            });

            // Converte a resposta para JSON.
            const dados = await resposta.json();

            // Se a API retornou erro, mostra a mensagem e interrompe.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErro.
                setErro(dados.erro || "Não foi possível carregar o veículo.");
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Procura o carro da lista que tem o mesmo ID recebido pela URL.
            const veiculoEncontrado = extrairListaCarros(dados).find((item) => {
                // Aceita varios nomes de ID porque cada API pode devolver diferente.
                const idVeiculo = item.id || item.id_carro || item.id_veiculo || item.ID_VEICULO || item.ID_CARRO;
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return String(idVeiculo) === String(id);
            });

            // Se nao encontrou, mostra tela de erro.
            if (!veiculoEncontrado) {
                // Atualiza o estado por meio de setErro.
                setErro("Veículo não encontrado.");
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Salva o carro encontrado no estado.
            setCarro(veiculoEncontrado);

            // Depois de achar o carro, busca as manutencoes dele.
            await carregarManutencoes(id);
        } catch {
            // Erro quando nao consegue conectar com o backend.
            setErro("Erro de conexão com o servidor.");
        } finally {
            // Desliga o carregamento principal.
            setCarregando(false);
        }
    }, [API, carregarManutencoes, id]);

    // Executa a busca quando a pagina abre ou quando o ID mudar.
    useEffect(() => {
        // Executa carregarCarro nesta etapa do fluxo.
        carregarCarro();
    }, [carregarCarro]);

    // Formata valores monetarios no padrao brasileiro.
    function formatarPreco(valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Formata numeros comuns, como quilometragem.
    function formatarNumero(valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Number(valor || 0).toLocaleString("pt-BR");
    }

    // Declara a função tipoStatusEstoque usada por esta página.
    function tipoStatusEstoque(valor) {
        // Declara status para uso neste fluxo.
        const status = String(valor || "").toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "2" || status.includes("vend")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "vendido";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "3" || status.includes("indispon") || status.includes("reserv")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "indisponivel";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "estoque";
    }

    // Converte o status do estoque para um texto legivel.
    function formatarStatusEstoque(valor) {
        // Declara tipoStatus para uso neste fluxo.
        const tipoStatus = tipoStatusEstoque(valor);

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "indisponivel") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Reservado";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "vendido") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Vendido";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "estoque") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Em estoque";
        }

        // Declara status para uso neste fluxo.
        const status = String(valor || "").toLowerCase();

        // Texto com indisponivel/reservado vira "Reservado".
        if (status.includes("indispon") || status.includes("reserv")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Reservado";
        }

        // Texto com vendido vira "Vendido".
        if (status.includes("vend")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Vendido";
        }

        // Qualquer outro valor vira "Em estoque".
        return "Em estoque";
    }

    // Escolhe a cor do status usando a mesma regra da listagem administrativa.
    function classeStatusEstoque(valor) {
        // Declara tipoStatus para uso neste fluxo.
        const tipoStatus = tipoStatusEstoque(valor);

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "indisponivel") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_indisponivel;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "vendido") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_vendido;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "estoque") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_estoque;
        }

        // Declara statusFormatado para uso neste fluxo.
        const statusFormatado = formatarStatusEstoque(valor);

        // Verifica esta condição antes de continuar o fluxo.
        if (statusFormatado === "Reservado") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_indisponivel;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (statusFormatado === "Vendido") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return css.status_vendido;
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return css.status_estoque;
    }

    // Converte o estado de conservacao para texto.
    function formatarEstado(valor) {
        // Declara estado para uso neste fluxo.
        const estado = String(valor || "").toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (estado === "2" || estado.includes("regular")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Regular";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (estado === "3" || estado.includes("ruim")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Ruim";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Bom";
    }

    // Converte o status do documento para texto.
    function formatarDocumento(valor) {
        // Declara status para uso neste fluxo.
        const status = String(valor || "").toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "2" || status.includes("irregular")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Irregular";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "3" || status.includes("pendente")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Pendente";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Regular";
    }

    // Converte o cambio salvo no banco para texto.
    function formatarCambio(valor) {
        // Declara cambio para uso neste fluxo.
        const cambio = String(valor || "").toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (cambio === "1" || cambio.includes("auto")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Automático";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (cambio === "2" || cambio.includes("manual")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Manual";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return valor || "-";
    }

    // Aplica mascara visual na placa sem alterar o dado no banco.
    function formatarPlaca(valor) {
        // Remove caracteres especiais e deixa tudo maiusculo.
        const placa = String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        // Se nao houver placa, mostra traco.
        if (!placa) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "-";
        }

        // Placa antiga: ABC1234 vira ABC-1234.
        if (/^[A-Z]{3}[0-9]{4}$/.test(placa)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return `${placa.slice(0, 3)}-${placa.slice(3)}`;
        }

        // Placa Mercosul fica sem traco: ABC1D23.
        return placa.slice(0, 7);
    }

    // Mostra o RENAVAM apenas com numeros e no limite correto.
    function formatarRenavam(valor) {
        // Declara renavam para uso neste fluxo.
        const renavam = String(valor || "").replace(/\D/g, "").slice(0, 11);

        // Verifica esta condição antes de continuar o fluxo.
        if (!renavam) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "-";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return renavam;
    }

    // Monta a URL da imagem do backend ou retorna o icone padrao.
    function imagemVeiculo() {
        // Se nao houver imagem cadastrada, usa um icone padrao.
        if (!carro?.imagem) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "/IconCar.png";
        }

        // Se a imagem ja veio como URL completa, usa direto.
        if (String(carro.imagem).startsWith("http")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return carro.imagem;
        }

        // Se veio caminho relativo, junta com a URL base da API.
        return `${API}${carro.imagem}`;
    }

    // Evita mostrar vazio na ficha tecnica.
    function valor(campo) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return campo || "-";
    }

    // Pega o ID do carro aceitando nomes diferentes que podem vir da API.
    function idCarro() {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
    }

    // Declara a função idUsuarioLogado usada por esta página.
    function idUsuarioLogado() {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return String(usuarioLogado.id_usuario || usuarioLogado.id_user || usuarioLogado.id || usuarioLogado.ID_USUARIO || "");
    }

    // Declara a função idUsuarioReserva usada por esta página.
    function idUsuarioReserva() {
        // Declara reserva para uso neste fluxo.
        const reserva = carro?.reserva || carro?.RESERVA || {};
        // Declara usuarioReserva para uso neste fluxo.
        const usuarioReserva = reserva?.usuario || reserva?.USUARIO || {};
        // Declara clienteReserva para uso neste fluxo.
        const clienteReserva = reserva?.cliente || reserva?.CLIENTE || {};

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return String(
            carro?.id_usuario_reserva ||
            carro?.ID_USUARIO_RESERVA ||
            carro?.id_usuario_reservado ||
            carro?.ID_USUARIO_RESERVADO ||
            carro?.id_cliente_reserva ||
            carro?.ID_CLIENTE_RESERVA ||
            reserva?.id_usuario ||
            reserva?.ID_USUARIO ||
            reserva?.id_cliente ||
            reserva?.ID_CLIENTE ||
            usuarioReserva?.id_usuario ||
            usuarioReserva?.ID_USUARIO ||
            usuarioReserva?.id ||
            usuarioReserva?.ID ||
            clienteReserva?.id_usuario ||
            clienteReserva?.ID_USUARIO ||
            clienteReserva?.id ||
            clienteReserva?.ID ||
            ""
        );
    }

    // Declara a função dataHoraAtualParaApi usada por esta página.
    function dataHoraAtualParaApi() {
        // Declara agora para uso neste fluxo.
        const agora = new Date();
        // Declara dia para uso neste fluxo.
        const dia = String(agora.getDate()).padStart(2, "0");
        // Declara mes para uso neste fluxo.
        const mes = String(agora.getMonth() + 1).padStart(2, "0");
        // Declara ano para uso neste fluxo.
        const ano = agora.getFullYear();
        // Declara hora para uso neste fluxo.
        const hora = String(agora.getHours()).padStart(2, "0");
        // Declara minuto para uso neste fluxo.
        const minuto = String(agora.getMinutes()).padStart(2, "0");

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    }

    // Declara a função montarUrlArquivo usada por esta página.
    function montarUrlArquivo(valor) {
        // Verifica esta condição antes de continuar o fluxo.
        if (!valor) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "";
        }

        // Declara caminho para uso neste fluxo.
        const caminho = String(valor);

        // Verifica esta condição antes de continuar o fluxo.
        if (caminho.startsWith("http") || caminho.startsWith("data:")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return caminho;
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return caminho.startsWith("/") ? `${API}${caminho}` : `${API}/${caminho}`;
    }

    // Declara a função aplicarPixCompra usada por esta página.
    function aplicarPixCompra(dados) {
        // Declara qrcode para uso neste fluxo.
        const qrcode = dados?.pix_qrcode || dados?.qr_code || dados?.qr_code_base64;
        // Declara copiaCola para uso neste fluxo.
        const copiaCola = dados?.pix_copia_cola || dados?.pix_copia_e_cola || dados?.payload;
        // Declara idVenda para uso neste fluxo.
        const idVenda = dados?.id_venda || dados?.ID_VENDA || dados?.id || dados?.ID || dados?.venda?.id_venda || dados?.venda?.id;

        // Verifica esta condição antes de continuar o fluxo.
        if (!qrcode && !copiaCola) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return false;
        }

        // Atualiza o estado por meio de setPixCompra.
        setPixCompra({
            qrcode: montarUrlArquivo(qrcode),
            copiaCola,
            idVenda
        });
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return true;
    }

    // Declara veiculoReservado para uso neste fluxo.
    const veiculoReservado = tipoStatusEstoque(carro?.status_estoque) === "indisponivel";
    // Declara usuarioDonoReserva para uso neste fluxo.
    const usuarioDonoReserva = Boolean(idUsuarioLogado() && idUsuarioReserva() && idUsuarioLogado() === idUsuarioReserva());
    // Declara podeCancelarReserva para uso neste fluxo.
    const podeCancelarReserva = veiculoReservado && (isPainelAdm || usuarioDonoReserva);
    // Declara podeComprarPix para uso neste fluxo.
    const podeComprarPix = usuarioEstaLogado && !isPainelAdm && (tipoStatusEstoque(carro?.status_estoque) === "estoque" || usuarioDonoReserva);

    // Declara a função reservarVeiculo usada por esta página.
    async function reservarVeiculo() {
        // Declara idVeiculo para uso neste fluxo.
        const idVeiculo = idCarro();

        // Verifica esta condição antes de continuar o fluxo.
        if (!usuarioEstaLogado) {
            // Navega o usuário para a próxima página do fluxo.
            navigate("/login");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVeiculo || tipoStatusEstoque(carro?.status_estoque) !== "estoque") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setReservando.
        setReservando(true);
        // Atualiza o estado por meio de setMensagemReserva.
        setMensagemReserva(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara idUsuarioReserva para uso neste fluxo.
            const idUsuarioReserva = Number(usuarioLogado.id_usuario || usuarioLogado.id_user || usuarioLogado.id || usuarioLogado.ID_USUARIO);

            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/reservar_carro/${idVeiculo}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutorizacao()
                },
                credentials: "include",
                body: JSON.stringify({
                    id_usuario: Number.isFinite(idUsuarioReserva)
                        ? idUsuarioReserva
                        : (usuarioLogado.id_usuario || usuarioLogado.id_user || usuarioLogado.id || usuarioLogado.ID_USUARIO)
                })
            });
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagemReserva.
                setMensagemReserva({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Não foi possível reservar este veículo."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setCarro.
            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: 3,
                id_usuario_reserva: dados.id_usuario_reserva ?? veiculoAtual?.id_usuario_reserva,
                ID_USUARIO_RESERVA: dados.id_usuario_reserva ?? veiculoAtual?.ID_USUARIO_RESERVA,
                nome_usuario_reserva: dados.nome_usuario_reserva ?? veiculoAtual?.nome_usuario_reserva,
                NOME_USUARIO_RESERVA: dados.nome_usuario_reserva ?? veiculoAtual?.NOME_USUARIO_RESERVA,
                precisa_concluir_venda: dados.precisa_concluir_venda ?? true,
                PRECISA_CONCLUIR_VENDA: dados.precisa_concluir_venda ?? true,
                status_venda: dados.status_venda ?? "RESERVADO_PENDENTE_CONCLUSAO",
                STATUS_VENDA: dados.status_venda ?? "RESERVADO_PENDENTE_CONCLUSAO"
            }));
            // Atualiza o estado por meio de setMensagemReserva.
            setMensagemReserva({
                tipo: "sucesso",
                texto: dados.mensagem || "Veículo reservado com sucesso."
            });
        } catch {
            // Atualiza o estado por meio de setMensagemReserva.
            setMensagemReserva({
                tipo: "erro",
                texto: "Erro de conexão ao reservar o veículo."
            });
        } finally {
            // Atualiza o estado por meio de setReservando.
            setReservando(false);
        }
    }

    // Declara a função cancelarReservaVeiculo usada por esta página.
    async function cancelarReservaVeiculo() {
        // Declara idVeiculo para uso neste fluxo.
        const idVeiculo = idCarro();

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVeiculo || !podeCancelarReserva) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setCancelandoReserva.
        setCancelandoReserva(true);
        // Atualiza o estado por meio de setMensagemReserva.
        setMensagemReserva(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/cancelar_reserva_carro/${idVeiculo}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    ...cabecalhoAutorizacao()
                },
                credentials: "include",
                body: JSON.stringify({ id_usuario: isPainelAdm ? "" : idUsuarioLogado() })
            });
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagemReserva.
                setMensagemReserva({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Não foi possível cancelar esta reserva."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setCarro.
            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: dados.status_estoque ?? 1,
                id_usuario_reserva: null,
                ID_USUARIO_RESERVA: null,
                id_usuario_reservado: null,
                ID_USUARIO_RESERVADO: null,
                id_cliente_reserva: null,
                ID_CLIENTE_RESERVA: null,
                nome_usuario_reserva: null,
                NOME_USUARIO_RESERVA: null,
                nome_cliente_reserva: null,
                NOME_CLIENTE_RESERVA: null,
                reserva: null,
                RESERVA: null,
                precisa_concluir_venda: false,
                PRECISA_CONCLUIR_VENDA: false,
                status_venda: dados.status_venda ?? "DISPONIVEL",
                STATUS_VENDA: dados.status_venda ?? "DISPONIVEL"
            }));
            // Atualiza o estado por meio de setMensagemReserva.
            setMensagemReserva({
                tipo: "sucesso",
                texto: dados.mensagem || "Reserva cancelada com sucesso."
            });
        } catch {
            // Atualiza o estado por meio de setMensagemReserva.
            setMensagemReserva({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor para cancelar a reserva."
            });
        } finally {
            // Atualiza o estado por meio de setCancelandoReserva.
            setCancelandoReserva(false);
        }
    }

    // Declara a função comprarComPix usada por esta página.
    async function comprarComPix() {
        // Declara idVeiculo para uso neste fluxo.
        const idVeiculo = idCarro();
        // Declara idUsuario para uso neste fluxo.
        const idUsuario = idUsuarioLogado();
        // Declara valorVenda para uso neste fluxo.
        const valorVenda = Number(carro?.preco || 0);

        // Verifica esta condição antes de continuar o fluxo.
        if (!usuarioEstaLogado) {
            // Navega o usuário para a próxima página do fluxo.
            navigate("/login");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!idVeiculo || !idUsuario || !podeComprarPix || !valorVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setComprandoPix.
        setComprandoPix(true);
        // Atualiza o estado por meio de setMensagemCompra.
        setMensagemCompra(null);
        // Atualiza o estado por meio de setPixCompra.
        setPixCompra(null);
        // Atualiza o estado por meio de setPagamentoPixConfirmado.
        setPagamentoPixConfirmado(false);
        // Atualiza o estado por meio de setStatusAntesCompraPix.
        setStatusAntesCompraPix(carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? 1);

        // Declara formData para uso neste fluxo.
        const formData = new FormData();
        // Executa append nesta etapa do fluxo.
        formData.append("id_usuario", idUsuario);
        // Executa append nesta etapa do fluxo.
        formData.append("id_veiculo", idVeiculo);
        // Executa append nesta etapa do fluxo.
        formData.append("forma_pagamento", "0");
        // Executa append nesta etapa do fluxo.
        formData.append("data_venda", dataHoraAtualParaApi());
        // Executa append nesta etapa do fluxo.
        formData.append("valor_venda", String(valorVenda));
        // Executa append nesta etapa do fluxo.
        formData.append("valor_recebido", String(valorVenda));
        // Executa append nesta etapa do fluxo.
        formData.append("status_pagamento", "1");
        // Executa append nesta etapa do fluxo.
        formData.append("comentarios", "Compra online via Pix");
        // Executa append nesta etapa do fluxo.
        formData.append("desconto", "0");

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/cadastrar_venda`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(resposta);

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagemCompra.
                setMensagemCompra({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Não foi possível iniciar a compra por Pix."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Executa aplicarPixCompra nesta etapa do fluxo.
            aplicarPixCompra(dados);
            // Atualiza o estado por meio de setCarro.
            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: 2,
                STATUS_ESTOQUE: 2
            }));
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({
                tipo: "sucesso",
                texto: dados.mensagem || "Compra iniciada. Pague pelo Pix abaixo para concluir."
            });
        } catch {
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor para iniciar a compra."
            });
        } finally {
            // Atualiza o estado por meio de setComprandoPix.
            setComprandoPix(false);
        }
    }

    // Declara a função copiarPixCompra usada por esta página.
    async function copiarPixCompra() {
        // Verifica esta condição antes de continuar o fluxo.
        if (!pixCompra?.copiaCola) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Executa writeText nesta etapa do fluxo.
            await navigator.clipboard.writeText(pixCompra.copiaCola);
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({ tipo: "sucesso", texto: "Código Pix copiado." });
        } catch {
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({ tipo: "erro", texto: "Não foi possível copiar o código Pix automaticamente." });
        }
    }

    // Declara a função registrarReceitaCompraPix usada por esta página.
    async function registrarReceitaCompraPix() {
        // Declara idVenda para uso neste fluxo.
        const idVenda = pixCompra?.idVenda || `veiculo-${idCarro()}`;
        // Declara chaveReceita para uso neste fluxo.
        const chaveReceita = `detalhe-${idVenda}`;

        // Verifica esta condição antes de continuar o fluxo.
        if (itemExisteNoLocalStorage(receitasPixDetalheStorage, chaveReceita)) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara valorVenda para uso neste fluxo.
        const valorVenda = valorParaNumero(carro?.preco);

        // Verifica esta condição antes de continuar o fluxo.
        if (!valorVenda) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error("Pagamento confirmado, mas não foi possível montar a receita financeira.");
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
                id_veiculo: idCarro() || null,
                data: dataAtualFinanceiro(),
                descricao: `Receita automática - Venda #${idVenda} - ${carro?.marca || ""} ${carro?.modelo || ""}`.trim(),
                valor: valorVenda
            })
        });
        // Declara dados para uso neste fluxo.
        const dados = await lerRespostaJson(resposta);

        // Verifica esta condição antes de continuar o fluxo.
        if (!resposta.ok && resposta.status !== 409) {
            // Interrompe o fluxo informando o erro encontrado.
            throw new Error(dados.erro || dados.mensagem || "Pagamento confirmado, mas a receita não foi registrada no financeiro.");
        }

        // Executa salvarItemLocalStorage nesta etapa do fluxo.
        salvarItemLocalStorage(receitasPixDetalheStorage, chaveReceita);
    }

    // Declara a função pagarPixCompra usada por esta página.
    async function pagarPixCompra() {
        // Verifica esta condição antes de continuar o fluxo.
        if (!pixCompra || pagamentoPixConfirmado) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setPagandoPixCompra.
        setPagandoPixCompra(true);
        // Atualiza o estado por meio de setMensagemCompra.
        setMensagemCompra(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Executa confirmarStatusPagamentoVenda nesta etapa do fluxo.
            await confirmarStatusPagamentoVenda(API, pixCompra.idVenda);
            // Executa registrarReceitaCompraPix nesta etapa do fluxo.
            await registrarReceitaCompraPix();
            // Executa salvarItemLocalStorage nesta etapa do fluxo.
            salvarItemLocalStorage(comprasPagasLocalStorage, pixCompra.idVenda || `veiculo-${idCarro()}`);
            // Atualiza o estado por meio de setPagamentoPixConfirmado.
            setPagamentoPixConfirmado(true);
            // Atualiza o estado por meio de setCarro.
            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: 2,
                STATUS_ESTOQUE: 2
            }));
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({ tipo: "sucesso", texto: "Pagamento confirmado e receita registrada." });
        } catch (erroAtual) {
            // Atualiza o estado por meio de setMensagemCompra.
            setMensagemCompra({
                tipo: "erro",
                texto: erroAtual.message || "Não foi possível confirmar o pagamento."
            });
        } finally {
            // Atualiza o estado por meio de setPagandoPixCompra.
            setPagandoPixCompra(false);
        }
    }

    // Declara a função cancelarPagamentoPixCompra usada por esta página.
    function cancelarPagamentoPixCompra() {
        // Atualiza o estado por meio de setPixCompra.
        setPixCompra(null);
        // Atualiza o estado por meio de setPagamentoPixConfirmado.
        setPagamentoPixConfirmado(false);
        // Atualiza o estado por meio de setMensagemCompra.
        setMensagemCompra({ tipo: "sucesso", texto: "Pagamento Pix cancelado. Você pode iniciar a compra novamente." });

        // Verifica esta condição antes de continuar o fluxo.
        if (statusAntesCompraPix !== null) {
            // Atualiza o estado por meio de setCarro.
            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: statusAntesCompraPix,
                STATUS_ESTOQUE: statusAntesCompraPix
            }));
        }
    }

    // Enquanto a API ainda busca o carro, mostra uma mensagem de carregamento.
    if (carregando) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return (
            <main className={css.container}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.estado}>Carregando detalhes do veículo...</div>
            </main>
        );
    }

    // Se deu erro ou nao encontrou carro, mostra uma tela simples de erro.
    if (erro || !carro) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return (
            <main className={css.container}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.estado_erro}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>Ops, não encontramos esse veículo.</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>{erro || "Tente voltar para a lista e abrir novamente."}</span>
                    {/* Exibe este botão de ação. */}
                    <button type="button" onClick={() => navigate(rotaVoltar)}>
                        Voltar para veículos
                    </button>
                </div>
            </main>
        );
    }

    // Declara statusEstoqueAtual para uso neste fluxo.
    const statusEstoqueAtual = tipoStatusEstoque(carro.status_estoque);

    // Renderiza a tela quando o carro foi encontrado.
    return (
        <main className={css.container}>
            {/* Cabecalho da pagina com botao voltar, titulo e botao editar para admin. */}
            <header className={css.cabecalho}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div>
                    {/* Volta para a rota correta dependendo do tipo de usuario. */}
                    <button
                        type="button"
                        className={css.voltar}
                        onClick={() => navigate(rotaVoltar)}
                    >
                        Voltar
                    </button>
                    {/* Mostra o modelo do carro; se nao tiver, usa um texto padrao. */}
                    <h1>{carro.modelo || carro.nome || "Detalhes do veículo"}</h1>
                    {/* Mostra marca e anos do veiculo no cabecalho. */}
                    <p>{valor(carro.marca)} - {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                </div>

                {/* Usuario comum nao ve este botao; apenas vendedor/admin consegue editar. */}
                {isPainelAdm && (
                    <button
                        type="button"
                        className={css.editar}
                        onClick={() => navigate(`/editarVeiculos/${idCarro()}`)}
                    >
                        Editar veículo
                    </button>
                )}
            </header>

            {/* Area principal com imagem grande e resumo do carro. */}
            <section className={css.hero}>
                {/* Area da imagem do veiculo. */}
                <div className={css.imagem_area}>
                    {/* Exibe esta imagem na interface. */}
                    <img
                        src={imagemVeiculo()}
                        alt={carro.modelo || "Veículo"}
                        onError={(e) => {
                            // Se a imagem falhar, troca pelo icone padrao.
                            e.currentTarget.src = "/IconCar.png";
                        }}
                    />
                </div>

                {/* Card lateral com status, preco e descricao. */}
                <aside className={css.resumo}>
                    {/* Status do estoque do veiculo. */}
                    <span className={`${css.status} ${classeStatusEstoque(carro.status_estoque)}`}>
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {formatarStatusEstoque(carro.status_estoque)}
                    </span>
                    {/* Preco de venda formatado em real. */}
                    <div className={css.preco_bloco}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Preço de venda</span>
                        {/* Renderiza o elemento strong nesta parte da página. */}
                        <strong>{formatarPreco(carro.preco)}</strong>
                    </div>
                    {/* Descricao cadastrada no veiculo. */}
                    <div className={css.descricao_bloco}>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>Descrição</span>
                        {/* Exibe esta mensagem ou informação. */}
                        <p>{valor(carro.descricao)}</p>
                    </div>

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {(!isPainelAdm || podeCancelarReserva) && (
                        <div className={css.reserva_area}>
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {mensagemReserva && (
                                <p className={`${css.mensagem_reserva} ${mensagemReserva.tipo === "erro" ? css.mensagem_reserva_erro : ""}`}>
                                    {mensagemReserva.texto}
                                </p>
                            )}
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                className={css.reservar}
                                onClick={reservarVeiculo}
                                disabled={usuarioEstaLogado && (reservando || statusEstoqueAtual !== "estoque")}
                            >
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {!usuarioEstaLogado ? "Entrar para reservar" : reservando ? "Reservando..." : statusEstoqueAtual === "estoque" ? "Reservar veículo" : statusEstoqueAtual === "vendido" ? "Veículo vendido" : "Veículo reservado"}
                            </button>

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {podeCancelarReserva && (
                                <button
                                    type="button"
                                    className={css.cancelar_reserva}
                                    onClick={cancelarReservaVeiculo}
                                    disabled={cancelandoReserva}
                                >
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {cancelandoReserva ? "Cancelando..." : "Cancelar reserva"}
                                </button>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {podeComprarPix && (
                                <button
                                    type="button"
                                    className={css.comprar_pix}
                                    onClick={comprarComPix}
                                    disabled={comprandoPix}
                                >
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {comprandoPix ? "Gerando Pix..." : "Comprar com Pix"}
                                </button>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {mensagemCompra && (
                                <p className={`${css.mensagem_reserva} ${mensagemCompra.tipo === "erro" ? css.mensagem_reserva_erro : ""}`}>
                                    {mensagemCompra.texto}
                                </p>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {pixCompra && (
                                <div className={css.pix_compra}>
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {pixCompra.qrcode ? (
                                        <img src={pixCompra.qrcode} alt="QR Code Pix da compra" />
                                    ) : (
                                        <span>QR Code indisponível</span>
                                    )}
                                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                                    <label>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>Pix cópia e cola</span>
                                        {/* Renderiza o elemento textarea nesta parte da página. */}
                                        <textarea value={pixCompra.copiaCola || ""} readOnly />
                                    </label>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.pix_compra_acoes}>
                                        {/* Exibe este botão de ação. */}
                                        <button type="button" onClick={copiarPixCompra} disabled={pagandoPixCompra}>
                                            Copiar Pix
                                        </button>
                                        {/* Exibe este botão de ação. */}
                                        <button
                                            type="button"
                                            className={css.pagar_pix}
                                            onClick={pagarPixCompra}
                                            disabled={pagandoPixCompra || pagamentoPixConfirmado}
                                        >
                                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                            {pagandoPixCompra ? "Confirmando..." : pagamentoPixConfirmado ? "Pago" : "Pagar"}
                                        </button>
                                        {/* Exibe este botão de ação. */}
                                        <button
                                            type="button"
                                            className={css.cancelar_pagamento_pix}
                                            onClick={cancelarPagamentoPixCompra}
                                            disabled={pagandoPixCompra || pagamentoPixConfirmado}
                                        >
                                            Cancelar pagamento
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </aside>
            </section>

            {/* Ficha tecnica com todos os dados cadastrados do carro. */}
            <section className={css.ficha}>
                {/* Titulo da ficha tecnica. */}
                <div className={css.ficha_cabecalho}>
                    {/* Exibe o título desta seção. */}
                    <h2>Ficha técnica</h2>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Dados cadastrados do veículo</span>
                </div>

                {/* Grid de informacoes, usando o componente Info para repetir o mesmo layout. */}
                <div className={css.grid}>
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Marca" valor={valor(carro.marca)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Modelo" valor={valor(carro.modelo)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Categoria" valor={valor(carro.categoria || carro.nome_categoria)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Câmbio" valor={formatarCambio(carro.cambio)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Ano fabricação" valor={valor(carro.ano_fabricacao)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Ano modelo" valor={valor(carro.ano_modelo)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Quilometragem" valor={`${formatarNumero(carro.quilometragem)} km`} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Cor" valor={valor(carro.cor)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Placa" valor={formatarPlaca(carro.placa)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Renavam" valor={formatarRenavam(carro.renavam)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Conservação" valor={formatarEstado(carro.estado_conservacao)} />
                    {/* Renderiza o componente Info nesta parte da página. */}
                    <Info titulo="Documento" valor={formatarDocumento(carro.status_documento)} />
                </div>
            </section>

            {/* Secao com as manutencoes vinculadas ao veiculo. */}
            <section className={css.manutencoes}>
                {/* Titulo da area de manutencoes. */}
                <div className={css.ficha_cabecalho}>
                    {/* Exibe o título desta seção. */}
                    <h2>Manutenções do veículo</h2>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Serviços agendados ou realizados neste carro</span>
                </div>

                {/* Mensagem enquanto a busca de manutencoes esta acontecendo. */}
                {carregandoManutencoes && (
                    <div className={css.estado_manutencao}>Carregando manutenções...</div>
                )}

                {/* Mensagem quando a API retorna erro ao buscar manutencoes. */}
                {!carregandoManutencoes && erroManutencoes && (
                    <div className={css.estado_manutencao}>{erroManutencoes}</div>
                )}

                {/* Mensagem quando o veiculo nao possui manutencoes cadastradas. */}
                {!carregandoManutencoes && !erroManutencoes && manutencoes.length === 0 && (
                    <div className={css.estado_manutencao}>Nenhuma manutenção cadastrada para este veículo.</div>
                )}

                {/* Lista as manutencoes quando a API retornar resultados. */}
                {!carregandoManutencoes && !erroManutencoes && manutencoes.length > 0 && (
                    <div className={css.lista_manutencoes}>
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {manutencoes.map((manutencao) => (
                            <article key={manutencao.id_manutencao} className={css.card_manutencao}>
                                {/* Topo do card com numero, data e valor total da manutencao. */}
                                <div className={css.manutencao_topo}>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div>
                                        {/* Renderiza o elemento strong nesta parte da página. */}
                                        <strong>Manutenção #{manutencao.id_manutencao}</strong>
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span>{manutencao.data || "-"}</span>
                                    </div>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong className={css.valor_manutencao}>
                                        {/* Percorre os dados para renderizar os itens desta área. */}
                                        {formatarPreco(manutencao.valor_total)}
                                    </strong>
                                </div>

                                {/* Servicos realizados dentro daquela manutencao. */}
                                <div className={css.servicos_manutencao}>
                                    {/* Percorre os dados para renderizar os itens desta área. */}
                                    {(manutencao.servicos_realizados || []).map((servico, index) => (
                                        <div key={`${servico.servico}-${index}`} className={css.servico_item}>
                                            {/* Renderiza o elemento span nesta parte da página. */}
                                            <span>{servico.servico || servico.nome_servico || "Serviço"}</span>
                                            {/* Renderiza o elemento small nesta parte da página. */}
                                            <small>
                                                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                                Qtd. {servico.quantidade || 1} - {formatarPreco(servico.valor_unitario)}
                                            </small>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

// Componente reutilizavel para exibir um campo da ficha tecnica.
function Info({ titulo, valor }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        // Cada item mostra o nome do campo e o valor dele.
        <div className={css.info}>
            {/* Renderiza o elemento span nesta parte da página. */}
            <span>{titulo}</span>
            {/* Renderiza o elemento strong nesta parte da página. */}
            <strong>{valor}</strong>
        </div>
    );
}

// Exporta a pagina para ser usada nas rotas do App.jsx.
export default DetalhesVeiculos;
