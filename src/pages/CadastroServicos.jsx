import css from "./CadastroServicos.module.css";
import Input from "../components/Input/Input.jsx";
import { useCallback, useEffect, useState } from "react";
import { IMaskInput } from "react-imask";

const FORMULARIO_INICIAL = {
    nome_servico: "",
    valor: ""
};

const FILTROS_INICIAIS = {
    descricao: "",
    id_servico: "",
    valor_unitario: ""
};

const REAJUSTE_INICIAL = {
    porcentagem: "",
    id_servico: ""
};

const MASCARA_VALOR = {
    as: IMaskInput,
    mask: Number,
    scale: 2,
    thousandsSeparator: ".",
    radix: ",",
    mapToRadix: ["."],
    normalizeZeros: true,
    padFractionalZeros: true,
    unmask: true
};

const MASCARA_PORCENTAGEM = {
    as: IMaskInput,
    mask: Number,
    scale: 2,
    radix: ",",
    mapToRadix: ["."],
    normalizeZeros: true,
    unmask: true
};

function criarHeadersJson() {
    const token = localStorage.getItem("access_token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

function criarHeadersAutenticados() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizarValor(valor) {
    const texto = String(valor ?? "").trim();

    if (!texto) {
        return "";
    }

    const somenteNumero = texto.replace(/[^\d,.-]/g, "");

    if (somenteNumero.includes(",") && somenteNumero.includes(".")) {
        return somenteNumero.replace(/\./g, "").replace(",", ".");
    }

    return somenteNumero.replace(",", ".");
}

function valorPositivo(valor) {
    const numero = Number(normalizarValor(valor));
    return Number.isFinite(numero) && numero > 0;
}

function normalizarServico(servico) {
    const id = servico.id_servico ?? servico.ID_SERVICO ?? servico.id;
    const nome = servico.descricao ?? servico.nome_servico ?? servico.NOME_SERVICO ?? servico.nome ?? "";
    const valor = servico.valor_unitario ?? servico.valor ?? servico.VALOR ?? 0;
    const porcentagem = servico.valor_porcentagem ?? servico.porcentagem ?? 0;

    return {
        id_servico: id,
        descricao: nome,
        valor_unitario: valor,
        valor_porcentagem: porcentagem
    };
}

function ordenarServicosPorId(lista) {
    return [...lista].sort((servicoA, servicoB) => Number(servicoA.id_servico) - Number(servicoB.id_servico));
}

async function lerResposta(resposta) {
    const texto = await resposta.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch {
        return {};
    }
}

function obterMensagemErro(dados, fallback) {
    return dados.erro || dados.mensagem || fallback;
}

function montarPayloadBusca(filtrosBusca) {
    const payload = {};

    if (String(filtrosBusca.descricao).trim()) {
        payload.descricao = filtrosBusca.descricao.trim();
    }

    if (String(filtrosBusca.id_servico).trim()) {
        payload.id_servico = Number(filtrosBusca.id_servico);
    }

    if (String(filtrosBusca.valor_unitario).trim()) {
        payload.valor_unitario = normalizarValor(filtrosBusca.valor_unitario);
    }

    return payload;
}

function formatarMoeda(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "R$ 0,00";
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(numero);
}

function CadastroServicos({ API }) {
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [reajuste, setReajuste] = useState(REAJUSTE_INICIAL);
    const [servicos, setServicos] = useState([]);
    const [mensagem, setMensagem] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [reajustando, setReajustando] = useState(false);
    const [excluindoId, setExcluindoId] = useState(null);
    const [editandoId, setEditandoId] = useState(null);
    const [edicao, setEdicao] = useState(FORMULARIO_INICIAL);
    const [confirmacao, setConfirmacao] = useState(null);

    const exibirMensagem = useCallback((tipo, texto) => {
        setMensagem({ tipo, texto });
    }, []);

    const buscarServicos = useCallback(async (filtrosBusca = FILTROS_INICIAIS, mostrarMensagem = true) => {
        setCarregando(true);
        if (mostrarMensagem) {
            setMensagem(null);
        }

        try {
            const resposta = await fetch(`${API}/buscar_servico`, {
                method: "POST",
                headers: criarHeadersJson(),
                credentials: "include",
                body: JSON.stringify(montarPayloadBusca(filtrosBusca))
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                setServicos([]);
                if (mostrarMensagem || resposta.status !== 404) {
                    exibirMensagem("erro", obterMensagemErro(dados, "Servico nao encontrado."));
                }
                return;
            }

            const lista = Array.isArray(dados.servicos)
                ? ordenarServicosPorId(dados.servicos.map(normalizarServico))
                : [];
            setServicos(lista);

            if (mostrarMensagem) {
                exibirMensagem("sucesso", `${lista.length} servico(s) encontrado(s).`);
            }
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para buscar os servicos.");
        } finally {
            setCarregando(false);
        }
    }, [API, exibirMensagem]);

    useEffect(() => {
        buscarServicos(FILTROS_INICIAIS, false);
    }, [buscarServicos]);

    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
    }

    function atualizarFiltro(campo, valor) {
        setFiltros((atual) => ({ ...atual, [campo]: valor }));
    }

    function atualizarReajuste(campo, valor) {
        setReajuste((atual) => ({ ...atual, [campo]: valor }));
    }

    function limparFormulario() {
        setFormulario(FORMULARIO_INICIAL);
    }

    async function salvar(e) {
        e.preventDefault();
        setMensagem(null);

        if (!formulario.nome_servico.trim() || !String(formulario.valor).trim()) {
            exibirMensagem("erro", "O nome do servico e o valor sao obrigatorios.");
            return;
        }

        if (!valorPositivo(formulario.valor)) {
            exibirMensagem("erro", "O valor do servico deve ser maior que zero.");
            return;
        }

        const formData = new FormData();
        formData.append("nome_servico", formulario.nome_servico.trim());
        formData.append("valor", normalizarValor(formulario.valor));

        setSalvando(true);

        try {
            const resposta = await fetch(`${API}/cadastrar_servico`, {
                method: "POST",
                headers: criarHeadersAutenticados(),
                credentials: "include",
                body: formData
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel cadastrar o servico."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servico cadastrado com sucesso.");
            limparFormulario();
            buscarServicos(FILTROS_INICIAIS, false);
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para cadastrar o servico.");
        } finally {
            setSalvando(false);
        }
    }

    function iniciarEdicao(servico) {
        setEditandoId(servico.id_servico);
        setEdicao({
            nome_servico: servico.descricao || "",
            valor: String(servico.valor_unitario ?? "")
        });
        setMensagem(null);
    }

    function cancelarEdicao() {
        setEditandoId(null);
        setEdicao(FORMULARIO_INICIAL);
    }

    async function atualizarServico(e) {
        e.preventDefault();

        if (!editandoId) {
            return;
        }

        if (!edicao.nome_servico.trim() || !String(edicao.valor).trim()) {
            exibirMensagem("erro", "Por favor, adicione todos os campos.");
            return;
        }

        if (!valorPositivo(edicao.valor)) {
            exibirMensagem("erro", "O valor do servico deve ser maior que zero.");
            return;
        }

        const formData = new FormData();
        formData.append("nome_servico", edicao.nome_servico.trim());
        formData.append("valor", normalizarValor(edicao.valor));
        setSalvando(true);

        try {
            const resposta = await fetch(`${API}/atualizar_servico/${editandoId}`, {
                method: "PUT",
                headers: criarHeadersAutenticados(),
                credentials: "include",
                body: formData
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel atualizar o servico."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servico atualizado com sucesso.");
            cancelarEdicao();
            buscarServicos(filtros, false);
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para atualizar o servico.");
        } finally {
            setSalvando(false);
        }
    }

    function pedirConfirmacaoExclusao(servico) {
        setConfirmacao(servico);
    }

    function cancelarConfirmacao() {
        setConfirmacao(null);
    }

    async function deletarServico(servico) {
        setExcluindoId(servico.id_servico);
        setConfirmacao(null);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/deletar_servico/${servico.id_servico}`, {
                method: "DELETE",
                headers: criarHeadersAutenticados(),
                credentials: "include"
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel deletar o servico."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servico deletado com sucesso.");
            setServicos((listaAtual) => listaAtual.filter((item) => item.id_servico !== servico.id_servico));
            if (editandoId === servico.id_servico) {
                cancelarEdicao();
            }
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para deletar o servico.");
        } finally {
            setExcluindoId(null);
        }
    }

    async function reajustarServicos(e) {
        e.preventDefault();
        setMensagem(null);

        if (!String(reajuste.porcentagem).trim()) {
            exibirMensagem("erro", "A porcentagem de reajuste e obrigatoria.");
            return;
        }

        if (!valorPositivo(reajuste.porcentagem)) {
            exibirMensagem("erro", "A porcentagem deve ser maior que zero.");
            return;
        }

        const payload = {
            porcentagem: normalizarValor(reajuste.porcentagem)
        };

        if (String(reajuste.id_servico).trim()) {
            payload.id_servico = Number(reajuste.id_servico);
        }

        setReajustando(true);

        try {
            const resposta = await fetch(`${API}/reajustar_servicos`, {
                method: "PUT",
                headers: criarHeadersJson(),
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const dados = await lerResposta(resposta);

            if (!resposta.ok || dados.erro) {
                exibirMensagem("erro", obterMensagemErro(dados, "Nao foi possivel reajustar os servicos."));
                return;
            }

            exibirMensagem("sucesso", dados.mensagem || "Servicos reajustados com sucesso.");
            setReajuste(REAJUSTE_INICIAL);
            buscarServicos(filtros, false);
        } catch {
            exibirMensagem("erro", "Nao foi possivel conectar ao servidor para reajustar os servicos.");
        } finally {
            setReajustando(false);
        }
    }

    function limparFiltros() {
        setFiltros(FILTROS_INICIAIS);
        buscarServicos(FILTROS_INICIAIS, false);
    }

    return (
        <main className={css.container}>
            <div className={css.cabecalho}>
                <h1 className={css.titulo}>Cadastro de Serviços</h1>
                <p className={css.subtitulo}>Cadastre, consulte, edite, exclua e reajuste os serviços da oficina.</p>
            </div>

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

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Novo serviço</h2>
                        <p>Informe o nome e o valor do serviço.</p>
                    </div>
                </div>

                <form className={css.formularioInterno} onSubmit={salvar}>
                    <div className={css.duplo}>
                        <Input
                            label="Nome do Serviço"
                            value={formulario.nome_servico}
                            onChange={(e) => atualizarCampo("nome_servico", e.target.value)}
                            placeholder="Ex: Revisao completa"
                            required
                        />

                        <Input
                            label="Valor"
                            {...MASCARA_VALOR}
                            value={formulario.valor}
                            onAccept={(valor) => atualizarCampo("valor", String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                            required
                        />
                    </div> 

                    <div className={css.botoes}>
                        <button type="button" className={css.cancelar} onClick={limparFormulario}>
                            Limpar
                        </button>
                        <button type="submit" className={css.salvar} disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar Serviço"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Buscar serviços</h2>
                        <p>Pesquise por nome do serviço ou valor unitário.</p>
                    </div>
                </div>

                <form className={css.formularioInterno} onSubmit={(e) => {
                    e.preventDefault();
                    buscarServicos(filtros);
                }}>
                    <div className={css.filtros}>
                        <Input
                            label="Descricao"
                            value={filtros.descricao}
                            onChange={(e) => atualizarFiltro("descricao", e.target.value)}
                            placeholder="Ex: alinhamento"
                        />

                        <label className={css.campo}>
                            <span>Serviço</span>
                            <select
                                className={css.select}
                                value={filtros.id_servico}
                                onChange={(e) => atualizarFiltro("id_servico", e.target.value)}
                            >
                                <option value="">Todos os serviços</option>
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <Input
                            label="Valor unitário"
                            {...MASCARA_VALOR}
                            value={filtros.valor_unitario}
                            onAccept={(valor) => atualizarFiltro("valor_unitario", String(valor))}
                            placeholder="0,00"
                            inputMode="decimal"
                        />
                    </div> 

                    <div className={css.botoes}>
                        <button type="button" className={css.cancelar} onClick={limparFiltros}>
                            Limpar busca
                        </button>
                        <button type="submit" className={css.salvar} disabled={carregando}>
                            {carregando ? "Buscando..." : "Buscar"}
                        </button>
                    </div>
                </form>
            </section>

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Reajustar valores</h2>
                        <p>Informe apenas a porcentagem para reajustar todos, ou escolha um serviço específico.</p>
                    </div>
                </div> 

                <form className={css.formularioInterno} onSubmit={reajustarServicos}>
                    <div className={css.duplo}>
                        <Input
                            label="Porcentagem"
                            {...MASCARA_PORCENTAGEM}
                            value={reajuste.porcentagem}
                            onAccept={(valor) => atualizarReajuste("porcentagem", String(valor))}
                            placeholder="Ex: 10"
                            inputMode="decimal"
                            required
                        />

                        <label className={css.campo}>
                            <span>Serviço especifico</span>
                            <select
                                className={css.select}
                                value={reajuste.id_servico}
                                onChange={(e) => atualizarReajuste("id_servico", e.target.value)}
                            >
                                <option value="">Todos os serviços</option>
                                {servicos.map((servico) => (
                                    <option key={servico.id_servico} value={servico.id_servico}>
                                        {servico.descricao}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className={css.botoes}>
                        <button type="submit" className={css.salvar} disabled={reajustando}>
                            {reajustando ? "Reajustando..." : "Aplicar reajuste"}
                        </button>
                    </div>
                </form>
            </section>

            {editandoId && (
                <section className={css.painel}>
                    <div className={css.painelCabecalho}>
                        <div>
                            <h2 className={css.painelTitulo}>Editar serviço #{editandoId}</h2>
                            <p>Atualize as informações do serviço selecionado.</p>
                        </div>
                    </div>

                    <form className={css.formularioInterno} onSubmit={atualizarServico}>
                        <div className={css.duplo}>
                            <Input
                                label="Nome do Serviço"
                                value={edicao.nome_servico}
                                onChange={(e) => setEdicao((atual) => ({ ...atual, nome_servico: e.target.value }))}
                                required
                            />

                            <Input
                                label="Valor"
                                {...MASCARA_VALOR}
                                value={edicao.valor}
                                onAccept={(valor) => setEdicao((atual) => ({ ...atual, valor: String(valor) }))}
                                inputMode="decimal"
                                required
                            />
                        </div>

                        <div className={css.botoes}>
                            <button type="button" className={css.cancelar} onClick={cancelarEdicao}>
                                Cancelar
                            </button>
                            <button type="submit" className={css.salvar} disabled={salvando}>
                                {salvando ? "Atualizando..." : "Salvar alterações"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className={css.painel}>
                <div className={css.painelCabecalho}>
                    <div>
                        <h2 className={css.painelTitulo}>Serviços cadastrados</h2>
                        <p>{servicos.length} registro(s) carregado(s).</p>
                    </div>
                    <button type="button" className={css.botaoSecundario} onClick={() => buscarServicos(FILTROS_INICIAIS)}>
                        Atualizar lista
                    </button>
                </div>

                <div className={css.tabelaArea}>
                    {servicos.length > 0 ? (
                        <table className={css.tabela}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Serviço</th>
                                    <th>Valor</th>
                                    <th>Reajuste</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicos.map((servico) => (
                                    <tr key={servico.id_servico}>
                                        <td>{servico.id_servico}</td>
                                        <td>{servico.descricao}</td>
                                        <td>{formatarMoeda(servico.valor_unitario)}</td>
                                        <td>{Number(servico.valor_porcentagem || 0).toFixed(2)}%</td>
                                        <td>
                                            <div className={css.acoesLinha}>
                                                <button type="button" onClick={() => iniciarEdicao(servico)}>
                                                    Editar
                                                </button>
                                                <button
                                                    type="button"
                                                    className={css.botaoPerigo}
                                                    onClick={() => pedirConfirmacaoExclusao(servico)}
                                                    disabled={excluindoId === servico.id_servico}
                                                >
                                                    {excluindoId === servico.id_servico ? "Excluindo..." : "Excluir"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className={css.vazio}>
                            {carregando ? "Carregando serviços..." : "Nenhum serviço encontrado."}
                        </div>
                    )}
                </div>
            </section>

            {confirmacao && (
                <div className={css.modalFundo} role="presentation" onClick={cancelarConfirmacao}>
                    <div
                        className={css.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-confirmacao"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={css.modalIcone}>!</div>
                        <div>
                            <h2 id="titulo-confirmacao" className={css.modalTitulo}>
                                Excluir serviço
                            </h2>
                            <p className={css.modalTexto}>
                                Deseja deletar o servico <strong>{confirmacao.descricao}</strong>?
                            </p>
                        </div>

                        <div className={css.modalAcoes}>
                            <button type="button" className={css.modalCancelar} onClick={cancelarConfirmacao}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={css.modalConfirmar}
                                onClick={() => deletarServico(confirmacao)}
                                disabled={excluindoId === confirmacao.id_servico}
                            >
                                {excluindoId === confirmacao.id_servico ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default CadastroServicos;
