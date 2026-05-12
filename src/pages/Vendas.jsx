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
const formasPagamento = ["Cartao de Credito", "Financiamento", "Pix", "Dinheiro"];
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
    const [parcelas, setParcelas] = useState(48);

    const juros = 0.04;
    const ehCartaoCredito = formaPagamento === "Cartao de Credito";

    const veiculoSelecionado = useMemo(() => {
        return veiculos.find((veiculo) => String(veiculo.id) === veiculoId) || veiculos[0];
    }, [veiculoId]);

    const valorNumerico = Number(String(valorVenda).replace(",", ".")) || 0;
    const valorParcela = useMemo(() => {
        return valorNumerico * juros / (1 - (1 + juros) ** -parcelas);
    }, [juros, parcelas, valorNumerico]);

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
            valorParcela: ehCartaoCredito ? valorParcela : 0,
            juros: ehCartaoCredito ? juros : 0,
            parcelas: ehCartaoCredito ? parcelas : 0,
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

                    {ehCartaoCredito && (
                        <div className={css.parcelamento}>
                            <label className={css.campo}>
                                <span>Quantidade de parcelas</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={parcelas}
                                    onChange={(e) => setParcelas(Number(e.target.value) || 1)}
                                />
                            </label>

                            <div className={css.parcela}>
                                <span>Valor da parcela</span>
                                <strong>{formatarMoeda(valorParcela)}</strong>
                                <small>{parcelas} parcelas com juros de {(juros * 100).toFixed(0)}% ao mes</small>
                            </div>
                        </div>
                    )}
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
