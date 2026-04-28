import css from "./CadastroServicos.module.css";
import Input from "../components/Input/Input.jsx";
import { useState } from "react";

function CadastroServicos({ API }) {
    const [nomeServico, setNomeServico] = useState("");
    const [categoria, setCategoria] = useState("");
    const [preco, setPreco] = useState("");
    const [descricao, setDescricao] = useState("");
    const [statusServico, setStatusServico] = useState("ativo");
    const [statusDocumento, setStatusDocumento] = useState("pendente");
    const [erro, setErro] = useState("");

    async function salvar(e) {
        e.preventDefault();

        if (!nomeServico || !preco || !categoria) {
            setErro("Preencha os campos obrigatórios (Nome, Preço e Categoria).");
            return;
        }

        const dadosServico = {
            nomeServico,
            categoria,
            preco,
            descricao,
            statusServico,
            statusDocumento
        };

        try {
            const resposta = await fetch(`${API}/servicos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosServico)
            });

            if (!resposta.ok) {
                const dados = await resposta.json();
                setErro(dados.erro || "Erro ao salvar serviço.");
                return;
            }

            alert("Serviço cadastrado com sucesso!");
            setErro("");
        } catch (err) {
            setErro("Erro de conexão com o servidor.");
        }
    }

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>Cadastro de Serviços</h1>

            <form className={css.formulario} onSubmit={salvar}>

                {erro && <div className={css.erro}>{erro}</div>}

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
                            Anexar Documento
                        </button>
                    </div>
                </div>

                <div className={css.botoes}>
                    <button type="submit" className={css.salvar}>Salvar Serviço</button>
                    <button type="button" className={css.cancelar}>Cancelar</button>
                </div>
            </form>
        </main>
    );
}

export default CadastroServicos;