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
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Monta headers para requisicoes JSON.
function headersJsonAutenticado() {
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
                    setNomeServico(dados.nomeServico);
                    setCategoria(dados.categoria);
                    setPreco(dados.preco);
                    setTempoEstimado(dados.tempoEstimado);
                    setDescricao(dados.descricao);
                    setStatusServico(dados.statusServico);
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
            const dados = await resposta.json();
            setErro(dados.erro || "Erro ao atualizar serviço.");
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
                    <div>
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Confira os dados"}</strong>
                        <span>{mensagem.texto}</span>
                    </div>
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
                <div className={css.gridSimples}>
                    {/* Select de status do serviço. */}
                    <div className={css.documento}>
                        <select
                            className={css.selectPequeno}
                            value={statusServico}
                            onChange={(e) => setStatusServico(e.target.value)}
                        >
                            <option value="ativo">Status: Ativo</option>
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
                        <select
                            className={css.select}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <option value="">Categoria do Serviço</option>
                            <option value="mecanica">Mecânica</option>
                            <option value="eletrica">Elétrica</option>
                            <option value="estetica">Estética</option>
                            <option value="revisao">Revisão</option>
                        </select>

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
                        <select
                            className={css.selectPequeno}
                            value={statusDocumento}
                            onChange={(e) => setStatusDocumento(e.target.value)}
                        >
                            <option value="pendente">Documentação: Pendente</option>
                            <option value="regular">Documentação: Ok</option>
                        </select>

                        <button type="button" className={css.anexar}>
                            Atualizar Documento
                        </button>
                    </div>
                </div>

                {/* Erro simples da tela. */}
                {erro && <p className={css.erro}>{erro}</p>}

                {/* Botões finais. */}
                <div className={css.botoes}>
                    <button type="submit" className={css.salvar}>Salvar Alterações</button>
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
