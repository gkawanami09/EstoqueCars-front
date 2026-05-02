import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./DashboardAdm.module.css";

const categorias = ["Sedan", "Eletrico", "Esportivo", "Caminhonete", "SUV"];

function extrairLista(dados, chaves) {
    if (Array.isArray(dados)) {
        return dados;
    }

    for (const chave of chaves) {
        if (Array.isArray(dados?.[chave])) {
            return dados[chave];
        }
    }

    return [];
}

async function lerRespostaJson(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {};
    }
}

function normalizarStatus(valor) {
    const status = String(valor || "").toLowerCase();

    if (status === "2" || status.includes("indispon")) {
        return "indisponivel";
    }

    if (status === "3" || status.includes("vend")) {
        return "vendido";
    }

    return "estoque";
}

function normalizarCarro(carro) {
    const id = carro.id ?? carro.id_carro ?? carro.id_veiculo;

    return {
        id,
        modelo: carro.modelo ?? carro.nome ?? "Veiculo",
        marca: carro.marca ?? "",
        placa: carro.placa ?? "",
        cor: carro.cor ?? "",
        categoria: carro.categoria ?? carro.tipo ?? "",
        ano: carro.ano_modelo ?? carro.ano_fabricacao ?? carro.ano ?? "",
        preco: Number(carro.preco ?? carro.valor ?? 0),
        status: normalizarStatus(carro.status_estoque ?? carro.status),
        imagem: carro.imagem ?? carro.foto ?? carro.foto_veiculo ?? ""
    };
}

function normalizarCliente(cliente) {
    return {
        id: cliente.id_usuario ?? cliente.id,
        nome: cliente.nome ?? cliente.NOME ?? "Cliente",
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        bloqueado: Boolean(cliente.bloqueado) || String(cliente.status || "").toLowerCase().includes("bloque")
    };
}

function normalizarServico(servico) {
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id;
    const nome = servico.descricao ?? servico.nome_servico ?? servico.NOME_SERVICO ?? servico.nome ?? "Servico";

    return {
        id,
        nome,
        valor: Number(servico.valor_unitario ?? servico.valor ?? servico.VALOR ?? 0)
    };
}

function normalizarManutencao(manutencao) {
    return {
        id: manutencao.id_manutencao ?? manutencao.ID_MANUTENCAO ?? manutencao.id,
        marca: manutencao.marca ?? manutencao.MARCA ?? "",
        modelo: manutencao.modelo ?? manutencao.MODELO ?? "",
        placa: manutencao.placa ?? manutencao.PLACA ?? "",
        data: manutencao.data ?? manutencao.data_manutencao ?? manutencao.DATA_MANUTENCAO ?? "",
        valor_total: Number(manutencao.valor_total ?? manutencao.VALOR_TOTAL ?? 0)
    };
}

function dataBrParaDate(valor) {
    const partes = String(valor || "").match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    if (!partes) {
        return null;
    }

    return new Date(
        Number(partes[3]),
        Number(partes[2]) - 1,
        Number(partes[1]),
        Number(partes[4]),
        Number(partes[5])
    );
}

function estaProxima(data) {
    const dataAgendada = dataBrParaDate(data);

    if (!dataAgendada) {
        return false;
    }

    const agora = new Date();
    const seteDias = 7 * 24 * 60 * 60 * 1000;

    return dataAgendada >= agora && dataAgendada.getTime() - agora.getTime() <= seteDias;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function DashboardAdm({ API }) {
    const navigate = useNavigate();
    const [carros, setCarros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);
    const [busca, setBusca] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarDashboard() {
            setCarregando(true);
            setErro("");

            try {
                const [resCarros, resClientes, resServicos, resManutencoes] = await Promise.all([
                    fetch(`${API}/listar_carro`, { method: "GET", credentials: "include" }),
                    fetch(`${API}/listar_usuario`, { method: "GET", credentials: "include" }),
                    fetch(`${API}/buscar_servico`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({})
                    }),
                    fetch(`${API}/listar_manutencao`, { method: "GET", credentials: "include" })
                ]);

                const [dadosCarros, dadosClientes, dadosServicos, dadosManutencoes] = await Promise.all([
                    lerRespostaJson(resCarros),
                    lerRespostaJson(resClientes),
                    lerRespostaJson(resServicos),
                    lerRespostaJson(resManutencoes)
                ]);

                if (resCarros.ok) {
                    setCarros(extrairLista(dadosCarros, ["carros", "veiculos", "veiculo"]).map(normalizarCarro));
                }

                if (resClientes.ok) {
                    setClientes(
                        extrairLista(dadosClientes, ["usuarios", "clientes"])
                            .filter((cliente) => Number(cliente.tipo_usuario) !== 2)
                            .map(normalizarCliente)
                    );
                }

                if (resServicos.ok) {
                    setServicos(extrairLista(dadosServicos, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico));
                }

                if (resManutencoes.ok) {
                    setManutencoes(extrairLista(dadosManutencoes, ["manutencoes", "manutencao"]).map(normalizarManutencao));
                }
            } catch {
                setErro("Nao foi possivel carregar os dados do dashboard.");
            } finally {
                setCarregando(false);
            }
        }

        carregarDashboard();
    }, [API]);

    const resumo = useMemo(() => {
        const emEstoque = carros.filter((carro) => carro.status === "estoque");
        const vendidos = carros.filter((carro) => carro.status === "vendido");
        const proximas = manutencoes.filter((manutencao) => estaProxima(manutencao.data));
        const clientesBloqueados = clientes.filter((cliente) => cliente.bloqueado);
        const valorEstoque = emEstoque.reduce((total, carro) => total + carro.preco, 0);
        return {
            emEstoque,
            vendidos,
            proximas,
            clientesBloqueados,
            valorEstoque
        };
    }, [carros, clientes, manutencoes]);

    const carrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return carros.slice(0, 5);
        }

        return carros.filter((carro) => {
            const campos = [carro.modelo, carro.marca, carro.placa, carro.cor, carro.categoria, carro.ano, carro.status];
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        }).slice(0, 5);
    }, [busca, carros]);

    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const lista = termo
            ? clientes.filter((cliente) => {
                const campos = [cliente.nome, cliente.email, cliente.telefone];
                return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
            })
            : clientes;

        return lista.slice(0, 4);
    }, [busca, clientes]);

    return (
        <main className={css.conteudo_principal}>
            <header className={css.cabecalho}>
                <div>
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_adm}>Administrador</span>
                    </h1>
                    <p className={css.subtitulo}>Acompanhe estoque, clientes, servicos e manutencoes em um so lugar.</p>
                </div>

                <div className={css.acoesTopo}>
                    <button type="button" onClick={() => navigate("/cadastroVeiculos")}>Cadastrar Veiculo</button>
                    <button type="button" onClick={() => navigate("/CadastroServicos")}>Cadastrar Servico</button>
                    <button type="button" onClick={() => navigate("/manutencoes")}>Agendar Manutencao</button>
                </div>
            </header>

            <div className={css.area_busca}>
                <img src="/IconBusca.png" alt="Buscar" className={css.icone_busca} />
                <input
                    type="text"
                    placeholder="Buscar veiculos, clientes, servicos ou manutencoes"
                    className={css.input_busca}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />
            </div>

            {erro && <div className={css.mensagemErro}>{erro}</div>}
            {carregando && <div className={css.estado}>Carregando dashboard...</div>}

            <section className={css.cardsResumo}>
                <article className={css.cardResumo}>
                    <span>Veiculos em estoque</span>
                    <strong>{resumo.emEstoque.length}</strong>
                    <small>Disponiveis para venda</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Vendidos</span>
                    <strong>{resumo.vendidos.length}</strong>
                    <small>Marcados como vendidos</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Clientes</span>
                    <strong>{clientes.length}</strong>
                    <small>{resumo.clientesBloqueados.length} bloqueado(s)</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Servicos</span>
                    <strong>{servicos.length}</strong>
                    <small>Cadastrados</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Valor em estoque</span>
                    <strong className={css.valorCard}>{formatarMoeda(resumo.valorEstoque)}</strong>
                    <small>Soma dos disponiveis</small>
                </article>
            </section>

            <section className={css.gradePrincipal}>
                <aside className={css.colunaDireita}>
                    <article className={css.painelLista}>
                        <h2>Clientes recentes</h2>
                        {clientesFiltrados.length > 0 ? (
                            clientesFiltrados.map((cliente) => (
                                <div key={cliente.id} className={css.itemLista}>
                                    <div className={css.avatar}>{String(cliente.nome).slice(0, 1).toUpperCase()}</div>
                                    <div>
                                        <strong>{cliente.nome}</strong>
                                        <span>{cliente.email || cliente.telefone || "Sem contato"}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={css.vazio}>Nenhum cliente encontrado</p>
                        )}
                    </article>

                    <article className={css.painelLista}>
                        <h2>Alertas do sistema</h2>
                        <p>Manutencoes proximas: <strong>{resumo.proximas.length}</strong></p>
                        <p>Clientes bloqueados: <strong>{resumo.clientesBloqueados.length}</strong></p>
                        <p>Estoque baixo: <strong>{resumo.emEstoque.length <= 3 ? "Sim" : "Nao"}</strong></p>
                    </article>
                </aside>
            </section>

            <section className={css.tabelaContainer}>
                <div className={css.painelCabecalho}>
                    <h2>Veiculos</h2>
                    <div className={css.filtrosRapidos}>
                        {categorias.map((categoria) => (
                            <button key={categoria} type="button" onClick={() => setBusca(categoria)}>
                                {categoria}
                            </button>
                        ))}
                    </div>
                </div>

                <table className={css.tabela}>
                    <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Ano</th>
                            <th>Cor</th>
                            <th>Preco</th>
                            <th>Acoes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {carrosFiltrados.length > 0 ? (
                            carrosFiltrados.map((carro) => (
                                <tr key={carro.id}>
                                    <td>
                                        {carro.imagem ? (
                                            <img src={`${API}${carro.imagem}`} alt={carro.modelo} className={css.fotoCarro} />
                                        ) : (
                                            <div className={css.fotoPlaceholder}>Sem foto</div>
                                        )}
                                    </td>
                                    <td>{carro.modelo}</td>
                                    <td>{carro.marca || "-"}</td>
                                    <td>{carro.ano || "-"}</td>
                                    <td>{carro.cor || "-"}</td>
                                    <td className={css.preco}>{formatarMoeda(carro.preco)}</td>
                                    <td>
                                        <button type="button" className={css.botaoVer} onClick={() => navigate(`/detalhesVeiculos/${carro.id}`)}>
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className={css.celulaVazia}>Nenhum veiculo encontrado</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </main>
    );
}

export default DashboardAdm;
