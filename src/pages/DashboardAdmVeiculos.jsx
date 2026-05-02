// Importa o CSS module desta tela.
import css from "./DashboardAdmVeiculos.module.css";
// Importa os hooks usados para estado, efeito, memoizacao e funcao estavel.
import { useCallback, useEffect, useMemo, useState } from "react";
// Importa o hook usado para trocar de pagina pelo codigo.
import { useNavigate } from "react-router-dom";
// Importa o modal bonito usado para confirmar exclusao.
import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao.jsx";

// Componente da pagina de gerenciamento de veiculos do administrador.
function DashboardAdmVeiculos({ API }) {
    // Guarda todos os carros que vieram da API.
    const [carros, setCarros] = useState([]);
    // Guarda o texto digitado no campo de busca.
    const [busca, setBusca] = useState("");
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

    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    // Funcao que busca os carros na API.
    const carregarCarros = useCallback(async () => {
        // Liga o carregamento antes da requisicao.
        setCarregando(true);
        // Limpa erro antigo antes de tentar carregar de novo.
        setErro("");

        try {
            // Cria os parametros da URL da busca.
            const params = new URLSearchParams();

            // Se tiver categoria selecionada, envia para o backend.
            if (categoria) {
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
                setErro(dados.erro || "Erro ao carregar veículos.");
                return;
            }

            // Salva na tela a lista que veio da API.
            setCarros(dados.carros || []);
        } catch {
            // Mostra erro quando o servidor nao respondeu.
            setErro("Erro de conexao com o servidor.");
        } finally {
            // Desliga o carregamento tanto em sucesso quanto em erro.
            setCarregando(false);
        }
    }, [API, categoria]);

    // Chama a API quando a tela abre e quando a categoria muda.
    useEffect(() => {
        carregarCarros();
    }, [carregarCarros]);

    // Funcao que exclui um carro usando a API.
    async function excluirCarro(id) {
        // Guarda o id para mostrar carregamento no modal.
        setExcluindoId(id);
        // Limpa mensagens antigas antes de excluir.
        setErro("");

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
                setErro(dados.erro || "Erro ao excluir veículo.");
                return;
            }

            // Remove o carro excluido da lista sem precisar recarregar a pagina.
            setCarros((listaAtual) => listaAtual.filter((carro) => carro.id !== id));
            // Fecha o modal de confirmacao.
            setCarroParaExcluir(null);
        } catch {
            // Mostra erro quando nao conseguiu falar com o servidor.
            setErro("Erro de conexao com o servidor.");
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

    // Lista de categorias usadas nos botoes de filtro.
    const categorias = ["Sedan", "Eletrico", "Esportivo", "Caminhonete", "SUV"];

    // Formata o preco para moeda brasileira.
    function formatarPreco(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Transforma o status do banco em texto legivel.
    function formatarStatusEstoque(valor) {
        // Converte o valor para texto minusculo para comparar melhor.
        const status = String(valor || "").toLowerCase();

        // Status 2 ou texto parecido com indisponivel.
        if (status === "2" || status.includes("indispon")) {
            return "Indisponível";
        }

        // Status 3 ou texto parecido com vendido.
        if (status === "3" || status.includes("vend")) {
            return "Vendido";
        }

        // Qualquer outro valor fica como disponivel no estoque.
        return "Em estoque";
    }

    // Escolhe a classe CSS correta para cada status.
    function classeStatusEstoque(valor) {
        // Reaproveita a funcao que padroniza o texto do status.
        const statusFormatado = formatarStatusEstoque(valor);

        // Classe visual para carro indisponivel.
        if (statusFormatado === "Indisponível") {
            return `${css.status} ${css.status_indisponivel}`;
        }

        // Classe visual para carro vendido.
        if (statusFormatado === "Vendido") {
            return `${css.status} ${css.status_vendido}`;
        }

        // Classe visual para carro em estoque.
        return `${css.status} ${css.status_estoque}`;
    }

    // Define o texto que aparece dentro da etiqueta de status.
    function textoStatusEstoque(valor) {
        // Busca o status ja formatado.
        const statusFormatado = formatarStatusEstoque(valor);

        // Mantem "Em estoque" separado para facilitar ajuste visual depois.
        if (statusFormatado === "Em estoque") {
            return (
                <>
                    Em estoque
                </>
            );
        }

        // Retorna o texto dos outros status.
        return statusFormatado;
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
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                {/* Botoes de filtro por categoria. */}
                <section className={css.secao_filtros}>
                    {/* Botao que limpa o filtro e mostra todos. */}
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>

                    {/* Cria um botao para cada categoria. */}
                    {categorias.map((nomeCategoria) => (
                        <button
                            key={nomeCategoria}
                            type="button"
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            onClick={() => setCategoria(nomeCategoria)}
                        >
                            {nomeCategoria}
                        </button>
                    ))}
                </section> <br />

                {/* Area que envolve a tabela. */}
                <section className={css.tabela_container}>
                    {/* Tabela com a listagem dos veiculos. */}
                    <table className={css.tabela}>
                        {/* Cabecalho da tabela. */}
                        <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Ano</th>
                            <th>Km</th>
                            <th>Cor</th>
                            <th>Preço</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                        </thead>

                        {/* Corpo da tabela. */}
                        <tbody>
                        {/* Linha mostrada enquanto a API esta carregando. */}
                        {carregando && (
                            <tr>
                                <td colSpan="9" className={css.celula_vazia}>
                                    Carregando veículos...
                                </td>
                            </tr>
                        )}

                        {/* Linha mostrada quando nao existe nenhum carro para listar. */}
                        {!carregando && carrosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="9" className={css.celula_vazia}>
                                    Nenhum veículo cadastrado
                                </td>
                            </tr>
                        )}

                        {/* Cria uma linha para cada carro filtrado. */}
                        {!carregando && carrosFiltrados.map((carro) => (
                            <tr key={carro.id}>
                                {/* Foto do carro. */}
                                <td data-label="Foto">
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
                                <td data-label="Status">
                                    <span className={classeStatusEstoque(carro.status_estoque)}>
                                        {textoStatusEstoque(carro.status_estoque)}
                                    </span>
                                </td>

                                {/* Botoes de acao daquele carro. */}
                                <td data-label="Ações">
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
