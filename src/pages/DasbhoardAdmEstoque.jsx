// Importa recursos de react.
import { useEffect, useMemo, useState } from "react";
// Importa recursos de ../components/Paginacao/Paginacao.
import Paginacao, { ITENS_POR_PAGINA } from "../components/Paginacao/Paginacao";
// Importa recursos de ./DasbhoardAdmEstoque.module.css.
import css from "./DasbhoardAdmEstoque.module.css";

// Declara filtrosPeriodo para uso neste fluxo.
const filtrosPeriodo = ["Últimos 30 dias", "Últimos 15 dias", "Últimos 7 dias"];
// Declara filtrosTipo para uso neste fluxo.
const filtrosTipo = ["Tipo", "Entrada", "Saída"];

// Declara a função cabecalhoAutorizacao usada por esta página.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Declara a função lerJson usada por esta página.
async function lerJson(resposta) {
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

// Declara a função extrairListaUsuarios usada por esta página.
function extrairListaUsuarios(dados) {
    // Declara lista para uso neste fluxo.
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    // Declara clientes para uso neste fluxo.
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) === 0);

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return clientes.length > 0 ? clientes : lista.filter((usuario) => Number(usuario.tipo_usuario ?? usuario.TIPO_USUARIO) !== 2);
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

// Declara a função idVeiculo usada por esta página.
function idVeiculo(carro) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO || carro?.id || carro?.ID;
}

// Declara a função estaEmEstoque usada por esta página.
function estaEmEstoque(carro) {
    // Declara status para uso neste fluxo.
    const status = String(carro?.status_estoque ?? carro?.STATUS_ESTOQUE ?? carro?.status ?? "").toLowerCase();
    // Declara statusVenda para uso neste fluxo.
    const statusVenda = String(carro?.status_venda ?? carro?.STATUS_VENDA ?? "").trim().toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (statusVenda) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return statusVenda === "disponivel" || statusVenda.includes("dispon");
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "2" || status.includes("vend")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return false;
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "3" || status.includes("reserv") || status.includes("indispon")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return false;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return true;
}

// Declara a função nomeVeiculo usada por esta página.
function nomeVeiculo(carro) {
    // Declara marca para uso neste fluxo.
    const marca = carro?.marca || carro?.MARCA || carro?.nome_marca || carro?.NOME_MARCA || "";
    // Declara modelo para uso neste fluxo.
    const modelo = carro?.modelo || carro?.MODELO || carro?.nome || carro?.NOME || "";
    // Declara nomeCompleto para uso neste fluxo.
    const nomeCompleto = [marca, modelo].filter(Boolean).join(" ").trim();

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return nomeCompleto || carro?.veiculo || carro?.VEICULO || `Veículo ${idVeiculo(carro) || "-"}`;
}

// Declara a função nomeVeiculoVenda usada por esta página.
function nomeVeiculoVenda(venda) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        venda?.veiculo ||
        venda?.VEICULO ||
        venda?.nome_veiculo ||
        venda?.NOME_VEICULO ||
        venda?.modelo ||
        venda?.MODELO ||
        `Veículo ${venda?.id_veiculo || venda?.ID_VEICULO || "-"}`
    );
}

// Declara a função dataMovimentacaoCarro usada por esta página.
function dataMovimentacaoCarro(carro) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        carro?.data_cadastro ||
        carro?.DATA_CADASTRO ||
        carro?.criado_em ||
        carro?.CRIADO_EM ||
        carro?.created_at ||
        carro?.CREATED_AT ||
        carro?.data_entrada ||
        carro?.DATA_ENTRADA ||
        carro?.data ||
        carro?.DATA
    );
}

// Declara a função dataMovimentacaoVenda usada por esta página.
function dataMovimentacaoVenda(venda) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return venda?.data_venda || venda?.DATA_VENDA || venda?.data || venda?.DATA || venda?.created_at || venda?.CREATED_AT;
}

// Declara a função dataParaOrdenacao usada por esta página.
function dataParaOrdenacao(valor) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!valor) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return 0;
    }

    // Declara texto para uso neste fluxo.
    const texto = String(valor).trim();
    // Declara dataBr para uso neste fluxo.
    const dataBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataBr) {
        // Declara os dados usados neste fluxo.
        const [, dia, mes, ano, hora = "00", minuto = "00"] = dataBr;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)).getTime();
    }

    // Declara dataIso para uso neste fluxo.
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);

    // Verifica esta condição antes de continuar o fluxo.
    if (dataIso) {
        // Declara os dados usados neste fluxo.
        const [, ano, mes, dia, hora = "00", minuto = "00"] = dataIso;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return new Date(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)).getTime();
    }

    // Declara data para uso neste fluxo.
    const data = new Date(valor);
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
}

// Declara a função formatarData usada por esta página.
function formatarData(valor) {
    // Declara tempo para uso neste fluxo.
    const tempo = dataParaOrdenacao(valor);

    // Verifica esta condição antes de continuar o fluxo.
    if (!tempo) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "-";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return new Date(tempo).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

// Declara a função diasDoPeriodo usada por esta página.
function diasDoPeriodo(periodo) {
    // Declara numero para uso neste fluxo.
    const numero = Number(String(periodo).match(/\d+/)?.[0] || 30);
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return Number.isFinite(numero) ? numero : 30;
}

// Declara a função estaDentroDoPeriodo usada por esta página.
function estaDentroDoPeriodo(movimentacao, periodo) {
    // Verifica esta condição antes de continuar o fluxo.
    if (!movimentacao.tempo) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return false;
    }

    // Declara limite para uso neste fluxo.
    const limite = new Date();
    // Atualiza o estado por meio de setHours.
    limite.setHours(0, 0, 0, 0);
    // Atualiza o estado por meio de setDate.
    limite.setDate(limite.getDate() - diasDoPeriodo(periodo));

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return movimentacao.tempo >= limite.getTime();
}

// Declara a função montarEntrada usada por esta página.
function montarEntrada(carro) {
    // Declara dataOriginal para uso neste fluxo.
    const dataOriginal = dataMovimentacaoCarro(carro);

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {
        id: `entrada-${idVeiculo(carro) || nomeVeiculo(carro)}`,
        data: formatarData(dataOriginal),
        tempo: dataParaOrdenacao(dataOriginal),
        veiculo: nomeVeiculo(carro),
        tipo: "Entrada",
        origem: "Cadastro de veículo"
    };
}

// Declara a função montarSaida usada por esta página.
function montarSaida(venda) {
    // Declara dataOriginal para uso neste fluxo.
    const dataOriginal = dataMovimentacaoVenda(venda);
    // Declara idVenda para uso neste fluxo.
    const idVenda = venda.id_venda || venda.ID_VENDA || venda.id || venda.ID;

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {
        id: `saida-${idVenda || venda.id_veiculo || venda.ID_VEICULO || nomeVeiculoVenda(venda)}`,
        data: formatarData(dataOriginal),
        tempo: dataParaOrdenacao(dataOriginal),
        veiculo: nomeVeiculoVenda(venda),
        tipo: "Saída",
        origem: "Venda",
        cliente: venda.nome_cliente
    };
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default function DashboardAdmEstoque({ API }) {
    // Declara os dados usados neste fluxo.
    const [busca, setBusca] = useState("");
    // Declara os dados usados neste fluxo.
    const [periodo, setPeriodo] = useState(filtrosPeriodo[0]);
    // Declara os dados usados neste fluxo.
    const [tipo, setTipo] = useState(filtrosTipo[0]);
    // Declara os dados usados neste fluxo.
    const [totalEstoque, setTotalEstoque] = useState(0);
    // Declara os dados usados neste fluxo.
    const [movimentacoes, setMovimentacoes] = useState([]);
    // Declara os dados usados neste fluxo.
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Declara os dados usados neste fluxo.
    const [carregando, setCarregando] = useState(false);
    // Declara os dados usados neste fluxo.
    const [erro, setErro] = useState("");
    // Declara os dados usados neste fluxo.
    const [movimentacaoDetalhe, setMovimentacaoDetalhe] = useState(null);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Declara a função carregarEstoque usada por esta página.
        async function carregarEstoque() {
            // Verifica esta condição antes de continuar o fluxo.
            if (!API) {
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setCarregando.
            setCarregando(true);
            // Atualiza o estado por meio de setErro.
            setErro("");

            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Declara headers para uso neste fluxo.
                const headers = cabecalhoAutorizacao();
                // Declara respostaCarros para uso neste fluxo.
                const respostaCarros = await fetch(`${API}/listar_carro`, {
                    method: "GET",
                    headers,
                    credentials: "include"
                });
                // Declara dadosCarros para uso neste fluxo.
                const dadosCarros = await lerJson(respostaCarros);

                // Verifica esta condição antes de continuar o fluxo.
                if (!respostaCarros.ok) {
                    // Atualiza o estado por meio de setErro.
                    setErro(dadosCarros.erro || dadosCarros.mensagem || "Não foi possível carregar o estoque.");
                    // Atualiza o estado por meio de setMovimentacoes.
                    setMovimentacoes([]);
                    // Retorna o resultado desta função ou o conteúdo visual da página.
                    return;
                }

                // Declara carros para uso neste fluxo.
                const carros = extrairListaCarros(dadosCarros);
                // Declara entradas para uso neste fluxo.
                const entradas = carros.map(montarEntrada);
                // Declara saidas para uso neste fluxo.
                let saidas = [];

                // Tenta executar a operação e permite tratar possíveis falhas.
                try {
                    // Declara respostaUsuarios para uso neste fluxo.
                    const respostaUsuarios = await fetch(`${API}/listar_usuario`, {
                        method: "GET",
                        headers,
                        credentials: "include"
                    });
                    // Declara dadosUsuarios para uso neste fluxo.
                    const dadosUsuarios = await lerJson(respostaUsuarios);

                    // Verifica esta condição antes de continuar o fluxo.
                    if (respostaUsuarios.ok) {
                        // Declara usuarios para uso neste fluxo.
                        const usuarios = extrairListaUsuarios(dadosUsuarios);
                        // Declara vendasPorUsuario para uso neste fluxo.
                        const vendasPorUsuario = await Promise.all(usuarios.map(async (usuario) => {
                            // Declara id para uso neste fluxo.
                            const id = idUsuario(usuario);

                            // Verifica esta condição antes de continuar o fluxo.
                            if (!id) {
                                // Retorna o resultado desta função ou o conteúdo visual da página.
                                return [];
                            }

                            // Declara respostaVendas para uso neste fluxo.
                            const respostaVendas = await fetch(`${API}/listar_vendas_usuario?id_usuario=${encodeURIComponent(id)}`, {
                                method: "GET",
                                headers,
                                credentials: "include"
                            });
                            // Declara dadosVendas para uso neste fluxo.
                            const dadosVendas = await lerJson(respostaVendas);

                            // Verifica esta condição antes de continuar o fluxo.
                            if (!respostaVendas.ok) {
                                // Retorna o resultado desta função ou o conteúdo visual da página.
                                return [];
                            }

                            // Declara vendas para uso neste fluxo.
                            const vendas = Array.isArray(dadosVendas) ? dadosVendas : dadosVendas.vendas || dadosVendas.compras || [];

                            // Retorna o resultado desta função ou o conteúdo visual da página.
                            return vendas.map((venda) => ({
                                ...venda,
                                nome_cliente: nomeUsuario(usuario)
                            }));
                        }));

                        // Executa esta etapa do fluxo.
                        saidas = vendasPorUsuario.flat().map(montarSaida);
                    }
                } catch {
                    // Atualiza o estado por meio de setErro.
                    setErro("Estoque carregado, mas não foi possível carregar as saídas de vendas.");
                }

                // Atualiza o estado por meio de setTotalEstoque.
                setTotalEstoque(carros.filter(estaEmEstoque).length);
                // Atualiza o estado por meio de setMovimentacoes.
                setMovimentacoes([...entradas, ...saidas].sort((a, b) => b.tempo - a.tempo));
            } catch {
                // Atualiza o estado por meio de setErro.
                setErro("Erro de conexão com o servidor.");
                // Atualiza o estado por meio de setMovimentacoes.
                setMovimentacoes([]);
            } finally {
                // Atualiza o estado por meio de setCarregando.
                setCarregando(false);
            }
        }

        // Executa carregarEstoque nesta etapa do fluxo.
        carregarEstoque();
    }, [API]);

    // Declara movimentacoesFiltradas para uso neste fluxo.
    const movimentacoesFiltradas = useMemo(() => {
        // Declara termo para uso neste fluxo.
        const termo = busca.trim().toLowerCase();

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return movimentacoes.filter((movimentacao) => {
            // Declara passaBusca para uso neste fluxo.
            const passaBusca =
                !termo ||
                [movimentacao.data, movimentacao.veiculo, movimentacao.tipo, movimentacao.origem, movimentacao.cliente]
                    .some((campo) => String(campo || "").toLowerCase().includes(termo));
            // Declara passaTipo para uso neste fluxo.
            const passaTipo = tipo === "Tipo" || movimentacao.tipo === tipo;
            // Declara passaPeriodo para uso neste fluxo.
            const passaPeriodo = estaDentroDoPeriodo(movimentacao, periodo);

            // Retorna o resultado desta função ou o conteúdo visual da página.
            return passaBusca && passaTipo && passaPeriodo;
        });
    }, [busca, movimentacoes, periodo, tipo]);

    // Declara totalPaginas para uso neste fluxo.
    const totalPaginas = Math.max(1, Math.ceil(movimentacoesFiltradas.length / ITENS_POR_PAGINA));

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Atualiza o estado por meio de setPaginaAtual.
        setPaginaAtual(1);
    }, [busca, periodo, tipo]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (paginaAtual > totalPaginas) {
            // Atualiza o estado por meio de setPaginaAtual.
            setPaginaAtual(totalPaginas);
        }
    }, [paginaAtual, totalPaginas]);

    // Declara movimentacoesPaginadas para uso neste fluxo.
    const movimentacoesPaginadas = useMemo(() => {
        // Declara inicio para uso neste fluxo.
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return movimentacoesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
    }, [movimentacoesFiltradas, paginaAtual]);

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.pagina}>
            {/* Exibe o cabeçalho desta área. */}
            <header className={css.cabecalho}>
                {/* Exibe o título principal desta página. */}
                <h1>Estoque</h1>
            </header>

            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.cardResumo} aria-label="Resumo do estoque">
                {/* Exibe esta imagem na interface. */}
                <img src="/Estoque.png" alt="veículo vermelho" />
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.resumoTexto}>
                    {/* Renderiza o elemento strong nesta parte da página. */}
                    <strong>{carregando ? "..." : totalEstoque}</strong>
                    {/* Renderiza o elemento span nesta parte da página. */}
                    <span>Veículos em Estoque</span>
                </div>
            </section>

            {/* Relaciona um texto explicativo ao campo correspondente. */}
            <label className={css.busca}>
                {/* Exibe esta imagem na interface. */}
                <img src="/IconBusca.png" alt="" />
                {/* Exibe este campo de entrada de dados. */}
                <input
                    type="text"
                    placeholder="Buscar veículos"
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
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        aria-label="Tipo de movimentação"
                    >
                        {/* Percorre os dados para renderizar os itens desta área. */}
                        {filtrosTipo.map((filtro) => (
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
                                <th>Veículo</th>
                                {/* Renderiza o elemento th nesta parte da página. */}
                                <th>Movimentação</th>
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
                                    <td colSpan="4" className={css.vazio}>
                                        Carregando movimentações...
                                    </td>
                                </tr>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!carregando && movimentacoesPaginadas.map((movimentacao) => (
                                <tr key={movimentacao.id}>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Data">{movimentacao.data}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Veículo">{movimentacao.veiculo}</td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Movimentação">
                                        {/* Renderiza o elemento span nesta parte da página. */}
                                        <span className={movimentacao.tipo === "Entrada" ? css.entrada : css.saida}>
                                            {movimentacao.tipo}
                                        </span>
                                    </td>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td data-label="Ações">
                                        {/* Exibe este botão de ação. */}
                                        <button
                                            type="button"
                                            className={css.botaoDetalhe}
                                            onClick={() => setMovimentacaoDetalhe(movimentacao)}
                                        >
                                            Ver Detalhe
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {!carregando && movimentacoesFiltradas.length === 0 && (
                                <tr>
                                    {/* Renderiza o elemento td nesta parte da página. */}
                                    <td colSpan="4" className={css.vazio}>
                                        Nenhuma movimentação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.cardsMobile}>
                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {carregando && <div className={css.cardEstado}>Carregando movimentações...</div>}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && movimentacoesPaginadas.map((movimentacao) => (
                        <article key={`mobile-${movimentacao.id}`} className={css.cardMovimentacao}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.cardMovimentacaoTopo}>
                                {/* Agrupa os elementos desta parte da interface. */}
                                <div>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span>Data</span>
                                    {/* Renderiza o elemento strong nesta parte da página. */}
                                    <strong>{movimentacao.data}</strong>
                                </div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={movimentacao.tipo === "Entrada" ? css.entrada : css.saida}>
                                    {movimentacao.tipo}
                                </span>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Veículo</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{movimentacao.veiculo}</strong>
                            </div>
                            {/* Exibe este botão de ação. */}
                            <button type="button" onClick={() => setMovimentacaoDetalhe(movimentacao)}>
                                Ver Detalhe
                            </button>
                        </article>
                    ))}

                    {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                    {!carregando && movimentacoesFiltradas.length === 0 && (
                        <div className={css.cardEstado}>Nenhuma movimentação encontrada.</div>
                    )}
                </div>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {!carregando && movimentacoesFiltradas.length > 0 && (
                    <div className={css.paginacaoArea}>
                        {/* Renderiza o componente Paginacao nesta parte da página. */}
                        <Paginacao
                            paginaAtual={paginaAtual}
                            totalItens={movimentacoesFiltradas.length}
                            onMudarPagina={setPaginaAtual}
                        />
                    </div>
                )}
            </section>

            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
            {movimentacaoDetalhe && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloDetalheEstoque">
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.modalDetalhe}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalTopo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Movimentação</span>
                                {/* Exibe o título desta seção. */}
                                <h2 id="tituloDetalheEstoque">{movimentacaoDetalhe.veiculo}</h2>
                            </div>
                            {/* Exibe este botão de ação. */}
                            <button type="button" onClick={() => setMovimentacaoDetalhe(null)} aria-label="Fechar detalhe">
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
                                <strong>{movimentacaoDetalhe.data}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Veículo</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{movimentacaoDetalhe.veiculo}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Movimentação</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong className={movimentacaoDetalhe.tipo === "Entrada" ? css.entrada : css.saida}>
                                    {movimentacaoDetalhe.tipo}
                                </strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Origem</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{movimentacaoDetalhe.origem || "-"}</strong>
                            </div>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Cliente</span>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{movimentacaoDetalhe.cliente || "-"}</strong>
                            </div>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modalAcoes}>
                            {/* Exibe este botão de ação. */}
                            <button type="button" className={css.botaoDetalhe} onClick={() => setMovimentacaoDetalhe(null)}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
