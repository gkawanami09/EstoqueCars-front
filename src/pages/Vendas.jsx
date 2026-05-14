import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Vendas.module.css";

const formasPagamento = [
    { id: "0", nome: "Pix" },
    { id: "1", nome: "Parcelamento" }
];
const statusPagamento = [
    { id: "0", nome: "Pago" },
    { id: "1", nome: "Em andamento" }
];
const situacaoParcelamento = {
    emAndamento: "1"
};
const CHAVE_CONFIG_JUROS = "config_taxa_juros_empresa";
const configJurosPadrao = {
    taxaMensal: "2.5",
    tipoJuros: "composto"
};

function numeroDoCampo(valor) {
    return Number(String(valor || "0").replace(",", ".")) || 0;
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2
    });
}

function formatarQuilometragem(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return valor || "-";
    }

    return `${numero.toLocaleString("pt-BR")} km`;
}

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function extrairListaUsuarios(dados) {
    const lista = Array.isArray(dados) ? dados : dados?.usuarios || dados?.clientes || [];
    const clientes = lista.filter((usuario) => Number(usuario.tipo_usuario) === 0);

    if (clientes.length > 0) {
        return clientes;
    }

    return lista.filter((usuario) => Number(usuario.tipo_usuario) !== 2);
}

function formatarDataParaApi(data) {
    if (!data) {
        return "";
    }

    const [dataCampo, horaCampo = "00:00"] = data.split("T");
    const [ano, mes, dia] = dataCampo.split("-");

    if (!ano || !mes || !dia) {
        return data;
    }

    return `${dia}/${mes}/${ano} ${horaCampo}`;
}

function idVeiculo(veiculo) {
    return veiculo?.id || veiculo?.id_veiculo || veiculo?.id_carro;
}

function statusEstoqueVeiculo(veiculo) {
    return String(
        veiculo?.status_estoque ??
        veiculo?.STATUS_ESTOQUE ??
        veiculo?.statusEstoque ??
        ""
    );
}

function veiculoDisponivel(veiculo) {
    const status = statusEstoqueVeiculo(veiculo).toLowerCase();

    return status === "1" || status.includes("dispon");
}

function nomeVeiculo(veiculo) {
    return veiculo?.nome || [veiculo?.marca, veiculo?.modelo].filter(Boolean).join(" ") || "Veiculo";
}

function montarUrlImagem(API, veiculo) {
    const imagem = veiculo?.imagem || veiculo?.foto || veiculo?.foto_veiculo;

    if (!imagem) {
        return "/IconCar.png";
    }

    if (String(imagem).startsWith("http")) {
        return imagem;
    }

    if (String(imagem).startsWith("/")) {
        return `${API}${imagem}`;
    }

    return `${API}/${imagem}`;
}

function calcularValorParcela(valor, parcelas, juros) {
    if (!valor || !parcelas) {
        return 0;
    }

    return valor * juros / (1 - (1 + juros) ** -parcelas);
}

function carregarConfigJuros() {
    const salvo = localStorage.getItem(CHAVE_CONFIG_JUROS);

    if (!salvo) {
        return configJurosPadrao;
    }

    try {
        return {
            ...configJurosPadrao,
            ...JSON.parse(salvo)
        };
    } catch {
        return configJurosPadrao;
    }
}

function calcularParcelaComConfiguracao(valor, parcelas, configuracaoJuros) {
    const taxa = numeroDoCampo(configuracaoJuros.taxaMensal) / 100;

    if (!valor || !parcelas) {
        return 0;
    }

    if (!taxa) {
        return valor / parcelas;
    }

    if (configuracaoJuros.tipoJuros === "simples") {
        return (valor * (1 + taxa * parcelas)) / parcelas;
    }

    return calcularValorParcela(valor, parcelas, taxa);
}

function Vendas({ API }) {
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [carregandoClientes, setCarregandoClientes] = useState(true);
    const [erroClientes, setErroClientes] = useState("");
    const [veiculos, setVeiculos] = useState([]);
    const [carregandoVeiculos, setCarregandoVeiculos] = useState(true);
    const [erroVeiculos, setErroVeiculos] = useState("");
    const [clienteId, setClienteId] = useState("");
    const [veiculoId, setVeiculoId] = useState("");
    const [formaPagamento, setFormaPagamento] = useState(formasPagamento[0].id);
    const [dataVenda, setDataVenda] = useState("");
    const [valorVenda, setValorVenda] = useState("");
    const [valorRecebido, setValorRecebido] = useState("");
    const [status, setStatus] = useState(statusPagamento[0].id);
    const [comentarios, setComentarios] = useState("");
    const [desconto, setDesconto] = useState("");
    const [comprovante, setComprovante] = useState(null);
    const [chavePix, setChavePix] = useState("");
    const [transacaoPix, setTransacaoPix] = useState("");
    const [parcelasFinanciamento, setParcelasFinanciamento] = useState(48);
    const [configuracaoJuros, setConfiguracaoJuros] = useState(() => carregarConfigJuros());
    const [modalParcelasAberto, setModalParcelasAberto] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    const ehParcelamento = formaPagamento === "1";
    const ehPix = formaPagamento === "0";

    useEffect(() => {
        function atualizarJuros() {
            setConfiguracaoJuros(carregarConfigJuros());
        }

        window.addEventListener("storage", atualizarJuros);

        return () => {
            window.removeEventListener("storage", atualizarJuros);
        };
    }, []);

    const carregarClientes = useCallback(async () => {
        setCarregandoClientes(true);
        setErroClientes("");

        try {
            const resposta = await fetch(`${API}/listar_usuario`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroClientes(dados.erro || dados.mensagem || "Erro ao carregar clientes.");
                setClientes([]);
                return;
            }

            const lista = extrairListaUsuarios(dados);
            setClientes(lista);

            if (lista.length > 0) {
                setClienteId(String(lista[0].id_usuario || lista[0].id || ""));
            }
        } catch {
            setErroClientes("Erro de conexao com o servidor.");
            setClientes([]);
        } finally {
            setCarregandoClientes(false);
        }
    }, [API]);

    const carregarVeiculos = useCallback(async () => {
        setCarregandoVeiculos(true);
        setErroVeiculos("");

        try {
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErroVeiculos(dados.erro || "Erro ao carregar veiculos.");
                setVeiculos([]);
                return;
            }

            const lista = dados.carros || [];
            const disponiveis = lista.filter(veiculoDisponivel);
            setVeiculos(disponiveis);

            if (disponiveis.length > 0) {
                const primeiro = disponiveis[0];
                setVeiculoId(String(idVeiculo(primeiro)));
                setValorVenda(String(primeiro.preco || 0));
                setValorRecebido(String(primeiro.preco || 0));
            } else {
                setVeiculoId("");
                setValorVenda("");
                setValorRecebido("");
                setErroVeiculos("Nenhum veiculo disponivel para venda.");
            }
        } catch {
            setErroVeiculos("Erro de conexao com o servidor.");
            setVeiculos([]);
        } finally {
            setCarregandoVeiculos(false);
        }
    }, [API]);

    useEffect(() => {
        carregarClientes();
        carregarVeiculos();
    }, [carregarClientes, carregarVeiculos]);

    const veiculoSelecionado = useMemo(() => {
        return veiculos.find((veiculo) => String(idVeiculo(veiculo)) === veiculoId) || null;
    }, [veiculoId, veiculos]);

    const valorNumerico = numeroDoCampo(valorVenda);
    const descontoNumerico = numeroDoCampo(desconto);
    const valorComDesconto = Math.max(valorNumerico - (valorNumerico * descontoNumerico / 100), 0);
    const valorParcelado = valorComDesconto;
    const valorParcelaParcelamento = useMemo(() => {
        const parcelas = Number(parcelasFinanciamento) || 1;

        return calcularParcelaComConfiguracao(valorParcelado, parcelas, configuracaoJuros);
    }, [configuracaoJuros, parcelasFinanciamento, valorParcelado]);

    const opcoesParcelamento = useMemo(() => {
        return Array.from({ length: 120 }, (_, indice) => {
            const quantidade = indice + 1;
            const valorParcela = calcularParcelaComConfiguracao(valorParcelado, quantidade, configuracaoJuros);

            return {
                quantidade,
                valorParcela,
                total: valorParcela * quantidade
            };
        });
    }, [configuracaoJuros, valorParcelado]);

    function trocarVeiculo(e) {
        const id = e.target.value;
        const veiculo = veiculos.find((item) => String(idVeiculo(item)) === id);

        setVeiculoId(id);

        if (veiculo) {
            setValorVenda(String(veiculo.preco));
            setValorRecebido(String(veiculo.preco));
        }
    }

    function selecionarComprovante(e) {
        const arquivo = e.target.files?.[0] || null;
        setComprovante(arquivo);
    }

    function selecionarQuantidadeParcelas(quantidade) {
        setParcelasFinanciamento(quantidade);
        setModalParcelasAberto(false);
    }

    function montarFormData() {
        const formData = new FormData();

        formData.append("id_usuario", clienteId);
        formData.append("id_veiculo", veiculoId);
        formData.append("forma_pagamento", formaPagamento);
        formData.append("data_venda", formatarDataParaApi(dataVenda));
        formData.append("valor_venda", String(valorNumerico));
        formData.append("valor_recebido", String(numeroDoCampo(valorRecebido)));
        formData.append("status_pagamento", status);
        formData.append("comentarios", comentarios);
        formData.append("desconto", String(descontoNumerico));

        if (comprovante) {
            formData.append("comprovante", comprovante);
        }

        if (ehParcelamento) {
            formData.append("data_parcelamento", formatarDataParaApi(dataVenda));
            formData.append("valor_original", String(valorComDesconto.toFixed(2)));
            formData.append("valor_parcelado", String(valorParcelaParcelamento.toFixed(2)));
            formData.append("valor_total_parcelado", String((valorParcelaParcelamento * parcelasFinanciamento).toFixed(2)));
            formData.append("quantidade_parcelas", String(parcelasFinanciamento));
            formData.append("situacao_parcelamento", situacaoParcelamento.emAndamento);
            formData.append("taxa_juros", String(numeroDoCampo(configuracaoJuros.taxaMensal)));
            formData.append("tipo_juros", configuracaoJuros.tipoJuros);
        }

        return formData;
    }

    async function salvarVenda(e) {
        e.preventDefault();
        setMensagem(null);

        if (!clienteId) {
            setMensagem({ tipo: "erro", texto: "Selecione um cliente antes de salvar a venda." });
            return;
        }

        if (!veiculoSelecionado) {
            setMensagem({ tipo: "erro", texto: "Selecione um veiculo antes de salvar a venda." });
            return;
        }

        if (!dataVenda || !valorNumerico || !numeroDoCampo(valorRecebido) || !status) {
            setMensagem({ tipo: "erro", texto: "Preencha todos os campos obrigatorios da venda." });
            return;
        }

        if (descontoNumerico > 10) {
            setMensagem({ tipo: "erro", texto: "O desconto pode ser de no maximo 10%." });
            return;
        }

        setSalvando(true);

        try {
            const resposta = await fetch(`${API}/cadastrar_venda`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: montarFormData()
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || dados.error || dados.mensagem || "Erro ao cadastrar venda."
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Venda cadastrada com sucesso."
            });

            setTimeout(() => {
                navigate("/dashboardAdmVendas");
            }, 900);
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className={css.pagina}>
            <h1>Vendas</h1>

            <form className={css.card} onSubmit={salvarVenda}>
                <section className={css.coluna}>
                    <label className={css.campo}>
                        <span>Cliente</span>
                        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} disabled={carregandoClientes || clientes.length === 0}>
                            <option value="">
                                {carregandoClientes ? "Carregando clientes..." : "Selecione um cliente"}
                            </option>
                            {clientes.map((item) => (
                                <option key={item.id_usuario || item.id} value={item.id_usuario || item.id}>
                                    {item.nome || item.email || `Cliente ${item.id_usuario || item.id}`}
                                </option>
                            ))}
                        </select>
                    </label>

                    {erroClientes && <p className={css.mensagemErro}>{erroClientes}</p>}

                    <label className={css.campo}>
                        <span>Veiculo Vendido</span>
                        <select value={veiculoId} onChange={trocarVeiculo} disabled={carregandoVeiculos || veiculos.length === 0}>
                            <option value="">
                                {carregandoVeiculos ? "Carregando veiculos..." : "Selecione um veiculo"}
                            </option>
                            {veiculos.map((veiculo) => (
                                <option key={idVeiculo(veiculo)} value={idVeiculo(veiculo)}>
                                    {nomeVeiculo(veiculo)}
                                </option>
                            ))}
                        </select>
                    </label>

                    {erroVeiculos && <p className={css.mensagemErro}>{erroVeiculos}</p>}

                    {veiculoSelecionado && (
                        <article className={css.veiculoCard}>
                            <img
                                src={montarUrlImagem(API, veiculoSelecionado)}
                                alt={nomeVeiculo(veiculoSelecionado)}
                                onError={(e) => {
                                    e.currentTarget.src = "/IconCar.png";
                                }}
                            />

                            <div className={css.veiculoInfo}>
                                <p>
                                    <strong>Modelo:</strong>
                                    <span>{veiculoSelecionado.modelo || "-"}</span>
                                </p>
                                <p>
                                    <strong>Marca:</strong>
                                    <span>{veiculoSelecionado.marca || "-"}</span>
                                </p>
                                <p>
                                    <strong>Quilometragem:</strong>
                                    <span>{formatarQuilometragem(veiculoSelecionado.quilometragem)}</span>
                                </p>
                                <p>
                                    <strong>Cor:</strong>
                                    <span>{veiculoSelecionado.cor || "-"}</span>
                                </p>
                                <p>
                                    <strong>Preco de Venda:</strong>
                                    <b>{formatarMoeda(veiculoSelecionado.preco)}</b>
                                </p>
                            </div>
                        </article>
                    )}

                    <label className={`${css.campo} ${css.comentarios}`}>
                        <span>Comentarios</span>
                        <textarea
                            value={comentarios}
                            onChange={(e) => setComentarios(e.target.value)}
                            placeholder="Digite uma observacao sobre a venda..."
                        />
                    </label>
                </section>

                <section className={css.coluna}>
                    <div className={css.grupoTitulo}>Financeiro</div>

                    <label className={css.campo}>
                        <span>Forma de Pagamento</span>
                        <select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                            {formasPagamento.map((item) => (
                                <option key={item.id} value={item.id}>{item.nome}</option>
                            ))}
                        </select>
                    </label>

                    {ehParcelamento && (
                        <div className={css.financiamento}>
                            <div className={css.parcela}>
                                <span>Valor da parcela</span>
                                <strong>{formatarMoeda(valorParcelaParcelamento)}</strong>
                                <small>
                                    {parcelasFinanciamento} parcelas, total de {formatarMoeda(valorParcelaParcelamento * parcelasFinanciamento)}
                                </small>
                                <small>
                                    Juros {numeroDoCampo(configuracaoJuros.taxaMensal).toLocaleString("pt-BR")}% ao mes ({configuracaoJuros.tipoJuros})
                                </small>
                                <button type="button" className={css.verParcelas} onClick={() => setModalParcelasAberto(true)}>
                                    Ver todas as parcelas
                                </button>
                            </div>
                        </div>
                    )}

                    {ehPix && (
                        <div className={css.areaPagamento}>
                            <label className={css.campo}>
                                <span>Chave Pix</span>
                                <input
                                    type="text"
                                    value={chavePix}
                                    onChange={(e) => setChavePix(e.target.value)}
                                    placeholder="Digite a chave Pix"
                                />
                            </label>

                            <label className={css.campo}>
                                <span>ID da transacao</span>
                                <input
                                    type="text"
                                    value={transacaoPix}
                                    onChange={(e) => setTransacaoPix(e.target.value)}
                                    placeholder="Digite o codigo da transacao"
                                />
                            </label>
                        </div>
                    )}

                    <label className={`${css.campo} ${css.campoDataHora}`}>
                        <span>Data e hora</span>
                        <input type="datetime-local" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
                    </label>

                    <div className={css.linhaDupla}>
                        <div className={css.campo}>
                            <span>Comprovante/NF</span>
                            <input
                                type="file"
                                id="comprovante"
                                className={css.inputArquivo}
                                onChange={selecionarComprovante}
                            />
                            <label htmlFor="comprovante" className={css.botaoArquivo}>
                                + {comprovante?.name || "Anexar arquivo"}
                            </label>
                        </div>

                        <label className={css.campo}>
                            <span>Placa</span>
                            <input type="text" value={veiculoSelecionado?.placa || ""} readOnly />
                        </label>
                    </div>

                    <label className={css.campo}>
                        <span>Valor da Venda</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorVenda}
                            onChange={(e) => setValorVenda(e.target.value)}
                        />
                    </label>

                    <label className={css.campo}>
                        <span>Desconto (%)</span>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            value={desconto}
                            onChange={(e) => setDesconto(e.target.value)}
                            placeholder="0"
                        />
                    </label>

                    <div className={css.resumoDesconto}>
                        <span>Valor com desconto</span>
                        <strong>{formatarMoeda(valorComDesconto)}</strong>
                    </div>

                    <label className={css.campo}>
                        <span>Valor Recebido</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorRecebido}
                            onChange={(e) => setValorRecebido(e.target.value)}
                        />
                    </label>

                    <div className={css.linhaStatus}>
                        <label className={css.campo}>
                            <span>Status de Pagamento</span>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                {statusPagamento.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nome}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                </section>

                {mensagem && (
                    <p className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagemSucesso : css.mensagemErro}`}>
                        {mensagem.texto}
                    </p>
                )}

                <div className={css.acoes}>
                    <button type="submit" className={css.salvar} disabled={salvando}>
                        {salvando ? "Salvando..." : "Salvar"}
                    </button>
                    <button type="button" className={css.cancelar} onClick={() => navigate("/dashboardAdmVendas")}>
                        Cancelar
                    </button>
                </div>
            </form>

            {modalParcelasAberto && (
                <div className={css.modalFundo} role="dialog" aria-modal="true" aria-labelledby="tituloParcelamento">
                    <div className={css.modalParcelas}>
                        <div className={css.modalTopo}>
                            <h2 id="tituloParcelamento">Parcelamento</h2>
                            <button type="button" onClick={() => setModalParcelasAberto(false)} aria-label="Fechar">
                                x
                            </button>
                        </div>

                        <div className={css.modalCabecalho}>
                            <strong>Parcelas</strong>
                            <strong>Total</strong>
                        </div>

                        <div className={css.listaParcelas}>
                            {opcoesParcelamento.map((opcao) => (
                                <button
                                    type="button"
                                    key={opcao.quantidade}
                                    className={`${css.itemParcela} ${
                                        Number(parcelasFinanciamento) === opcao.quantidade ? css.itemParcelaAtivo : ""
                                    }`}
                                    onClick={() => selecionarQuantidadeParcelas(opcao.quantidade)}
                                >
                                    <span>
                                        <b>
                                            {String(opcao.quantidade).padStart(2, "0")}x de {formatarMoeda(opcao.valorParcela)}
                                        </b>
                                        <small>{numeroDoCampo(configuracaoJuros.taxaMensal).toLocaleString("pt-BR")}% ao mes</small>
                                    </span>
                                    <strong>{formatarMoeda(opcao.total)}</strong>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Vendas;
