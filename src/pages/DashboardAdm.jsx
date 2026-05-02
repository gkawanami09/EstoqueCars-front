// Importa os hooks do React necessarios para gerenciar estado e efeitos colaterais.
import { useEffect, useMemo, useState } from "react";
// Importa o hook para navegacao entre paginas.
import { useNavigate } from "react-router-dom";
// Importa os estilos CSS especificos para esta pagina.
import css from "./DashboardAdm.module.css";

// Lista fixa de categorias usadas para filtrar os veiculos rapidamente.
const categorias = ["Sedan", "Eletrico", "Esportivo", "Caminhonete", "SUV"];

// Funcao auxiliar para extrair uma lista de dentro da resposta da API.
// Procura nas propriedades do objeto pelas "chaves" possiveis ate encontrar um array.
function extrairLista(dados, chaves) {
    // Se o proprio dado ja for um array, retorna ele.
    if (Array.isArray(dados)) {
        return dados;
    }

    // Percorre as chaves possiveis (ex: "carros", "veiculos").
    for (const chave of chaves) {
        if (Array.isArray(dados?.[chave])) {
            return dados[chave]; // Retorna a primeira lista encontrada.
        }
    }

    // Se nao encontrar nenhuma lista valida, retorna vazio.
    return [];
}

// Funcao auxiliar para converter a resposta HTTP da API em objeto JSON.
// Previne erros caso a API retorne algo vazio ou que nao seja JSON valido.
async function lerRespostaJson(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {}; // Se falhar no parse, retorna um objeto vazio para evitar quebrar a tela.
    }
}

// Funcao para padronizar o status do veiculo no estoque para uso interno.
function normalizarStatus(valor) {
    const status = String(valor || "").toLowerCase();

    // Se o valor for "2" ou contiver a palavra "indispon", marca como indisponivel.
    if (status === "2" || status.includes("indispon")) {
        return "indisponivel";
    }

    // Se o valor for "3" ou contiver "vend", marca como vendido.
    if (status === "3" || status.includes("vend")) {
        return "vendido";
    }

    // Qualquer outra coisa é considerada em estoque.
    return "estoque";
}

// Funcao que padroniza o objeto "carro" recebido de diferentes endpoints da API.
// Garante que o frontend sempre tenha os mesmos campos (id, modelo, preco, etc).
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

// Funcao que padroniza o objeto "cliente" recebido da API.
function normalizarCliente(cliente) {
    return {
        id: cliente.id_usuario ?? cliente.id,
        nome: cliente.nome ?? cliente.NOME ?? "Cliente",
        email: cliente.email ?? "",
        telefone: cliente.telefone ?? "",
        bloqueado: Boolean(cliente.bloqueado) || String(cliente.status || "").toLowerCase().includes("bloque")
    };
}

// Funcao que padroniza o objeto "servico" recebido da API.
function normalizarServico(servico) {
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id;
    const nome = servico.descricao ?? servico.nome_servico ?? servico.NOME_SERVICO ?? servico.nome ?? "Servico";

    return {
        id,
        nome,
        valor: Number(servico.valor_unitario ?? servico.valor ?? servico.VALOR ?? 0)
    };
}

// Funcao que padroniza o objeto "manutencao" recebido da API.
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

// Funcao para converter uma string de data formato Brasileiro (DD/MM/YYYY HH:MM) para o tipo Date do JavaScript.
function dataBrParaDate(valor) {
    // Usa expressao regular para extrair o dia, mes, ano, hora e minuto.
    const partes = String(valor || "").match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);

    if (!partes) {
        return null; // Retorna null se a data for invalida.
    }

    // Retorna o objeto Date (mes começa do 0, entao diminui 1).
    return new Date(
        Number(partes[3]),
        Number(partes[2]) - 1,
        Number(partes[1]),
        Number(partes[4]),
        Number(partes[5])
    );
}

// Funcao que avalia se uma manutencao agendada esta proxima de acontecer (dentro de 7 dias).
function estaProxima(data) {
    const dataAgendada = dataBrParaDate(data);

    if (!dataAgendada) {
        return false;
    }

    const agora = new Date();
    // Quantidade de milissegundos equivalentes a 7 dias.
    const seteDias = 7 * 24 * 60 * 60 * 1000;

    // É proxima se a data agendada for no futuro e a diferenca para hoje for menor ou igual a 7 dias.
    return dataAgendada >= agora && dataAgendada.getTime() - agora.getTime() <= seteDias;
}

// Funcao para formatar um valor numerico para o padrao da moeda Brasileira (Real).
function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// Cria o cabecalho com o token JWT que deve ser enviado para rotas protegidas da API.
function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    // Retorna o header Authorization caso o token exista no localStorage.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Componente principal do Dashboard do Administrador.
function DashboardAdm({ API }) {
    const navigate = useNavigate(); // Hook para mudar de tela.
    // Estados para armazenar as entidades listadas na tela.
    const [carros, setCarros] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [manutencoes, setManutencoes] = useState([]);
    // Estado para o texto do campo de busca.
    const [busca, setBusca] = useState("");
    // Controle do aviso de tela carregando.
    const [carregando, setCarregando] = useState(true);
    // Armazena mensagem de erro geral, caso algo falhe ao carregar a tela.
    const [erro, setErro] = useState("");

    // O useEffect dispara toda vez que o componente for montado na tela.
    useEffect(() => {
        // Funcao assincrona para buscar todos os dados de uma vez só.
        async function carregarDashboard() {
            setCarregando(true);
            setErro("");

            try {
                // Dispara todas as chamadas de API em paralelo (ao mesmo tempo) para ser mais rapido.
                const [resCarros, resClientes, resServicos, resManutencoes] = await Promise.all([
                    fetch(`${API}/listar_carro`, { method: "GET", headers: cabecalhoAutorizacao(), credentials: "include" }),
                    fetch(`${API}/listar_usuario`, { method: "GET", headers: cabecalhoAutorizacao(), credentials: "include" }),
                    fetch(`${API}/buscar_servico`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({})
                    }),
                    fetch(`${API}/listar_manutencao`, { method: "GET", headers: cabecalhoAutorizacao(), credentials: "include" })
                ]);

                // Aguarda a conversao de todas as respostas HTTP para JSON.
                const [dadosCarros, dadosClientes, dadosServicos, dadosManutencoes] = await Promise.all([
                    lerRespostaJson(resCarros),
                    lerRespostaJson(resClientes),
                    lerRespostaJson(resServicos),
                    lerRespostaJson(resManutencoes)
                ]);

                // Se a API dos carros retornar com sucesso, extrai a lista e normaliza.
                if (resCarros.ok) {
                    setCarros(extrairLista(dadosCarros, ["carros", "veiculos", "veiculo"]).map(normalizarCarro));
                }

                // Se a API dos usuarios retornar com sucesso, filtra apenas os clientes (evita mostrar outros Admins).
                if (resClientes.ok) {
                    setClientes(
                        extrairLista(dadosClientes, ["usuarios", "clientes"])
                            .filter((cliente) => Number(cliente.tipo_usuario) !== 2) // O tipo 2 provavelmente indica perfil Admin.
                            .map(normalizarCliente)
                    );
                }

                // Se a API de servicos retornar com sucesso, normaliza e salva no estado.
                if (resServicos.ok) {
                    setServicos(extrairLista(dadosServicos, ["servicos", "servico", "servicos_cadastrados"]).map(normalizarServico));
                }

                // Se a API de manutencoes retornar sucesso, atualiza o estado com os dados formatados.
                if (resManutencoes.ok) {
                    setManutencoes(extrairLista(dadosManutencoes, ["manutencoes", "manutencao"]).map(normalizarManutencao));
                }
            } catch {
                // Em caso de excecao (API fora do ar, problema de conexao, etc), seta a msg de erro.
                setErro("Nao foi possivel carregar os dados do dashboard.");
            } finally {
                // Independente de dar erro ou sucesso, desliga o carregamento no final.
                setCarregando(false);
            }
        }

        // Invoca a funcao assim que a tela abre.
        carregarDashboard();
    }, [API]);

    // O useMemo memoriza dados estaticos computados (resumo dos cartões) e so atualiza quando listas mudarem.
    const resumo = useMemo(() => {
        // Conta a quantidade de carros marcados como em estoque.
        const emEstoque = carros.filter((carro) => carro.status === "estoque");
        // Conta a quantidade de carros vendidos.
        const vendidos = carros.filter((carro) => carro.status === "vendido");
        // Filtra as manutencoes para identificar quais serao as proximas (dentro de 7 dias).
        const proximas = manutencoes.filter((manutencao) => estaProxima(manutencao.data));
        // Separa todos os clientes cujo status atual seja 'bloqueado'.
        const clientesBloqueados = clientes.filter((cliente) => cliente.bloqueado);
        // Calcula o valor total financeiro que está parado no estoque.
        const valorEstoque = emEstoque.reduce((total, carro) => total + carro.preco, 0);
        
        // Retorna um objeto consolidando todas as contagens prontas para os cartoes.
        return {
            emEstoque,
            vendidos,
            proximas,
            clientesBloqueados,
            valorEstoque
        };
    }, [carros, clientes, manutencoes]); // Atualiza o resumo apenas quando um destes tres arrays mudar.

    // Memoriza a lista de veiculos apos receber o filtro de texto da pesquisa.
    const carrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase(); // Remove os espaços laterais e joga para minusculo.

        // Se a busca estiver vazia, retorna so os 5 primeiros carros (nao sobrecarrega a tela do admin).
        if (!termo) {
            return carros.slice(0, 5);
        }

        // Com termo digitado, filtra todos os veiculos.
        return carros.filter((carro) => {
            // Arrays com todos os campos que serao lidos na busca (Modelo, placa, status etc).
            const campos = [carro.modelo, carro.marca, carro.placa, carro.cor, carro.categoria, carro.ano, carro.status];
            // 'some' varre os itens e retorna 'true' se encontrar pelo menos uma combinacao do termo ali.
            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        }).slice(0, 5); // Mesmo pesquisando, a tabela inferior mostra no maximo 5 resultados nesta tela de dashboard geral.
    }, [busca, carros]);

    // O mesmo processo é repetido para os clientes, caso queira que o menu de recentes filtre.
    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        
        // Operacao de filtro semelhante ao de carros, com os campos Nome, Email e Telefone.
        const lista = termo
            ? clientes.filter((cliente) => {
                const campos = [cliente.nome, cliente.email, cliente.telefone];
                return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
            })
            : clientes;

        // Retorna os 4 ultimos clientes (ou os primeiros da busca) na lista lateral.
        return lista.slice(0, 4);
    }, [busca, clientes]);

    return (
        // Envolve o conteudo inteiro da pagina de Dashboard.
        <main className={css.conteudo_principal}>
            
            {/* Header da pagina, onde fica a saudacao inicial e o grupo de botoes superiores. */}
            <header className={css.cabecalho}>
                <div>
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_adm}>Administrador</span>
                    </h1>
                    <p className={css.subtitulo}>Acompanhe estoque, clientes, serviços e manutenções em um só lugar.</p>
                </div>

                <div className={css.acoesTopo}>
                    <button type="button" onClick={() => navigate("/cadastroVeiculos")}>Cadastrar Veículo</button>
                    <button type="button" onClick={() => navigate("/CadastroServicos")}>Cadastrar Serviço</button>
                    <button type="button" onClick={() => navigate("/manutencoes")}>Agendar Manutenção</button>
                </div>
            </header>

            {/* Input de texto responsavel pela barra de busca superior do dashboard. */}
            <div className={css.area_busca}>
                <img src="/IconBusca.png" alt="Buscar" className={css.icone_busca} />
                <input
                    type="text"
                    placeholder="Buscar veículos"
                    className={css.input_busca}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)} // Armazena a digitacao em tempo real no estado.
                />
            </div>

            {/* Renderizacao condicional para as flags de status inicial (se carregando ou se quebrou API). */}
            {erro && <div className={css.mensagemErro}>{erro}</div>}
            {carregando && <div className={css.estado}>Carregando dashboard...</div>}

            {/* Sessao de cartoes superiores: Cada article e um quadrado do topo da tela que mostra as parciais. */}
            <section className={css.cardsResumo}>
                <article className={css.cardResumo}>
                    <span>Veículos em estoque</span>
                    <strong>{resumo.emEstoque.length}</strong> {/* Quantidade calculada no useMemo de resumo. */}
                    <small>Disponíveis para venda</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Vendidos</span>
                    <strong>{resumo.vendidos.length}</strong>
                    <small>Marcados como vendidos</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Clientes</span>
                    <strong>{clientes.length}</strong> {/* Tamanho total do array que veio do backend. */}
                    <small>{resumo.clientesBloqueados.length} bloqueado(s)</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Serviços</span>
                    <strong>{servicos.length}</strong>
                    <small>Cadastrados</small>
                </article>
                <article className={css.cardResumo}>
                    <span>Valor em estoque</span>
                    <strong className={css.valorCard}>{formatarMoeda(resumo.valorEstoque)}</strong>
                    <small>Soma dos disponíveis</small>
                </article>
            </section>

            {/* Sessao lateral e inferior contendo avisos e os clientes recentes, numa grade para otimizar o fluxo de leitura. */}
            <section className={css.gradePrincipal}>
                <aside className={css.colunaDireita}>
                    
                    {/* Lista que imprime os avatares genericos gerados atraves da 1º letra do nome do cliente. */}
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

                    {/* Mostra alertas calculados para chamar a atencao rapida do Admin. */}
                    <article className={css.painelLista}>
                        <h2>Alertas do sistema</h2>
                        <p>Manutenções próximas: <strong>{resumo.proximas.length}</strong></p>
                        <p>Clientes bloqueados: <strong>{resumo.clientesBloqueados.length}</strong></p>
                        <p>Estoque baixo: <strong>{resumo.emEstoque.length <= 3 ? "Sim" : "Não"}</strong></p>
                    </article>
                </aside>
            </section>

            {/* Container da lista dos 5 carros em destaque, abaixo dos alertas. */}
            <section className={css.tabelaContainer}>
                
                {/* Cabecalho da tabela possuindo os atalhos rapidos por tipo de veiculo (SUV, Caminhonetes, etc). */}
                <div className={css.painelCabecalho}>
                    <h2>Veículos</h2>
                    <div className={css.filtrosRapidos}>
                        {categorias.map((categoria) => (
                            <button key={categoria} type="button" onClick={() => setBusca(categoria)}>
                                {categoria}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estrutura padrao da tabela de veiculos que agora possue suporte a "cartoes responsivos" por uso do data-label no CSS. */}
                <table className={css.tabela}>
                    <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Ano</th>
                            <th>Cor</th>
                            <th>Preço</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        
                        {/* Verificacao para listar os veiculos apenas se possuir algum filtrado do array. */}
                        {carrosFiltrados.length > 0 ? (
                            carrosFiltrados.map((carro) => (
                                <tr key={carro.id}>
                                    <td data-label="Foto">
                                        {/* Permite que seja checado o caminho para imagem para nao retornar imagem quebrada. */}
                                        {carro.imagem ? (
                                            <img src={`${API}${carro.imagem}`} alt={carro.modelo} className={css.fotoCarro} />
                                        ) : (
                                            <div className={css.fotoPlaceholder}>Sem foto</div>
                                        )}
                                    </td>
                                    <td data-label="Modelo">{carro.modelo}</td>
                                    <td data-label="Marca">{carro.marca || "-"}</td>
                                    <td data-label="Ano">{carro.ano || "-"}</td>
                                    <td data-label="Cor">{carro.cor || "-"}</td>
                                    <td data-label="Preço" className={css.preco}>{formatarMoeda(carro.preco)}</td>
                                    <td data-label="Ações">
                                        
                                        {/* Redireciona via ID para que se possa olhar minuciosamente o cadastro de um veiculo em questao. */}
                                        <button type="button" className={css.botaoVer} onClick={() => navigate(`/detalhesVeiculos/${carro.id}`)}>
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className={css.celulaVazia}>Nenhum veículo encontrado</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
        </main>
    );
}

// Exporta este componente padrao de DashboardAdm.
export default DashboardAdm;
