import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import css from "./DetalhesVeiculos.module.css";

function DetalhesVeiculos({ API }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [carro, setCarro] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        carregarCarro();
    }, [id]);

    async function carregarCarro() {
        setCarregando(true);
        setErro("");

        try {
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Nao foi possivel carregar o veiculo.");
                return;
            }

            const veiculoEncontrado = (dados.carros || []).find((item) => {
                const idVeiculo = item.id || item.id_carro || item.id_veiculo;
                return String(idVeiculo) === String(id);
            });

            if (!veiculoEncontrado) {
                setErro("Veiculo nao encontrado.");
                return;
            }

            setCarro(veiculoEncontrado);
        } catch {
            setErro("Erro de conexao com o servidor.");
        } finally {
            setCarregando(false);
        }
    }

    function formatarPreco(valor) {
        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarNumero(valor) {
        return Number(valor || 0).toLocaleString("pt-BR");
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

    function formatarEstado(valor) {
        const estado = String(valor || "").toLowerCase();

        if (estado === "2" || estado.includes("regular")) {
            return "Regular";
        }

        if (estado === "3" || estado.includes("ruim")) {
            return "Ruim";
        }

        return "Bom";
    }

    function formatarDocumento(valor) {
        const status = String(valor || "").toLowerCase();

        if (status === "2" || status.includes("irregular")) {
            return "Irregular";
        }

        if (status === "3" || status.includes("pendente")) {
            return "Pendente";
        }

        return "Regular";
    }

    function formatarCambio(valor) {
        const cambio = String(valor || "").toLowerCase();

        if (cambio === "1" || cambio.includes("auto")) {
            return "Automatico";
        }

        if (cambio === "2" || cambio.includes("manual")) {
            return "Manual";
        }

        return valor || "-";
    }

    function imagemVeiculo() {
        if (!carro?.imagem) {
            return "/IconCar.png";
        }

        if (String(carro.imagem).startsWith("http")) {
            return carro.imagem;
        }

        return `${API}${carro.imagem}`;
    }

    function valor(campo) {
        return campo || "-";
    }

    function idCarro() {
        return carro?.id || carro?.id_carro || carro?.id_veiculo;
    }

    if (carregando) {
        return (
            <main className={css.container}>
                <div className={css.estado}>Carregando detalhes do veículo...</div>
            </main>
        );
    }

    if (erro || !carro) {
        return (
            <main className={css.container}>
                <div className={css.estado_erro}>
                    <strong>Ops, nao encontramos esse veículo.</strong>
                    <span>{erro || "Tente voltar para a lista e abrir novamente."}</span>
                    <button type="button" onClick={() => navigate("/dashboardAdmVeiculos")}>
                        Voltar para veículos
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className={css.container}>
            <header className={css.cabecalho}>
                <div>
                    <button
                        type="button"
                        className={css.voltar}
                        onClick={() => navigate("/dashboardAdmVeiculos")}
                    >
                        Voltar
                    </button>
                    <h1>{carro.modelo || carro.nome || "Detalhes do veículo"}</h1>
                    <p>{valor(carro.marca)} - {carro.ano_fabricacao || "-"} / {carro.ano_modelo || "-"}</p>
                </div>

                <button
                    type="button"
                    className={css.editar}
                    onClick={() => navigate(`/editarVeiculos/${idCarro()}`)}
                >
                    Editar veículo
                </button>
            </header>

            <section className={css.hero}>
                <div className={css.imagem_area}>
                    <img
                        src={imagemVeiculo()}
                        alt={carro.modelo || "Veiculo"}
                        onError={(e) => {
                            e.currentTarget.src = "/IconCar.png";
                        }}
                    />
                </div>

                <aside className={css.resumo}>
                    <span className={css.status}>{formatarStatusEstoque(carro.status_estoque)}</span>
                    <div className={css.preco_bloco}>
                        <span>Preço de venda</span>
                        <strong>{formatarPreco(carro.preco)}</strong>
                    </div>
                    <div className={css.descricao_bloco}>
                        <span>Descrição</span>
                        <p>{valor(carro.descricao)}</p>
                    </div>
                </aside>
            </section>

            <section className={css.ficha}>
                <div className={css.ficha_cabecalho}>
                    <h2>Ficha técnica</h2>
                    <span>Dados cadastrados do veículo</span>
                </div>

                <div className={css.grid}>
                    <Info titulo="Marca" valor={valor(carro.marca)} />
                    <Info titulo="Modelo" valor={valor(carro.modelo)} />
                    <Info titulo="Categoria" valor={valor(carro.categoria || carro.nome_categoria)} />
                    <Info titulo="Cambio" valor={formatarCambio(carro.cambio)} />
                    <Info titulo="Ano fabricação" valor={valor(carro.ano_fabricacao)} />
                    <Info titulo="Ano modelo" valor={valor(carro.ano_modelo)} />
                    <Info titulo="Quilometragem" valor={`${formatarNumero(carro.quilometragem)} km`} />
                    <Info titulo="Cor" valor={valor(carro.cor)} />
                    <Info titulo="Placa" valor={valor(carro.placa)} />
                    <Info titulo="Renavam" valor={valor(carro.renavam)} />
                    <Info titulo="Conservação" valor={formatarEstado(carro.estado_conservacao)} />
                    <Info titulo="Documento" valor={formatarDocumento(carro.status_documento)} />
                </div>
            </section>
        </main>
    );
}

function Info({ titulo, valor }) {
    return (
        <div className={css.info}>
            <span>{titulo}</span>
            <strong>{valor}</strong>
        </div>
    );
}

export default DetalhesVeiculos;
