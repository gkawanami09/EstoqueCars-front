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
        return {};
    }

    try {
        // Converte a resposta da API para objeto JavaScript.
        return JSON.parse(texto);
    } catch {
        // Se a resposta nao for JSON valido, devolve objeto vazio.
        return {};
    }
}

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
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

    const [reservando, setReservando] = useState(false);

    const [mensagemReserva, setMensagemReserva] = useState(null);

    // Guarda erro ao buscar as manutencoes.
    const [erroManutencoes, setErroManutencoes] = useState("");

    // Busca as manutencoes vinculadas ao veiculo exibido no detalhe.
    const carregarManutencoes = useCallback(async (idVeiculo) => {
        // Liga o carregamento da parte de manutencoes.
        setCarregandoManutencoes(true);

        // Limpa erro antigo antes de fazer uma nova busca.
        setErroManutencoes("");

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
                    setManutencoes([]);
                    return;
                }

                // Para outros erros, mostra a mensagem na tela.
                setErroManutencoes(dados.erro || "Não foi possível carregar as manutenções.");
                return;
            }

            // Salva a lista de manutencoes; se nao vier lista, salva vazio.
            setManutencoes(Array.isArray(dados) ? dados : []);
        } catch {
            // Erro de rede ou servidor fora do ar.
            setErroManutencoes("Erro de conexão ao carregar manutenções.");
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
                setErro(dados.erro || "Não foi possível carregar o veículo.");
                return;
            }

            // Procura o carro da lista que tem o mesmo ID recebido pela URL.
            const veiculoEncontrado = (dados.carros || []).find((item) => {
                // Aceita varios nomes de ID porque cada API pode devolver diferente.
                const idVeiculo = item.id || item.id_carro || item.id_veiculo || item.ID_VEICULO || item.ID_CARRO;
                return String(idVeiculo) === String(id);
            });

            // Se nao encontrou, mostra tela de erro.
            if (!veiculoEncontrado) {
                setErro("Veículo não encontrado.");
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
        carregarCarro();
    }, [carregarCarro]);

    // Formata valores monetarios no padrao brasileiro.
    function formatarPreco(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Formata numeros comuns, como quilometragem.
    function formatarNumero(valor) {
        return Number(valor || 0).toLocaleString("pt-BR");
    }

    function tipoStatusEstoque(valor) {
        const status = String(valor || "").toLowerCase();

        if (status === "2" || status.includes("vend")) {
            return "vendido";
        }

        if (status === "3" || status.includes("indispon")) {
            return "indisponivel";
        }

        return "estoque";
    }

    // Converte o status do estoque para um texto legivel.
    function formatarStatusEstoque(valor) {
        const tipoStatus = tipoStatusEstoque(valor);

        if (tipoStatus === "indisponivel") {
            return "Reservado";
        }

        if (tipoStatus === "vendido") {
            return "Vendido";
        }

        if (tipoStatus === "estoque") {
            return "Em estoque";
        }

        const status = String(valor || "").toLowerCase();

        // Texto com indisponivel/reservado vira "Reservado".
        if (status.includes("indispon") || status.includes("reserv")) {
            return "Reservado";
        }

        // Texto com vendido vira "Vendido".
        if (status.includes("vend")) {
            return "Vendido";
        }

        // Qualquer outro valor vira "Em estoque".
        return "Em estoque";
    }

    // Escolhe a cor do status usando a mesma regra da listagem administrativa.
    function classeStatusEstoque(valor) {
        const tipoStatus = tipoStatusEstoque(valor);

        if (tipoStatus === "indisponivel") {
            return css.status_indisponivel;
        }

        if (tipoStatus === "vendido") {
            return css.status_vendido;
        }

        if (tipoStatus === "estoque") {
            return css.status_estoque;
        }

        const statusFormatado = formatarStatusEstoque(valor);

        if (statusFormatado === "Reservado") {
            return css.status_indisponivel;
        }

        if (statusFormatado === "Vendido") {
            return css.status_vendido;
        }

        return css.status_estoque;
    }

    // Converte o estado de conservacao para texto.
    function formatarEstado(valor) {
        const estado = String(valor || "").toLowerCase();

        if (estado === "2" || estado.includes("regular")) {
            return "Regular";
        }

        if (estado === "3" || estado.includes("ruim")) {
            return "Ruim";
        }

        return "Bom";
    }

    // Converte o status do documento para texto.
    function formatarDocumento(valor) {
        const status = String(valor || "").toLowerCase();

        if (status === "2" || status.includes("irregular")) {
            return "Irregular";
        }

        if (status === "3" || status.includes("pendente")) {
            return "Pendente";
        }

        return "Regular";
    }

    // Converte o cambio salvo no banco para texto.
    function formatarCambio(valor) {
        const cambio = String(valor || "").toLowerCase();

        if (cambio === "1" || cambio.includes("auto")) {
            return "Automático";
        }

        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        return valor || "-";
    }

    // Aplica mascara visual na placa sem alterar o dado no banco.
    function formatarPlaca(valor) {
        // Remove caracteres especiais e deixa tudo maiusculo.
        const placa = String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        // Se nao houver placa, mostra traco.
        if (!placa) {
            return "-";
        }

        // Placa antiga: ABC1234 vira ABC-1234.
        if (/^[A-Z]{3}[0-9]{4}$/.test(placa)) {
            return `${placa.slice(0, 3)}-${placa.slice(3)}`;
        }

        // Placa Mercosul fica sem traco: ABC1D23.
        return placa.slice(0, 7);
    }

    // Mostra o RENAVAM apenas com numeros e no limite correto.
    function formatarRenavam(valor) {
        const renavam = String(valor || "").replace(/\D/g, "").slice(0, 11);

        if (!renavam) {
            return "-";
        }

        return renavam;
    }

    // Monta a URL da imagem do backend ou retorna o icone padrao.
    function imagemVeiculo() {
        // Se nao houver imagem cadastrada, usa um icone padrao.
        if (!carro?.imagem) {
            return "/IconCar.png";
        }

        // Se a imagem ja veio como URL completa, usa direto.
        if (String(carro.imagem).startsWith("http")) {
            return carro.imagem;
        }

        // Se veio caminho relativo, junta com a URL base da API.
        return `${API}${carro.imagem}`;
    }

    // Evita mostrar vazio na ficha tecnica.
    function valor(campo) {
        return campo || "-";
    }

    // Pega o ID do carro aceitando nomes diferentes que podem vir da API.
    function idCarro() {
        return carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO;
    }

    async function reservarVeiculo() {
        const idVeiculo = idCarro();

        if (!idVeiculo || tipoStatusEstoque(carro?.status_estoque) !== "estoque") {
            return;
        }

        if (!usuarioEstaLogado) {
            navigate("/login");
            return;
        }

        setReservando(true);
        setMensagemReserva(null);

        try {
            const idUsuarioReserva = Number(usuarioLogado.id_usuario || usuarioLogado.id_user || usuarioLogado.id || usuarioLogado.ID_USUARIO);

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
            const dados = await lerRespostaJson(resposta);

            if (!resposta.ok) {
                setMensagemReserva({
                    tipo: "erro",
                    texto: dados.erro || dados.mensagem || "Não foi possível reservar este veículo."
                });
                return;
            }

            setCarro((veiculoAtual) => ({
                ...veiculoAtual,
                status_estoque: 3,
                id_usuario_reserva: dados.id_usuario_reserva ?? veiculoAtual?.id_usuario_reserva,
                nome_usuario_reserva: dados.nome_usuario_reserva ?? veiculoAtual?.nome_usuario_reserva,
                precisa_concluir_venda: dados.precisa_concluir_venda ?? true,
                status_venda: dados.status_venda ?? "RESERVADO_PENDENTE_CONCLUSAO"
            }));
            setMensagemReserva({
                tipo: "sucesso",
                texto: dados.mensagem || "Veículo reservado com sucesso."
            });
        } catch {
            setMensagemReserva({
                tipo: "erro",
                texto: "Erro de conexão ao reservar o veículo."
            });
        } finally {
            setReservando(false);
        }
    }

    // Enquanto a API ainda busca o carro, mostra uma mensagem de carregamento.
    if (carregando) {
        return (
            <main className={css.container}>
                <div className={css.estado}>Carregando detalhes do veículo...</div>
            </main>
        );
    }

    // Se deu erro ou nao encontrou carro, mostra uma tela simples de erro.
    if (erro || !carro) {
        return (
            <main className={css.container}>
                <div className={css.estado_erro}>
                    <strong>Ops, não encontramos esse veículo.</strong>
                    <span>{erro || "Tente voltar para a lista e abrir novamente."}</span>
                    <button type="button" onClick={() => navigate(rotaVoltar)}>
                        Voltar para veículos
                    </button>
                </div>
            </main>
        );
    }

    // Renderiza a tela quando o carro foi encontrado.
    return (
        <main className={css.container}>
            {/* Cabecalho da pagina com botao voltar, titulo e botao editar para admin. */}
            <header className={css.cabecalho}>
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
                        {formatarStatusEstoque(carro.status_estoque)}
                    </span>
                    {/* Preco de venda formatado em real. */}
                    <div className={css.preco_bloco}>
                        <span>Preço de venda</span>
                        <strong>{formatarPreco(carro.preco)}</strong>
                    </div>
                    {/* Descricao cadastrada no veiculo. */}
                    <div className={css.descricao_bloco}>
                        <span>Descrição</span>
                        <p>{valor(carro.descricao)}</p>
                    </div>

                    {!isPainelAdm && (
                        <div className={css.reserva_area}>
                            {mensagemReserva && (
                                <p className={`${css.mensagem_reserva} ${mensagemReserva.tipo === "erro" ? css.mensagem_reserva_erro : ""}`}>
                                    {mensagemReserva.texto}
                                </p>
                            )}
                            <button
                                type="button"
                                className={css.reservar}
                                onClick={reservarVeiculo}
                                disabled={reservando || tipoStatusEstoque(carro.status_estoque) !== "estoque"}
                            >
                                {!usuarioEstaLogado ? "Entrar para reservar" : reservando ? "Reservando..." : tipoStatusEstoque(carro.status_estoque) === "estoque" ? "Reservar veículo" : "Veículo reservado"}
                            </button>
                        </div>
                    )}

                </aside>
            </section>

            {/* Ficha tecnica com todos os dados cadastrados do carro. */}
            <section className={css.ficha}>
                {/* Titulo da ficha tecnica. */}
                <div className={css.ficha_cabecalho}>
                    <h2>Ficha técnica</h2>
                    <span>Dados cadastrados do veículo</span>
                </div>

                {/* Grid de informacoes, usando o componente Info para repetir o mesmo layout. */}
                <div className={css.grid}>
                    <Info titulo="Marca" valor={valor(carro.marca)} />
                    <Info titulo="Modelo" valor={valor(carro.modelo)} />
                    <Info titulo="Categoria" valor={valor(carro.categoria || carro.nome_categoria)} />
                    <Info titulo="Câmbio" valor={formatarCambio(carro.cambio)} />
                    <Info titulo="Ano fabricação" valor={valor(carro.ano_fabricacao)} />
                    <Info titulo="Ano modelo" valor={valor(carro.ano_modelo)} />
                    <Info titulo="Quilometragem" valor={`${formatarNumero(carro.quilometragem)} km`} />
                    <Info titulo="Cor" valor={valor(carro.cor)} />
                    <Info titulo="Placa" valor={formatarPlaca(carro.placa)} />
                    <Info titulo="Renavam" valor={formatarRenavam(carro.renavam)} />
                    <Info titulo="Conservação" valor={formatarEstado(carro.estado_conservacao)} />
                    <Info titulo="Documento" valor={formatarDocumento(carro.status_documento)} />
                </div>
            </section>

            {/* Secao com as manutencoes vinculadas ao veiculo. */}
            <section className={css.manutencoes}>
                {/* Titulo da area de manutencoes. */}
                <div className={css.ficha_cabecalho}>
                    <h2>Manutenções do veículo</h2>
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
                        {manutencoes.map((manutencao) => (
                            <article key={manutencao.id_manutencao} className={css.card_manutencao}>
                                {/* Topo do card com numero, data e valor total da manutencao. */}
                                <div className={css.manutencao_topo}>
                                    <div>
                                        <strong>Manutenção #{manutencao.id_manutencao}</strong>
                                        <span>{manutencao.data || "-"}</span>
                                    </div>
                                    <strong className={css.valor_manutencao}>
                                        {formatarPreco(manutencao.valor_total)}
                                    </strong>
                                </div>

                                {/* Servicos realizados dentro daquela manutencao. */}
                                <div className={css.servicos_manutencao}>
                                    {(manutencao.servicos_realizados || []).map((servico, index) => (
                                        <div key={`${servico.servico}-${index}`} className={css.servico_item}>
                                            <span>{servico.servico || servico.nome_servico || "Serviço"}</span>
                                            <small>
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
    return (
        // Cada item mostra o nome do campo e o valor dele.
        <div className={css.info}>
            <span>{titulo}</span>
            <strong>{valor}</strong>
        </div>
    );
}

// Exporta a pagina para ser usada nas rotas do App.jsx.
export default DetalhesVeiculos;
