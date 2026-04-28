import css from "./CadastroManutencao.module.css";
import Input from "../components/Input/Input.jsx";
import { useState, useEffect } from "react";

function CadastroManutencao({ API }) {

    const [veiculo, setVeiculo] = useState("");
    const [servicos, setServicos] = useState([]);
    const [servicosSelecionados, setServicosSelecionados] = useState([]);

    const [itens, setItens] = useState("");
    const [dataHora, setDataHora] = useState("");
    const [observacoes, setObservacoes] = useState("");
    const [total, setTotal] = useState("");

    const [erro, setErro] = useState("");

    // 🔹 CARREGAR SERVIÇOS
    useEffect(() => {
        async function carregarServicos() {
            const res = await fetch(`${API}/servicos`);
            const dados = await res.json();
            setServicos(dados);
        }

        carregarServicos();
    }, []);

    // 🔹 ADICIONAR SERVIÇO
    function adicionarServico() {
        setServicosSelecionados([
            ...servicosSelecionados,
            { servicoId: "", quantidade: "", valorUnitario: "" }
        ]);
    }

    // 🔹 REMOVER SERVIÇO
    function removerServico(index) {
        const lista = servicosSelecionados.filter((_, i) => i !== index);
        setServicosSelecionados(lista);
    }

    // 🔹 ALTERAR SERVIÇO
    async function alterarServico(index, campo, valor) {
        const lista = [...servicosSelecionados];
        lista[index][campo] = valor;

        // se mudou o serviço → busca valor unitário
        if (campo === "servicoId" && valor) {
            const res = await fetch(`${API}/servicos/${valor}`);
            const dados = await res.json();

            lista[index].valorUnitario = dados.valor;
        }

        setServicosSelecionados(lista);
    }

    // 🔹 SALVAR
    async function salvar(e) {
        e.preventDefault();

        if (!veiculo || servicosSelecionados.length === 0) {
            setErro("Preencha os campos obrigatórios.");
            return;
        }

        const dados = {
            veiculo,
            servicos: servicosSelecionados,
            itens,
            dataHora,
            observacoes
        };

        const resposta = await fetch(`${API}/manutencoes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const res = await resposta.json();

        if (!resposta.ok) {
            setErro(res.erro || "Erro ao salvar.");
            return;
        }

        // total vem do backend
        setTotal(res.total);

        alert("Manutenção cadastrada com sucesso!");
    }

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>Cadastro de Manutenção</h1>

            <form className={css.formulario} onSubmit={salvar}>

                <div className={css.grid}>

                    {/* ESQUERDA */}
                    <div className={css.esquerda}>

                        <Input
                            label="Veículo (Placa ou ID)"
                            value={veiculo}
                            onChange={(e) => setVeiculo(e.target.value)}
                        />

                        {/* LISTA DE SERVIÇOS */}
                        {servicosSelecionados.map((item, index) => (
                            <div key={index} className={css.blocoServico}>

                                <select
                                    className={css.select}
                                    value={item.servicoId}
                                    onChange={(e) =>
                                        alterarServico(index, "servicoId", e.target.value)
                                    }
                                >
                                    <option value="">Selecione um serviço</option>
                                    {servicos.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nome}
                                        </option>
                                    ))}
                                </select>

                                <div className={css.duplo}>
                                    <Input
                                        label="Quantidade"
                                        value={item.quantidade}
                                        onChange={(e) =>
                                            alterarServico(index, "quantidade", e.target.value)
                                        }
                                    />

                                    <Input
                                        label="Valor Unitário"
                                        value={item.valorUnitario}
                                        readOnly
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={css.remover}
                                    onClick={() => removerServico(index)}
                                >
                                    Remover
                                </button>

                            </div>
                        ))}

                        <button
                            type="button"
                            className={css.adicionar}
                            onClick={adicionarServico}
                        >
                            + Adicionar Serviço
                        </button>

                        <textarea
                            className={css.descricao}
                            placeholder="Itens (peças utilizadas)"
                            value={itens}
                            onChange={(e) => setItens(e.target.value)}
                        />

                        <Input
                            label="Data e Hora"
                            type="datetime-local"
                            value={dataHora}
                            onChange={(e) => setDataHora(e.target.value)}
                        />

                    </div>

                    {/* DIREITA */}
                    <div className={css.direita}>
                        <div className={css.boxResumo}>
                            <p><strong>Total da manutenção</strong></p>
                            <p>R$ {total || "0,00"}</p>
                        </div>
                    </div>

                </div>

                <textarea
                    className={css.observacoes}
                    placeholder="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                />

                {erro && <p className={css.erro}>{erro}</p>}

                <div className={css.botoes}>
                    <button type="submit" className={css.salvar}>Salvar</button>
                    <button type="button" className={css.cancelar}>Cancelar</button>
                </div>

            </form>
        </main>
    );
}

export default CadastroManutencao;