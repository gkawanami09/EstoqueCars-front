import css from "./CadastroServicos.module.css";
import Input from "../components/Input/Input.jsx";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EdicaoServicos({ API }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nomeServico, setNomeServico] = useState("");
    const [categoria, setCategoria] = useState("");
    const [preco, setPreco] = useState("");
    const [tempoEstimado, setTempoEstimado] = useState("");
    const [descricao, setDescricao] = useState("");
    const [statusServico, setStatusServico] = useState("ativo");
    const [statusDocumento, setStatusDocumento] = useState("pendente");
    const [erro, setErro] = useState("");
    const [mensagem, setMensagem] = useState(null);

    useEffect(() => {
        async function buscarDados() {
            try {
                const resposta = await fetch(`${API}/servicos/${id}`);
                const dados = await resposta.json();

                if (resposta.ok) {
                    setNomeServico(dados.nomeServico);
                    setCategoria(dados.categoria);
                    setPreco(dados.preco);
                    setTempoEstimado(dados.tempoEstimado);
                    setDescricao(dados.descricao);
                    setStatusServico(dados.statusServico);
                    setStatusDocumento(dados.statusDocumento);
                } else {
                    setErro("Erro ao carregar dados do serviço.");
                }
            } catch {
                setErro("Servidor indisponível.");
            }
        }
        buscarDados();
    }, [id, API]);

    async function atualizar(e) {
        e.preventDefault();
        setErro("");
        setMensagem(null);

        const dadosAtualizados = {
            nomeServico,
            categoria,
            preco,
            tempoEstimado,
            descricao,
            statusServico,
            statusDocumento
        };

        const resposta = await fetch(`${API}/servicos/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosAtualizados)
        });

        if (!resposta.ok) {
            const dados = await resposta.json();
            setErro(dados.erro || "Erro ao atualizar serviço.");
            return;
        }

        setMensagem({
            tipo: "sucesso",
            texto: "Servico atualizado com sucesso!"
        });
        setTimeout(() => navigate("/servicos"), 900);
    }

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>Edição de Serviço</h1>

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

            <form className={css.formulario} onSubmit={atualizar}>

                <div className={css.gridSimples}>
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

                    <Input
                        label="Nome do Serviço"
                        value={nomeServico}
                        onChange={(e) => setNomeServico(e.target.value)}
                    />

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

                    <Input
                        label="Tempo Estimado (ex: 1h 30min)"
                        value={tempoEstimado}
                        onChange={(e) => setTempoEstimado(e.target.value)}
                    />

                    <textarea
                        className={css.descricao}
                        placeholder="Descrição detalhada do serviço..."
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                    />

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

                {erro && <p className={css.erro}>{erro}</p>}

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

export default EdicaoServicos;
