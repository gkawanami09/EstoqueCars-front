// Importa o CSS module desta tela.
import css from "./DashboardAdmVeiculos.module.css";
// Importa os hooks usados para estado, efeito, memoizacao e funcao estavel.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para trocar de pagina pelo codigo.
import { useNavigate } from "react-router-dom";
// Importa o modal bonito usado para confirmar exclusao.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao.jsx";
// Importa recursos de ../components/Paginacao/Paginacao.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";

// Componente da pagina de gerenciamento de veiculos do administrador.
function DashboardAdmVeiculos({ API }) {
    // Guarda todos os carros que vieram da API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
    // Guarda a pagina atual da listagem.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Guarda a categoria selecionada no filtro.
    const [categoria, setCategoria] = useState("");
    // Controla quando a tabela esta carregando dados.
    const [carregando, setCarregando] = useState(true);
    // Guarda mensagens de erro vindas da API ou da conexao.
    const [erro, setErro] = useState("");
    // Guarda qual carro o usuario quer excluir.
    const [carroParaExcluir, setCarroParaExcluir] = useState(null);
    // Guarda o id do carro que esta sendo excluido no momento.
    const [excluindoId, setExcluindoId] = useState(null);
    // Cria a funcao de navegacao entre rotas.
    const navigate = useNavigate();

    // Declara a função cabecalhoAutorizacao usada por esta página.
    function cabecalhoAutorizacao() {
        // Declara token para uso neste fluxo.
        const token = localStorage.getItem("access_token");
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    // Declara a função mensagemErroExclusao usada por esta página.
    function mensagemErroExclusao(mensagem) {
        // Declara texto para uso neste fluxo.
        const texto = String(mensagem || "");
        // Declara textoNormalizado para uso neste fluxo.
        const textoNormalizado = texto.toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (
            textoNormalizado.includes("fk_vendas_veiculo") ||
            textoNormalizado.includes("foreign key") ||
            textoNormalizado.includes("venda")
        ) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Este veículo já possui venda cadastrada e não pode ser excluído. Para manter o histórico financeiro, altere o status do veículo em vez de excluir.";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return texto || "Erro ao excluir veículo.";
    }

    // Funcao que busca os carros na API.
    const carregarCarros = useCallback(async () => {
        // Liga o carregamento antes da requisicao.
        setCarregando(true);
        // Limpa erro antigo antes de tentar carregar de novo.
        setErro("");

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Cria os parametros da URL da busca.
            const params = new URLSearchParams();

            // Se tiver categoria selecionada, envia para o backend.
            if (categoria) {
                // Executa append nesta etapa do fluxo.
                params.append("categoria", categoria);
            }

            // Faz a chamada GET para listar os carros.
            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                // Metodo usado pela rota de listagem.
                method: "GET",
                //esse metodo vai pegar o token da funcao adiconada 
                headers: cabecalhoAutorizacao(),
                // Envia cookies junto, caso a API use login por cookie.
                credentials: "include"
            });

            // Converte a resposta da API para objeto JavaScript.
            const dados = await resposta.json();

            // Se a API respondeu erro, mostra a mensagem e para aqui.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErro.
                setErro(dados.erro || "Erro ao carregar veículos.");
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Salva na tela a lista que veio da API.
            setCarros(Array.isArray(dados) ? dados : (dados.carros || dados.veiculos || []));
        } catch {
            // Mostra erro quando o servidor nao respondeu.
            setErro("Erro de conexão com o servidor.");
        } finally {
            // Desliga o carregamento tanto em sucesso quanto em erro.
            setCarregando(false);
        }
    }, [API, categoria]);

    // Chama a API quando a tela abre e quando a categoria muda.
    useEffect(() => {
        // Executa carregarCarros nesta etapa do fluxo.
        carregarCarros();
    }, [carregarCarros]);

    // Funcao que exclui um carro usando a API.
    async function excluirCarro(id) {
        // Guarda o id para mostrar carregamento no modal.
        setExcluindoId(id);
        // Limpa mensagens antigas antes de excluir.
        setErro("");

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Faz a chamada DELETE para excluir o veiculo.
            const resposta = await fetch(`${API}/excluir_carro/${id}`, {
                // Metodo esperado pela rota de exclusao.
                method: "DELETE",
                // Envia o token do admin para a API autorizar a exclusao.
                headers: cabecalhoAutorizacao(),
                // Envia cookies junto para manter permissao de administrador.
                credentials: "include"
            });

            // Converte a resposta da API para objeto.
            const dados = await resposta.json();

            // Se a API bloquear, por exemplo por manutencao vinculada, mostra erro.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setErro.
                setErro(mensagemErroExclusao(dados.erro));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Remove o carro excluido da lista sem precisar recarregar a pagina.
            setCarros((listaAtual) => listaAtual.filter((carro) => carro.id !== id));
            // Fecha o modal de confirmacao.
            setCarroParaExcluir(null);
        } catch {
            // Mostra erro quando nao conseguiu falar com o servidor.
            setErro("Erro de conexão com o servidor.");
        } finally {
            // Limpa o id de exclusao depois que a requisicao terminou.
            setExcluindoId(null);
        }
    }

    // Cria uma lista filtrada sem alterar a lista original vinda da API.
    const carrosFiltrados = useMemo(() => {
        // Normaliza o texto da busca para comparar sem diferenca de maiuscula/minuscula.
        const termo = busca.trim().toLowerCase();

        // Se nao digitou nada, mostra todos os carros.
        if (!termo) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return carros;
        }

        // Filtra carros procurando o termo em varios campos.
        return carros.filter((carro) => {
            // Campos que podem ser usados na busca.
            const campos = [
                carro.nome,
                carro.modelo,
                carro.marca,
                carro.placa,
                carro.renavam,
                carro.ano_fabricacao,
                carro.ano_modelo
            ];

            // Retorna true se algum campo contem o texto pesquisado.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, carros]);

    // Total de paginas considerando a busca atual.
    const totalPaginas = Math.max(1, Math.ceil(carrosFiltrados.length / ITENS_POR_PAGINA));

    // Mantem a pagina atual dentro do limite quando a lista muda.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) {
            // Atualiza o estado por meio de setPaginaAtual.
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Mostra somente os carros da pagina atual.
    const carrosPaginados = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return carrosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [carrosFiltrados, paginaAtual]);

    // Lista de categorias usadas nos botoes de filtro.
    const categorias = ["Sedan", "Elétrico", "Esportivo", "Caminhonete", "SUV"];

    // Formata o preco para moeda brasileira.
    function formatarPreco(valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
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

    // Declara a função idUsuarioReserva usada por esta página.
    function idUsuarioReserva(carro) {
        // Declara reserva para uso neste fluxo.
        const reserva = carro?.reserva || carro?.RESERVA || {};
        // Declara usuarioReserva para uso neste fluxo.
        const usuarioReserva = reserva?.usuario || reserva?.USUARIO || carro?.usuario_reserva || carro?.USUARIO_RESERVA || {};
        // Declara clienteReserva para uso neste fluxo.
        const clienteReserva = reserva?.cliente || reserva?.CLIENTE || carro?.cliente_reserva || carro?.CLIENTE_RESERVA || {};

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return (
            textoValido(carro?.id_usuario_reserva) ||
            textoValido(carro?.ID_USUARIO_RESERVA) ||
            textoValido(carro?.id_usuario_reservado) ||
            textoValido(carro?.ID_USUARIO_RESERVADO) ||
            textoValido(carro?.id_cliente_reserva) ||
            textoValido(carro?.ID_CLIENTE_RESERVA) ||
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

    // Declara a função nomeUsuarioReserva usada por esta página.
    function nomeUsuarioReserva(carro) {
        // Declara reserva para uso neste fluxo.
        const reserva = carro?.reserva || carro?.RESERVA || {};
        // Declara usuarioReserva para uso neste fluxo.
        const usuarioReserva = reserva?.usuario || reserva?.USUARIO || carro?.usuario_reserva || carro?.USUARIO_RESERVA || {};
        // Declara clienteReserva para uso neste fluxo.
        const clienteReserva = reserva?.cliente || reserva?.CLIENTE || carro?.cliente_reserva || carro?.CLIENTE_RESERVA || {};

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return (
            textoValido(carro?.nome_usuario_reserva) ||
            textoValido(carro?.NOME_USUARIO_RESERVA) ||
            textoValido(carro?.nome_cliente_reserva) ||
            textoValido(carro?.NOME_CLIENTE_RESERVA) ||
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

    // Declara a função statusVendaCarro usada por esta página.
    function statusVendaCarro(carro) {
        // Declara statusVenda para uso neste fluxo.
        const statusVenda = textoValido(carro?.status_venda) || textoValido(carro?.STATUS_VENDA) || textoValido(carro?.statusVenda);

        // Verifica esta condição antes de continuar o fluxo.
        if (statusVenda) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return statusVenda.toUpperCase();
        }

        // Declara statusEstoque para uso neste fluxo.
        const statusEstoque = String(carro?.status_estoque ?? "").toLowerCase();

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

    // Declara a função precisaConcluirVendaCarro usada por esta página.
    function precisaConcluirVendaCarro(carro) {
        // Declara indicadorApi para uso neste fluxo.
        const indicadorApi = carro?.precisa_concluir_venda ?? carro?.PRECISA_CONCLUIR_VENDA;

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
        return statusVendaCarro(carro) === "RESERVADO_PENDENTE_CONCLUSAO";
    }

    // Declara a função mensagemVendaCarro usada por esta página.
    function mensagemVendaCarro(carro) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return textoValido(carro?.mensagem_venda) || textoValido(carro?.MENSAGEM_VENDA);
    }

    // Declara a função tipoStatusEstoque usada por esta página.
    function tipoStatusEstoque(valor, carro) {
        // Declara statusVenda para uso neste fluxo.
        const statusVenda = statusVendaCarro(carro);

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

        // Declara status para uso neste fluxo.
        const status = String(valor || "").toLowerCase();

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "2" || status.includes("vend")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "vendido";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (status === "3" || status.includes("reserv") || status.includes("indispon")) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "reservado";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "estoque";
    }

    // Escolhe a classe CSS correta para cada status.
    function classeStatusEstoque(valor, carro) {
        // Declara tipoStatus para uso neste fluxo.
        const tipoStatus = tipoStatusEstoque(valor, carro);

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "reservado") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return `${css.status} ${css.status_indisponivel}`;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "vendido") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return `${css.status} ${css.status_vendido}`;
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${css.status} ${css.status_estoque}`;
    }

    // Define o texto que aparece dentro da etiqueta de status.
    function textoStatusEstoque(valor, carro) {
        // Declara tipoStatus para uso neste fluxo.
        const tipoStatus = tipoStatusEstoque(valor, carro);

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "reservado") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Reservado";
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (tipoStatus === "vendido") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Vendido";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Disponível";
    }

    // Declara a função textoComplementoStatus usada por esta página.
    function textoComplementoStatus(carro) {
        // Verifica esta condição antes de continuar o fluxo.
        if (precisaConcluirVendaCarro(carro) || statusVendaCarro(carro) === "RESERVADO_PENDENTE_CONCLUSAO") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return "Precisa concluir venda";
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return mensagemVendaCarro(carro);
    }

    // Declara a função textoClienteReserva usada por esta página.
    function textoClienteReserva(carro) {
        // Declara nomeReserva para uso neste fluxo.
        const nomeReserva = nomeUsuarioReserva(carro);

        // Verifica esta condição antes de continuar o fluxo.
        if (nomeReserva) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return nomeReserva;
        }

        // Declara idReserva para uso neste fluxo.
        const idReserva = idUsuarioReserva(carro);
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return idReserva ? `Cliente ${idReserva}` : "-";
    }

    // Renderiza toda a tela.
    return (
        // Container geral da pagina.
        <div className={css.layout_dashboard}>
            {/* Conteudo principal da pagina. */}
            <main className={css.conteudo_principal}>
                {/* Cabecalho com titulo e botoes de atalhos. */}
                <header className={css.cabecalho}>
                    {/* Titulo principal da tela. */}
                    
                    <h1 className={css.titulo_boas_vindas}>
                        Veículos
                    </h1>
                    

                    {/* Area dos botoes superiores. */}
                    <div className={css.botoes_cabecalho}>
                        {/* Vai para a tela de cadastro de veiculos. */}
                        <button
                            className={css.btn_add}
                            onClick={() => navigate("/cadastroVeiculos")}
                        >
                            Cadastrar Veículo
                        </button>

                        {/* Vai para a tela de cadastro de servicos. */}
                        <button
                            className={css.btn_add}
                            onClick={() => navigate("/CadastroServicos")}
                        >
                            Cadastrar Serviços
                        </button>

                        {/* Vai para a tela de marcas. */}
                        <button
                            className={css.btn_add}
                            onClick={() => navigate("/dashboardAdmMarcas")}
                        >
                            Gerenciar Marcas
                        </button>

                        {/* Vai para a tela de manutencoes. */}
                        <button
                            className={css.btn_add}
                            onClick={() => navigate("/manutencoes")}
                        >
                            Cadastrar Manutenções
                        </button>
                    </div>
                </header>

                {/* Mensagem de erro exibida somente quando existir erro. */}
                {erro && <p className={css.mensagem_erro}>{erro}</p>}

                {/* Area do campo de busca. */}
                <div className={css.area_busca}>
                    {/* Icone dentro da busca. */}
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />

                    {/* Campo que altera o estado "busca". */}
                    <input
                        type="text"
                        placeholder="Buscar veículos"
                        className={css.input_busca}
                        value={busca}
                        onChange={(e) => {
                            // Atualiza o estado por meio de setBusca.
                            setBusca(e.target.value);
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                    />
                </div>

                {/* Botoes de filtro por categoria. */}
                <section className={css.secao_filtros}>
                    {/* Botao que limpa o filtro e mostra todos. */}
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => {
                            // Atualiza o estado por meio de setCategoria.
                            setCategoria("");
                            // Atualiza o estado por meio de setPaginaAtual.
                            setPaginaAtual(1);
                        }}
                    >
                        Todos
                    </button>

                    {/* Cria um botao para cada categoria. */}
                    {categorias.map((nomeCategoria) => (
                        <button
                            key={nomeCategoria}
                            type="button"
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            onClick={() => {
                                // Atualiza o estado por meio de setCategoria.
                                setCategoria(nomeCategoria);
                                // Atualiza o estado por meio de setPaginaAtual.
                                setPaginaAtual(1);
                            }}
                        >
                            {nomeCategoria}
                        </button>
                    ))}
                {/* Renderiza o elemento br nesta parte da página. */}
                </section> <br />

                {/* Area que envolve a tabela. */}
                <section className={css.tabela_container}>
                    {/* Tabela com a listagem dos veiculos. */}
                    <table className={css.tabela}>
                        {/* Cabecalho da tabela. */}
                        <thead>
                        {/* Renderiza o elemento tr nesta parte da página. */}
                        <tr>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Foto</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Modelo</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Marca</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Ano</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Km</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Cor</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Preço</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Status</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Cliente reservado</th>
                            {/* Renderiza o elemento th nesta parte da página. */}
                            <th>Ações</th>
                        </tr>
                        </thead>

                        {/* Corpo da tabela. */}
                        <tbody>
                        {/* Linha mostrada enquanto a API esta carregando. */}
                        {carregando && (
                            <tr>
                                {/* Renderiza o elemento td nesta parte da página. */}
                                <td colSpan="10" className={css.celula_vazia}>
                                    Carregando veículos...
                                </td>
                            </tr>
                        )}

                        {/* Linha mostrada quando nao existe nenhum carro para listar. */}
                        {!carregando && carrosFiltrados.length === 0 && (
                            <tr>
                                {/* Renderiza o elemento td nesta parte da página. */}
                                <td colSpan="10" className={css.celula_vazia}>
                                    Nenhum veículo cadastrado
                                </td>
                            </tr>
                        )}

                        {/* Cria uma linha para cada carro filtrado. */}
                        {!carregando && carrosPaginados.map((carro) => (
                            <tr key={carro.id}>
                                {/* Foto do carro. */}
                                <td data-label="Foto">
                                    {/* Exibe esta imagem na interface. */}
                                    <img
                                        src={`${API}${carro.imagem}`}
                                        alt={carro.modelo}
                                        className={css.img_carro}
                                    />
                                </td>

                                {/* Modelo do carro. */}
                                <td data-label="Modelo">{carro.modelo}</td>

                                {/* Marca do carro. */}
                                <td data-label="Marca">{carro.marca}</td>

                                {/* Ano de fabricacao e ano do modelo. */}
                                <td data-label="Ano">{carro.ano_fabricacao}/{carro.ano_modelo}</td>

                                {/* Quilometragem formatada no padrao brasileiro. */}
                                <td data-label="Km">{Number(carro.quilometragem || 0).toLocaleString("pt-BR")}</td>

                                {/* Cor cadastrada para o carro. */}
                                <td data-label="Cor">{carro.cor}</td>

                                {/* Preco formatado como dinheiro. */}
                                <td data-label="Preço" className={css.preco}>{formatarPreco(carro.preco)}</td>

                                {/* Etiqueta de status do estoque. */}
                                <td data-label="Status" className={css.celula_status}>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span className={classeStatusEstoque(carro.status_estoque, carro)}>
                                        {/* Percorre os dados para renderizar os itens desta área. */}
                                        {textoStatusEstoque(carro.status_estoque, carro)}
                                    </span>
                                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                                    {textoComplementoStatus(carro) && (
                                        <small className={css.status_complemento}>{textoComplementoStatus(carro)}</small>
                                    )}
                                </td>

                                {/* Renderiza o elemento td nesta parte da página. */}
                                <td data-label="Cliente reservado">
                                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                    {tipoStatusEstoque(carro.status_estoque, carro) === "reservado" ? textoClienteReserva(carro) : "-"}
                                </td>

                                {/* Botoes de acao daquele carro. */}
                                <td data-label="Ações">
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.acoes}>
                                        {/* Abre a tela de edicao do carro. */}
                                        <button
                                            type="button"
                                            className={css.btn_editar}
                                            onClick={() => navigate(`/editarVeiculos/${carro.id}`)}
                                        >
                                            Editar
                                        </button>

                                        {/* Abre o modal de confirmacao antes de excluir. */}
                                        <button
                                            type="button"
                                            className={css.btn_excluir}
                                            onClick={() => setCarroParaExcluir(carro)}
                                        >
                                            Excluir
                                        </button>

                                        {/* Abre a tela de detalhes do carro. */}
                                        <button
                                            type="button"
                                            className={css.btn_detalhes}
                                            onClick={() => navigate(`/detalhesVeiculos/${carro.id}`)}
                                        >
                                            Detalhes
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregando && carrosFiltrados.length > 0 && (
                    <div className={css.paginacao_area}>
                        {/* Renderiza o componente Paginacao nesta parte da página. */}
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={carrosFiltrados.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </main>

            {/* Modal usado para confirmar exclusao do veiculo. */}
            <ModalConfirmacao
                aberto={Boolean(carroParaExcluir)}
                titulo="Excluir veículo"
                texto="Deseja excluir este veículo?"
                destaque={carroParaExcluir?.modelo || ""}
                textoConfirmar="Excluir veículo"
                carregando={excluindoId === carroParaExcluir?.id}
                onCancelar={() => setCarroParaExcluir(null)}
                onConfirmar={() => excluirCarro(carroParaExcluir.id)}
            />
        </div>
    );
}

// Exporta a tela para ser usada nas rotas do projeto.
export default DashboardAdmVeiculos;
