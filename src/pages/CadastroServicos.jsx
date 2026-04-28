import css from "./CadastroServicos.module.css";
import Input from "../components/Input/Input.jsx";
import { useState } from "react";
import { IMaskInput } from "react-imask";

function CadastroServicos({ API }) {
    const [nomeServico, setNomeServico] = useState("");
    const [categoria, setCategoria] = useState("");
    const [preco, setPreco] = useState("");
    const [descricao, setDescricao] = useState("");
    const [statusServico, setStatusServico] = useState("ativo");
    const [statusDocumento, setStatusDocumento] = useState("pendente");
    const [mensagem, setMensagem] = useState(null);
    const [salvando, setSalvando] = useState(false);

    function limparFormulario() {
        setNomeServico("");
        setCategoria("");
        setPreco("");
        setDescricao("");
        setStatusServico("ativo");
        setStatusDocumento("pendente");
    }

    async function salvar(e) {
        e.preventDefault();
        setMensagem(null);

        if (!nomeServico.trim() || !preco.trim() || !categoria.trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Preencha nome, valor e categoria antes de salvar."
            });
            return;
        }

        const dadosServico = {
            nomeServico,
            categoria,
            preco: String(preco).replace(",", "."),
            descricao,
            statusServico,
            statusDocumento
        };

        setSalvando(true);

        try {
            const resposta = await fetch(`${API}/servicos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(dadosServico)
            });

            if (!resposta.ok) {
                const dados = await resposta.json();
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel salvar o servico. Confira os dados e tente novamente."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: "Servico cadastrado com sucesso."
            });
            limparFormulario();
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor. Tente novamente em instantes."
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className={css.container}>
            <div className={css.cabecalho}>
                <h1 className={css.titulo}>Cadastro de Servicos</h1>
                <p className={css.subtitulo}>Preencha as informacoes para registrar um novo servico.</p>
            </div>

            <form className={css.formulario} onSubmit={salvar}>
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

                <div className={css.gridSimples}>
                    <div className={css.linhaStatus}>
                        <label className={css.campo}>
                            <span>Status do servico</span>
                            <select
                                className={css.select}
                                value={statusServico}
                                onChange={(e) => setStatusServico(e.target.value)}
                            >
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </label>

                        <label className={css.campo}>
                            <span>Documentacao</span>
                            <select
                                className={css.select}
                                value={statusDocumento}
                                onChange={(e) => setStatusDocumento(e.target.value)}
                            >
                                <option value="pendente">Pendente</option>
                                <option value="regular">Ok</option>
                            </select>
                        </label>
                    </div>

                    <Input
                        label="Nome do Servico"
                        value={nomeServico}
                        onChange={(e) => setNomeServico(e.target.value)}
                        placeholder="Ex: Revisao completa"
                        required={true}
                    />

                    <div className={css.duplo}>
                        <label className={css.campo}>
                            <span>Categoria do servico</span>
                            <select
                                className={css.select}
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                                required
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="mecanica">Mecanica</option>
                                <option value="eletrica">Eletrica</option>
                                <option value="estetica">Estetica</option>
                                <option value="revisao">Revisao</option>
                            </select>
                        </label>

                        <Input
                            label="Valor"
                            as={IMaskInput}
                            mask={Number}
                            scale={2}
                            thousandsSeparator="."
                            radix=","
                            mapToRadix={["."]}
                            normalizeZeros={true}
                            padFractionalZeros={true}
                            unmask={true}
                            value={String(preco)}
                            onAccept={(valor) => setPreco(String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                            required={true}
                        />
                    </div>

                    <label className={css.campo}>
                        <span>Descricao</span>
                        <textarea
                            className={css.descricao}
                            placeholder="Descreva o que esta incluso nesse servico..."
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </label>

                    <div className={css.documento}>
                        <button type="button" className={css.anexar}>
                            Anexar documento
                        </button>
                    </div>
                </div>

                <div className={css.botoes}>
                    <button type="button" className={css.cancelar} onClick={limparFormulario}>
                        Limpar
                    </button>
                    <button type="submit" className={css.salvar} disabled={salvando}>
                        {salvando ? "Salvando..." : "Salvar Servico"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CadastroServicos;
