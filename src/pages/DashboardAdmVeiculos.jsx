import css from "./DashboardAdmVeiculos.module.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardAdmVeiculos({ API }) {
    const [carros, setCarros] = useState([]);
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        carregarCarros();
    }, [categoria]);

    async function carregarCarros() {
        setCarregando(true);
        setErro("");

        try {
            const params = new URLSearchParams();
            if (categoria) {
                params.append("categoria", categoria);
            }

            const resposta = await fetch(`${API}/listar_carro?${params.toString()}`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao carregar veiculos.");
                return;
            }

            setCarros(dados.carros || []);
        } catch {
            setErro("Erro de conexao com o servidor.");
        } finally {
            setCarregando(false);
        }
    }

    async function excluirCarro(id) {
        const confirmou = window.confirm("Deseja excluir este veiculo?");
        if (!confirmou) {
            return;
        }

        setErro("");

        try {
            const resposta = await fetch(`${API}/excluir_carro/${id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao excluir veiculo.");
                return;
            }

            setCarros((listaAtual) => listaAtual.filter((carro) => carro.id !== id));
        } catch {
            setErro("Erro de conexao com o servidor.");
        }
    }

    const carrosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) {
            return carros;
        }

        return carros.filter((carro) => {
            const campos = [
                carro.nome,
                carro.modelo,
                carro.marca,
                carro.placa,
                carro.renavam,
                carro.ano_fabricacao,
                carro.ano_modelo
            ];

            return campos.some((campo) => String(campo || "").toLowerCase().includes(termo));
        });
    }, [busca, carros]);

    const categorias = ["Sedan", "Eletrico", "Esportivo", "Caminhonete", "SUV"];

    function formatarPreco(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarStatusEstoque(valor) {
        const status = String(valor || "").toLowerCase();

        if (status === "2" || status.includes("indispon")) {
            return "Indisponivel";
        }

        if (status === "3" || status.includes("vend")) {
            return "Vendido";
        }

        return "Em estoque";
    }

    function classeStatusEstoque(valor) {
        const statusFormatado = formatarStatusEstoque(valor);

        if (statusFormatado === "Indisponivel") {
            return `${css.status} ${css.status_indisponivel}`;
        }

        if (statusFormatado === "Vendido") {
            return `${css.status} ${css.status_vendido}`;
        }

        return `${css.status} ${css.status_estoque}`;
    }

    function textoStatusEstoque(valor) {
        const statusFormatado = formatarStatusEstoque(valor);

        if (statusFormatado === "Em estoque") {
            return (
                <>
                    Em
                    <br />
                    estoque
                </>
            );
        }

        return statusFormatado;
    }

    return (
        <div className={css.layout_dashboard}>
            <main className={css.conteudo_principal}>
                <header className={css.cabecalho}>
                    <h1 className={css.titulo_boas_vindas}>
                        Veiculos
                    </h1>
                    <button
                        className={css.btn_add}
                        onClick={() => navigate("/cadastroVeiculos")}
                    >
                        Cadastrar Veiculo
                    </button>
                </header>

                {erro && <p className={css.mensagem_erro}>{erro}</p>}

                <div className={css.area_busca}>
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    <input
                        type="text"
                        placeholder="Buscar veiculos"
                        className={css.input_busca}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                    />
                </div>

                <section className={css.secao_filtros}>
                    <button
                        type="button"
                        className={`${css.botao_filtro} ${categoria === "" ? css.filtro_ativo : ""}`}
                        onClick={() => setCategoria("")}
                    >
                        Todos
                    </button>
                    {categorias.map((nomeCategoria) => (
                        <button
                            key={nomeCategoria}
                            type="button"
                            className={`${css.botao_filtro} ${categoria === nomeCategoria ? css.filtro_ativo : ""}`}
                            onClick={() => setCategoria(nomeCategoria)}
                        >
                            {nomeCategoria}
                        </button>
                    ))}
                </section>

                <section className={css.tabela_container}>
                    <table className={css.tabela}>
                        <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Ano</th>
                            <th>Km</th>
                            <th>Cor</th>
                            <th>Preco</th>
                            <th>Status</th>
                            <th>Acoes</th>
                        </tr>
                        </thead>

                        <tbody>
                        {carregando && (
                            <tr>
                                <td colSpan="9" className={css.celula_vazia}>
                                    Carregando veiculos...
                                </td>
                            </tr>
                        )}

                        {!carregando && carrosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan="9" className={css.celula_vazia}>
                                    Nenhum veiculo cadastrado
                                </td>
                            </tr>
                        )}

                        {!carregando && carrosFiltrados.map((carro) => (
                            <tr key={carro.id}>
                                <td>
                                    <img
                                        src={`${API}${carro.imagem}`}
                                        alt={carro.nome}
                                        className={css.img_carro}
                                    />
                                </td>
                                <td>{carro.modelo}</td>
                                <td>{carro.marca}</td>
                                <td>{carro.ano_fabricacao}/{carro.ano_modelo}</td>
                                <td>{Number(carro.quilometragem || 0).toLocaleString("pt-BR")}</td>
                                <td>{carro.cor}</td>
                                <td className={css.preco}>{formatarPreco(carro.preco)}</td>
                                <td>
                                    <span className={classeStatusEstoque(carro.status_estoque)}>
                                        {textoStatusEstoque(carro.status_estoque)}
                                    </span>
                                </td>
                                <td>
                                    <div className={css.acoes}>
                                        <button
                                            type="button"
                                            className={css.btn_editar}
                                            onClick={() => navigate(`/editarVeiculos/${carro.id}`)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className={css.btn_excluir}
                                            onClick={() => excluirCarro(carro.id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
}

export default DashboardAdmVeiculos;
