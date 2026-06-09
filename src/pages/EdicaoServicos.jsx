// Importa o CSS usado nas telas de servicos.
import css from "./CadastroServicos.module.css";
// Importa o input padronizado do projeto.
import Input from "../components/Input/Input.jsx";
// Importa hooks para controlar estado e carregar dados.
import { useState, useEffect } from "react";
// Importa hooks de rota para pegar id e navegar.
import { useParams, useNavigate } from "react-router-dom";

// Monta o header Authorization quando existe token salvo.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Monta headers para requisicoes JSON.
function headersJsonAutenticado() {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return {
        "Content-Type": "application/json",
        ...(cabecalhoAutorizacao() || {})
    };
}

// Tela de edição de serviço.
function EdicaoServicos({ API }) {
    // Pega o id do servico pela URL.
    const { id } = useParams();
    // Cria funcao para navegar para outra rota.
    const navigate = useNavigate();

    // Guarda o nome do servico.
    const [nomeServico, setNomeServico] = useState("");
    // Guarda a categoria do servico.
    const [categoria, setCategoria] = useState("");
    // Guarda o preco digitado.
    const [preco, setPreco] = useState("");
    // Guarda o tempo estimado.
    const [tempoEstimado, setTempoEstimado] = useState("");
    // Guarda a descricao do servico.
    const [descricao, setDescricao] = useState("");
    // Guarda se o servico esta ativo ou inativo.
    const [statusServico, setStatusServico] = useState("ativo");
    // Guarda o status do documento.
    const [statusDocumento, setStatusDocumento] = useState("pendente");
    // Guarda erro simples vindo da API.
    const [erro, setErro] = useState("");
    // Guarda mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);

    // Busca os dados do servico quando a tela abre.
    useEffect(() => {
        // Funcao interna que chama a API.
        async function buscarDados() {
            // Tenta executar a operação e permite tratar possíveis falhas.
            try {
                // Busca o servico pelo id da URL.
                const resposta = await fetch(`${API}/servicos/${id}`, {
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                // Converte a resposta para JSON.
                const dados = await resposta.json();

                // Se a API deu certo, preenche os campos.
                if (resposta.ok) {
                    // Atualiza o estado por meio de setNomeServico.
                    setNomeServico(dados.nomeServico);
                    // Atualiza o estado por meio de setCategoria.
                    setCategoria(dados.categoria);
                    // Atualiza o estado por meio de setPreco.
                    setPreco(dados.preco);
                    // Atualiza o estado por meio de setTempoEstimado.
                    setTempoEstimado(dados.tempoEstimado);
                    // Atualiza o estado por meio de setDescricao.
                    setDescricao(dados.descricao);
                    // Atualiza o estado por meio de setStatusServico.
                    setStatusServico(dados.statusServico);
                    // Atualiza o estado por meio de setStatusDocumento.
                    setStatusDocumento(dados.statusDocumento);
                } else {
                    // Se a API respondeu erro, mostra mensagem.
                    setErro("Erro ao carregar dados do serviço.");
                }
            } catch {
                // Se não conectou no servidor, mostra erro.
                setErro("Servidor indisponível.");
            }
        }

        // Executa a busca.
        buscarDados();
    }, [id, API]);

    // Envia as alterações do serviço para a API.
    async function atualizar(e) {
        // Impede refresh da pagina.
        e.preventDefault();
        // Limpa erro antigo.
        setErro("");
        // Limpa mensagem antiga.
        setMensagem(null);

        // Monta o objeto com os dados editados.
        const dadosAtualizados = {
            nomeServico,
            categoria,
            preco,
            tempoEstimado,
            descricao,
            statusServico,
            statusDocumento
        };

        // Envia o PUT para atualizar o serviço.
        const resposta = await fetch(`${API}/servicos/${id}`, {
            method: "PUT",
            headers: headersJsonAutenticado(),
            credentials: "include",
            body: JSON.stringify(dadosAtualizados)
        });

        // Se a API retornou erro, mostra o erro.
        if (!resposta.ok) {
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();
            // Atualiza o estado por meio de setErro.
            setErro(dados.erro || "Erro ao atualizar serviço.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Mostra mensagem de sucesso.
        setMensagem({
            tipo: "sucesso",
            texto: "Serviço atualizado com sucesso!"
        });
        // Volta para a tela de serviços depois de um pequeno tempo.
        setTimeout(() => navigate("/servicos"), 900);
    }

    // Renderiza a tela.
    return (
        // Container principal.
        <main className={css.container}>
            {/* Titulo da tela. */}
            <h1 className={css.titulo}>Edição de Serviço</h1>

            {/* Mensagem visual de sucesso ou erro. */}
            {mensagem && (
                <div
                   className={`${css.mensagem} ${
                        mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                    }`}
                    role="alert"
                >
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Renderiza o elemento strong nesta parte da página. */}
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Confira os dados"}</strong>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span>{mensagem.texto}</span>
                    </div>
                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        className={css.mensagem_fechar}
                        onClick={() => setMensagem(null)}
                        aria-label="Fechar mensagem"
                    >
                        x
                    </button>
                </div>
            )}

            {/* Formulario que envia a edicao. */}
            <form className={css.formulario} onSubmit={atualizar}>
                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.gridSimples}>
                    {/* Select de status do serviço. */}
                    <div className={css.documento}>
                        {/* Exibe uma lista de opções para seleção. */}
                        <select
                            className={css.selectPequeno}
                            value={statusServico}
                            onChange={(e) => setStatusServico(e.target.value)}
                        >
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="ativo">Status: Ativo</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="inativo">Status: Inativo</option>
                        </select>
                    </div>

                    {/* Campo do nome do serviço. */}
                    <Input
                        label="Nome do Serviço"
                        value={nomeServico}
                        onChange={(e) => setNomeServico(e.target.value)}
                    />

                    {/* Linha com categoria e valor. */}
                    <div className={css.duplo}>
                        {/* Exibe uma lista de opções para seleção. */}
                        <select
                            className={css.select}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="">Categoria do Serviço</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="mecanica">Mecânica</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="eletrica">Elétrica</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="estetica">Estética</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="revisao">Revisão</option>
                        </select>

                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Valor (R$)"
                            value={preco}
                            onChange={(e) => setPreco(e.target.value)}
                        />
                    </div>

                    {/* Campo do tempo estimado. */}
                    <Input
                        label="Tempo Estimado (ex: 1h 30min)"
                        value={tempoEstimado}
                        onChange={(e) => setTempoEstimado(e.target.value)}
                    />

                    {/* Campo de descrição detalhada. */}
                    <textarea
                        className={css.descricao}
                        placeholder="Descrição detalhada do serviço..."
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                    />

                    {/* Select de status de documento. */}
                    <div className={css.documento}>
                        {/* Exibe uma lista de opções para seleção. */}
                        <select
                            className={css.selectPequeno}
                            value={statusDocumento}
                            onChange={(e) => setStatusDocumento(e.target.value)}
                        >
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="pendente">Documentação: Pendente</option>
                            {/* Renderiza o elemento option nesta parte da página. */}
                            <option value="regular">Documentação: Ok</option>
                        </select>

                        {/* Exibe este botão de ação. */}
                        <button type="button" className={css.anexar}>
                            Atualizar Documento
                        </button>
                    </div>
                </div>

                {/* Erro simples da tela. */}
                {erro && <p className={css.erro}>{erro}</p>}

                {/* Botões finais. */}
                <div className={css.botoes}>
                    {/* Exibe este botão de ação. */}
                    <button type="submit" className={css.salvar}>Salvar Alterações</button>
                    {/* Exibe este botão de ação. */}
                    <button
                        type="button"
                        className={css.cancelar}
                        onClick={() => navigate("/servicos")}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </main>
    );
}

// Exporta a tela para as rotas.
export default EdicaoServicos;
