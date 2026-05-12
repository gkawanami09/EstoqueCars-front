import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Vendas.module.css";

const veiculos = [
    {
        id: 1,
        nome: "Hyundai HB20",
        modelo: "2025",
        marca: "Hyundai",
        quilometragem: "25.000km",
        cor: "Chumbo",
        preco: 113000,
        placa: "FFI8H29",
        imagem: "/CarHyundaiHb20.png"
    }
];

const clientes = ["Joao Silva", "Jorge Silva", "Roberto Faria", "Marcos Jose"];
const formasPagamento = ["Financiamento", "Pix"];
const statusPagamento = ["Pago", "Pendente"];

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2
    });
}

function Vendas({ API }) {
    const navigate = useNavigate();
    const [cliente, setCliente] = useState(clientes[0]);
    const [veiculoId, setVeiculoId] = useState(String(veiculos[0].id));
    const [formaPagamento, setFormaPagamento] = useState(formasPagamento[0]);
    const [dataVenda, setDataVenda] = useState("2026-03-25");
    const [valorVenda, setValorVenda] = useState(String(veiculos[0].preco));
    const [valorRecebido, setValorRecebido] = useState(String(veiculos[0].preco));
    const [status, setStatus] = useState(statusPagamento[0]);
    const [comentarios, setComentarios] = useState("");
    const [descontos, setDescontos] = useState("");
    const [arquivo, setArquivo] = useState("");
    const [chavePix, setChavePix] = useState("");
    const [transacaoPix, setTransacaoPix] = useState("");
    const [parcelasFinanciamento, setParcelasFinanciamento] = useState(48);

    const juros = 0.04;
    const ehFinanciamento = formaPagamento === "Financiamento";
    const ehPix = formaPagamento === "Pix";

    const veiculoSelecionado = useMemo(() => {
        return veiculos.find((veiculo) => String(veiculo.id) === veiculoId) || veiculos[0];
    }, [veiculoId]);

    const valorNumerico = Number(String(valorVenda).replace(",", ".")) || 0;
    const valorFinanciado = valorNumerico;
    const valorParcelaFinanciamento = useMemo(() => {
        return valorFinanciado * juros / (1 - (1 + juros) ** -parcelasFinanciamento);
    }, [juros, parcelasFinanciamento, valorFinanciado]);

    function trocarVeiculo(e) {
        const id = e.target.value;
        const veiculo = veiculos.find((item) => String(item.id) === id);

        setVeiculoId(id);

        if (veiculo) {
            setValorVenda(String(veiculo.preco));
            setValorRecebido(String(veiculo.preco));
        }
    }

    function salvarVenda(e) {
        e.preventDefault();

        const venda = {
            cliente,
            veiculo: veiculoSelecionado,
            formaPagamento,
            dataVenda,
            valorVenda: valorNumerico,
            valorRecebido: Number(String(valorRecebido).replace(",", ".")) || 0,
            status,
            comentarios,
            descontos,
            juros: ehFinanciamento ? juros : 0,
            parcelas: ehFinanciamento ? parcelasFinanciamento : 0,
            chavePix: ehPix ? chavePix : "",
            transacaoPix: ehPix ? transacaoPix : "",
            valorFinanciado: ehFinanciamento ? valorFinanciado : 0,
            valorParcelaFinanciamento: ehFinanciamento ? valorParcelaFinanciamento : 0,
            api: API
        };

        console.log("Venda pronta para enviar para API:", venda);
        navigate("/dashboardAdmVendas");
    }

    return (
        <main className={css.pagina}>
            <h1>Vendas</h1>

            <form className={css.card} onSubmit={salvarVenda}>
                <section className={css.coluna}>
                    <label className={css.campo}>
                        <span>Cliente</span>
                        <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
                            {clientes.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </label>

                    <label className={css.campo}>
                        <span>Veiculo Vendido</span>
                        <select value={veiculoId} onChange={trocarVeiculo}>
                            {veiculos.map((veiculo) => (
                                <option key={veiculo.id} value={veiculo.id}>
                                    {veiculo.nome}
                                </option>
                            ))}
                        </select>
                    </label>

                    <article className={css.veiculoCard}>
                        <img src={veiculoSelecionado.imagem} alt={veiculoSelecionado.nome} />

                        <div className={css.veiculoInfo}>
                            <p>
                                <strong>Modelo:</strong>
                                <span>{veiculoSelecionado.modelo}</span>
                            </p>
                            <p>
                                <strong>Marca:</strong>
                                <span>{veiculoSelecionado.marca}</span>
                            </p>
                            <p>
                                <strong>Quilometragem:</strong>
                                <span>{veiculoSelecionado.quilometragem}</span>
                            </p>
                            <p>
                                <strong>Cor:</strong>
                                <span>{veiculoSelecionado.cor}</span>
                            </p>
                            <p>
                                <strong>Preco de Venda:</strong>
                                <b>{formatarMoeda(veiculoSelecionado.preco)}</b>
                            </p>
                        </div>
                    </article>

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
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </label>

                    {ehFinanciamento && (
                        <div className={css.financiamento}>
                            <div className={css.areaPagamento}>
                                <label className={css.campo}>
                                    <span>Quantidade de parcelas</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={parcelasFinanciamento}
                                        onChange={(e) => setParcelasFinanciamento(Number(e.target.value) || 1)}
                                    />
                                </label>

                                <div className={css.parcela}>
                                    <span>Valor financiado</span>
                                    <strong>{formatarMoeda(valorFinanciado)}</strong>
                                    <small>
                                        {parcelasFinanciamento} parcelas de {formatarMoeda(valorParcelaFinanciamento)}
                                    </small>
                                </div>
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

                    <label className={`${css.campo} ${css.campoCurto}`}>
                        <span>Data da Venda</span>
                        <input type="date" value={dataVenda} onChange={(e) => setDataVenda(e.target.value)} />
                    </label>

                    <div className={css.linhaDupla}>
                        <div className={css.campo}>
                            <span>Comprovante/NF</span>
                            <input
                                type="file"
                                id="comprovante"
                                className={css.inputArquivo}
                                onChange={(e) => setArquivo(e.target.files?.[0]?.name || "")}
                            />
                            <label htmlFor="comprovante" className={css.botaoArquivo}>
                                + {arquivo || "Anexar arquivo"}
                            </label>
                        </div>

                        <label className={css.campo}>
                            <span>Placa</span>
                            <input type="text" value={veiculoSelecionado.placa} readOnly />
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
                                    <option key={item}>{item}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className={`${css.campo} ${css.descontos}`}>
                        <span>Descontos</span>
                        <textarea
                            value={descontos}
                            onChange={(e) => setDescontos(e.target.value)}
                            placeholder="Digite uma observacao..."
                        />
                    </label>
                </section>

                <div className={css.acoes}>
                    <button type="submit" className={css.salvar}>
                        Salvar
                    </button>
                    <button type="button" className={css.cancelar} onClick={() => navigate("/dashboardAdmVendas")}>
                        Cancelar
                    </button>
                </div>
            </form>
        </main>
    );
}

export default Vendas;
