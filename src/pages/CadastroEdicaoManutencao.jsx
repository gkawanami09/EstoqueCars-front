// Importa o CSS reaproveitado da tela de manutencao.
import css from "./CadastroManutencao.module.css";
// Importa o componente de input padronizado do projeto.
import Input from "../components/Input/Input.jsx";
// Importa hooks para controlar estado e carregar dados.
import { useEffect, useState } from "react";

// Componente da tela de edicao de manutencao.
function EdicaoManutencao({ API, id }) {
    // Guarda o veiculo da manutencao.
    const [veiculo, setVeiculo] = useState("");
    // Guarda os servicos disponiveis vindos da API.
    const [servicos, setServicos] = useState([]);
    // Guarda os servicos que fazem parte da manutencao editada.
    const [servicosSelecionados, setServicosSelecionados] = useState([]);

    // Guarda a descricao/lista de itens.
    const [itens, setItens] = useState("");
    // Guarda a data e hora da manutencao.
    const [dataHora, setDataHora] = useState("");
    // Guarda observacoes extras.
    const [observacoes, setObservacoes] = useState("");
    // Guarda o total calculado/retornado pela API.
    const [total, setTotal] = useState("");

    // Guarda erros simples do formulario.
    const [erro, setErro] = useState("");
    // Guarda mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);

    // Carrega os servicos quando a tela abre.
    useEffect(() => {
        // Funcao interna que chama a API.
        async function carregarServicos() {
            // Busca todos os servicos disponiveis.
            const res = await fetch(`${API}/servicos`);
            // Converte resposta para JSON.
            const dados = await res.json();
            // Salva os servicos no estado.
            setServicos(dados);
        }

        // Executa o carregamento.
        carregarServicos();
    }, [API]);

    // Carrega a manutencao que sera editada.
    useEffect(() => {
        // Funcao interna que busca a manutencao pelo id.
        async function carregarManutencao() {
            // Chama a API usando o id recebido.
            const res = await fetch(`${API}/manutencoes/${id}`);
            // Converte a resposta em JSON.
            const dados = await res.json();

            // Preenche o campo veiculo.
            setVeiculo(dados.veiculo);
            // Preenche o campo de itens.
            setItens(dados.itens);
            // Preenche data e hora.
            setDataHora(dados.dataHora);
            // Preenche observacoes.
            setObservacoes(dados.observacoes);
            // Preenche total.
            setTotal(dados.total);
            // Preenche a lista de servicos ja vinculados.
            setServicosSelecionados(dados.servicos);
        }

        // So busca se existir id.
        if (id) {
            carregarManutencao();
        }
    }, [API, id]);

    // Adiciona uma linha de servico vazia.
    function adicionarServico() {
        setServicosSelecionados([
            ...servicosSelecionados,
            { servicoId: "", quantidade: "", valorUnitario: "" }
        ]);
    }

    // Remove um servico pelo indice da lista.
    function removerServico(index) {
        // Cria uma lista sem o item removido.
        const lista = servicosSelecionados.filter((_, i) => i !== index);
        // Atualiza a tela com a nova lista.
        setServicosSelecionados(lista);
    }

    // Altera um campo de um servico selecionado.
    async function alterarServico(index, campo, valor) {
        // Copia a lista atual para nao alterar o estado direto.
        const lista = [...servicosSelecionados];
        // Atualiza o campo escolhido.
        lista[index][campo] = valor;

        // Se o usuario escolheu um servico, busca o valor dele.
        if (campo === "servicoId" && valor) {
            // Busca o servico escolhido na API.
            const res = await fetch(`${API}/servicos/${valor}`);
            // Converte a resposta em JSON.
            const dados = await res.json();
            // Coloca o valor unitario na linha.
            lista[index].valorUnitario = dados.valor;
        }

        // Salva a lista atualizada no estado.
        setServicosSelecionados(lista);
    }

    // Salva a manutencao editada.
    async function salvar(e) {
        // Impede refresh da pagina.
        e.preventDefault();
        // Limpa erro antigo.
        setErro("");
        // Limpa mensagem antiga.
        setMensagem(null);

        // Valida campos obrigatorios.
        if (!veiculo || servicosSelecionados.length === 0) {
            setErro("Preencha os campos obrigatorios.");
            return;
        }

        // Monta o corpo enviado para a API.
        const dados = {
            veiculo,
            servicos: servicosSelecionados,
            itens,
            dataHora,
            observacoes
        };

        // Envia a edicao para a API.
        const resposta = await fetch(`${API}/manutencoes/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        // Le o retorno da API.
        const res = await resposta.json();

        // Se a API retornar erro, mostra o erro e para.
        if (!resposta.ok) {
            setErro(res.erro || "Erro ao atualizar.");
            return;
        }

        // Atualiza o total com o valor retornado.
        setTotal(res.total);

        // Mostra mensagem de sucesso.
        setMensagem({
            tipo: "sucesso",
            texto: "Manutencao atualizada com sucesso!"
        });
    }

    // Renderiza a tela de edicao.
    return (
        // Container principal da pagina.
        <main className={css.container}>
            {/* Titulo da pagina. */}
            <h1 className={css.titulo}>Editar Manutencao</h1>

            {/* Alerta visual de mensagem. */}
            {mensagem && (
                <div
                    className={`${css.mensagem} ${
                        mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                    }`}
                    role="alert"
                >
                    <div>
                        <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atencao"}</strong>
                        <span>{mensagem.texto}</span>
                    </div>
                    <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                        x
                    </button>
                </div>
            )}

            {/* Formulario que salva a edicao. */}
            <form className={css.formulario} onSubmit={salvar}>
                <div className={css.grid}>
                    {/* Lado esquerdo com campos editaveis. */}
                    <div className={css.esquerda}>
                        {/* Campo do veiculo. */}
                        <Input
                            label="Veiculo"
                            value={veiculo}
                            onChange={(e) => setVeiculo(e.target.value)}
                        />

                        {/* Lista de servicos vinculados. */}
                        {servicosSelecionados.map((item, index) => (
                            <div key={index} className={css.blocoServico}>
                                {/* Select para escolher o servico. */}
                                <select
                                    className={css.select}
                                    value={item.servicoId}
                                    onChange={(e) =>
                                        alterarServico(index, "servicoId", e.target.value)
                                    }
                                >
                                    <option value="">Selecione um servico</option>
                                    {servicos.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.nome}
                                        </option>
                                    ))}
                                </select>

                                {/* Campos de quantidade e valor unitario. */}
                                <div className={css.duplo}>
                                    <Input
                                        label="Quantidade"
                                        value={item.quantidade}
                                        onChange={(e) =>
                                            alterarServico(index, "quantidade", e.target.value)
                                        }
                                    />

                                    <Input
                                        label="Valor Unitario"
                                        value={item.valorUnitario}
                                        readOnly
                                    />
                                </div>

                                {/* Botao que remove essa linha de servico. */}
                                <button
                                    type="button"
                                    className={css.remover}
                                    onClick={() => removerServico(index)}
                                >
                                    Remover
                                </button>
                            </div>
                        ))}

                        {/* Botao que adiciona mais um servico. */}
                        <button
                            type="button"
                            className={css.adicionar}
                            onClick={adicionarServico}
                        >
                            + Adicionar Servico
                        </button>

                        {/* Campo de itens/descricao. */}
                        <textarea
                            className={css.descricao}
                            value={itens}
                            onChange={(e) => setItens(e.target.value)}
                        />

                        {/* Campo de data e hora. */}
                        <Input
                            label="Data e Hora"
                            type="datetime-local"
                            value={dataHora}
                            onChange={(e) => setDataHora(e.target.value)}
                        />
                    </div>

                    {/* Lado direito com resumo. */}
                    <div className={css.direita}>
                        <div className={css.boxResumo}>
                            <p><strong>Total</strong></p>
                            <p>R$ {total || "0,00"}</p>
                        </div>
                    </div>
                </div>

                {/* Campo de observacoes. */}
                <textarea
                    className={css.observacoes}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                />

                {/* Erro simples do formulario. */}
                {erro && <p className={css.erro}>{erro}</p>}

                {/* Botoes finais. */}
                <div className={css.botoes}>
                    <button type="submit" className={css.salvar}>Salvar</button>
                    <button type="button" className={css.cancelar}>Cancelar</button>
                </div>
            </form>
        </main>
    );
}

// Exporta a pagina para usar nas rotas.
export default EdicaoManutencao;
