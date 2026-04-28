import css from "./CadastroVeiculos.module.css";
import Input from "../components/Input/Input.jsx";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IMaskInput } from "react-imask";

const formularioInicial = {
    id_categoria: "",
    id_marca: "",
    modelo: "",
    ano_fabricacao: "",
    ano_modelo: "",
    quilometragem: "",
    cor: "",
    cambio: "",
    preco: "",
    descricao: "",
    estado_conservacao: "1",
    status_documento: "1",
    status_estoque: "1",
    placa: "",
    renavam: ""
};

const cambios = [
    { id_cambio: "1", nome: "Automático" },
    { id_cambio: "2", nome: "Manual" }
];

function normalizarStatusEstoque(valor) {
    const status = String(valor || "").toLowerCase();

    if (status === "2" || status.includes("indispon")) {
        return "2";
    }

    if (status === "3" || status.includes("vend")) {
        return "3";
    }

    return "1";
}

function normalizarStatusDocumento(valor) {
    const status = String(valor || "").toLowerCase();

    if (status === "2" || status.includes("irregular")) {
        return "2";
    }

    if (status === "3" || status.includes("pendente")) {
        return "3";
    }

    return "1";
}

function normalizarEstadoConservacao(valor) {
    const estado = String(valor || "").toLowerCase();

    if (estado === "2" || estado.includes("regular")) {
        return "2";
    }

    if (estado === "3" || estado.includes("ruim")) {
        return "3";
    }

    return "1";
}

function formatarErroApi(texto) {
    const mensagem = String(texto || "");
    const mensagemLower = mensagem.toLowerCase();

    if (
        mensagemLower.includes("sqlcode") ||
        mensagemLower.includes("stored procedure") ||
        mensagemLower.includes("conversion error")
    ) {
        return "Nao foi possivel salvar o veiculo. Confira os campos de categoria, marca, cambio, status e conservacao.";
    }

    if (mensagemLower.includes("renavam")) {
        return "RENAVAM invalido. Confira se ele possui 11 digitos e tente novamente.";
    }

    if (mensagemLower.includes("placa")) {
        return "A placa informada ja existe ou esta invalida. Confira os dados e tente novamente.";
    }

    return mensagem || "Nao foi possivel salvar o veiculo. Tente novamente.";
}

function CadastroVeiculo({ API }) {
    const [formulario, setFormulario] = useState(formularioInicial);
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [foto, setFoto] = useState(null);
    const [previewAtual, setPreviewAtual] = useState("");
    const [mensagem, setMensagem] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const estaEditando = Boolean(id);

    function atualizarCampo(campo, valor) {
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    const buscarCategorias = useCallback(async () => {
        try {
            const resposta = await fetch(`${API}/buscar_categoria`, {
                method: "POST",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (resposta.ok) {
                setCategorias(dados.categoria || []);
            }
        } catch {
            setCategorias([]);
        }
    }, [API]);

    const buscarMarcas = useCallback(async () => {
        try {
            const resposta = await fetch(`${API}/buscar_marca`, {
                method: "POST",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (resposta.ok) {
                const listaMarcas = dados.marca || dados.marcas || dados;
                setMarcas(Array.isArray(listaMarcas) ? listaMarcas : []);
            }
        } catch {
            setMarcas([]);
        }
    }, [API]);

    const carregarCarro = useCallback(async () => {
        setCarregando(true);
        setMensagem(null);

        try {
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                credentials: "include"
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: formatarErroApi(dados.erro || "Erro ao carregar veiculo.")
                });
                return;
            }

            const carro = (dados.carros || []).find((item) => String(item.id) === String(id));

            if (!carro) {
                setMensagem({
                    tipo: "erro",
                    texto: "Carro nao encontrado. Volte para a lista e tente novamente."
                });
                return;
            }

            setFormulario({
                id_categoria: carro.id_categoria || "",
                id_marca: carro.id_marca || "",
                modelo: carro.modelo || "",
                ano_fabricacao: carro.ano_fabricacao || "",
                ano_modelo: carro.ano_modelo || "",
                quilometragem: String(carro.quilometragem || ""),
                cor: carro.cor || "",
                cambio: String(carro.cambio || ""),
                preco: String(carro.preco || ""),
                descricao: carro.descricao || "",
                estado_conservacao: normalizarEstadoConservacao(carro.estado_conservacao),
                status_documento: normalizarStatusDocumento(carro.status_documento),
                status_estoque: normalizarStatusEstoque(carro.status_estoque),
                placa: carro.placa || "",
                renavam: carro.renavam || ""
            });
            setPreviewAtual(carro.imagem ? `${API}${carro.imagem}` : "");
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente."
            });
        } finally {
            setCarregando(false);
        }
    }, [API, id]);

    useEffect(() => {
        buscarCategorias();
        buscarMarcas();
    }, [buscarCategorias, buscarMarcas]);

    useEffect(() => {
        if (estaEditando) {
            carregarCarro();
        }
    }, [carregarCarro, estaEditando]);

    function selecionarFoto(e) {
        const arquivo = e.target.files?.[0];
        setFoto(arquivo || null);
    }

    function montarFormData() {
        const formData = new FormData();

        Object.entries(formulario).forEach(([campo, valor]) => {
            if (campo === "preco") {
                formData.append(campo, String(valor).replace(",", "."));
                return;
            }

            if (campo === "quilometragem") {
                formData.append(campo, String(valor).replace(/\D/g, ""));
                return;
            }

            formData.append(campo, valor);
        });

        if (foto) {
            formData.append("foto_veiculo", foto);
        }

        return formData;
    }

    async function salvar(e) {
        e.preventDefault();
        setMensagem(null);

        const camposObrigatorios = [
            "id_categoria",
            "id_marca",
            "modelo",
            "ano_fabricacao",
            "ano_modelo",
            "preco",
            "placa",
            "renavam"
        ];

        const temCampoVazio = camposObrigatorios.some((campo) => !String(formulario[campo]).trim());
        if (temCampoVazio) {
            setMensagem({
                tipo: "erro",
                texto: "Preencha os campos obrigatorios antes de salvar."
            });
            return;
        }

        if (String(formulario.renavam).replace(/\D/g, "").length !== 11) {
            setMensagem({
                tipo: "erro",
                texto: "O RENAVAM deve conter exatamente 11 digitos."
            });
            return;
        }

        setSalvando(true);

        try {
            const url = estaEditando
                ? `${API}/editar_carro/${id}`
                : `${API}/cadastrar_carro`;

            const resposta = await fetch(url, {
                method: estaEditando ? "PUT" : "POST",
                credentials: "include",
                body: montarFormData()
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: formatarErroApi(dados.erro || dados.mensagem)
                });
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Veiculo salvo com sucesso."
            });

            setTimeout(() => {
                navigate("/dashboardAdmVeiculos");
            }, 1100);
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor. Verifique sua conexao e tente novamente."
            });
        } finally {
            setSalvando(false);
        }
    }

    const previewFoto = foto ? URL.createObjectURL(foto) : previewAtual;

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>
                {estaEditando ? "Editar Veiculo" : "Cadastro Veiculos"}
            </h1>

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
                {carregando && <div className={css.status}>Carregando dados do veiculo...</div>}

                <div className={css.grid}>
                    <div className={css.esquerda}>
                        <div className={css.documento}>
                            <select
                                className={css.selectPequeno}
                                value={formulario.status_estoque}
                                onChange={(e) => atualizarCampo("status_estoque", e.target.value)}
                            >
                                <option value="1">Em estoque</option>
                                <option value="2">Indisponivel</option>
                                <option value="3">Vendido</option>
                            </select>
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Placa"
                                value={formulario.placa}
                                onChange={(e) => atualizarCampo("placa", e.target.value.toUpperCase())}
                                required={true}
                            />

                            <Input
                                label="Renavam"
                                value={formulario.renavam}
                                onChange={(e) => atualizarCampo("renavam", e.target.value.replace(/\D/g, "").slice(0, 11))}
                                inputMode="numeric"
                                required={true}
                            />
                        </div>

                        <div className={css.duplo}>
                            <select
                                className={css.select}
                                value={formulario.id_categoria}
                                onChange={(e) => atualizarCampo("id_categoria", e.target.value)}
                                required
                            >
                                <option value="">Categoria</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>

                            <select
                                className={css.select}
                                value={formulario.id_marca}
                                onChange={(e) => atualizarCampo("id_marca", e.target.value)}
                                required
                            >
                                <option value="">Marca</option>
                                {marcas.map((marca) => {
                                    const idMarca = marca.id_marca || marca.ID_MARCA || marca.id || marca.ID;
                                    const nomeMarca = marca.marca || marca.MARCA || marca.nome || marca.NOME;

                                    return (
                                        <option key={idMarca} value={idMarca}>
                                            {nomeMarca}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Modelo"
                                value={formulario.modelo}
                                onChange={(e) => atualizarCampo("modelo", e.target.value)}
                                required={true}
                            />

                            <select
                                className={css.select}
                                value={formulario.cambio}
                                onChange={(e) => atualizarCampo("cambio", e.target.value)}
                            >
                                <option value="">Cambio</option>
                                {cambios.map((cambio) => {
                                    return (
                                        <option key={cambio.id_cambio} value={cambio.id_cambio}>
                                            {cambio.nome}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Ano Fabricacao"
                                value={formulario.ano_fabricacao}
                                onChange={(e) => atualizarCampo("ano_fabricacao", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                inputMode="numeric"
                                required={true}
                            />
                            <Input
                                label="Ano Modelo"
                                value={formulario.ano_modelo}
                                onChange={(e) => atualizarCampo("ano_modelo", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                inputMode="numeric"
                                required={true}
                            />
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Quilometragem"
                                as={IMaskInput}
                                mask={Number}
                                scale={0}
                                thousandsSeparator="."
                                radix=","
                                unmask={true}
                                value={String(formulario.quilometragem)}
                                onAccept={(valor) => atualizarCampo("quilometragem", String(valor))}
                                inputMode="numeric"
                            />
                            <Input
                                label="Cor"
                                value={formulario.cor}
                                onChange={(e) => atualizarCampo("cor", e.target.value)}
                            />
                        </div>

                        <div className={css.duplo}>
                            <select
                                className={css.select}
                                value={formulario.estado_conservacao}
                                onChange={(e) => atualizarCampo("estado_conservacao", e.target.value)}
                            >
                                <option value="1">Bom</option>
                                <option value="2">Regular</option>
                                <option value="3">Ruim</option>
                            </select>

                            <Input
                                label="Preco de Venda"
                                as={IMaskInput}
                                mask={Number}
                                scale={2}
                                thousandsSeparator="."
                                radix=","
                                mapToRadix={["."]}
                                normalizeZeros={true}
                                padFractionalZeros={true}
                                unmask={true}
                                value={String(formulario.preco)}
                                onAccept={(valor) => atualizarCampo("preco", String(valor))}
                                inputMode="decimal"
                                required={true}
                            />
                        </div>

                        <textarea
                            className={css.descricao}
                            placeholder="Descricao"
                            value={formulario.descricao}
                            onChange={(e) => atualizarCampo("descricao", e.target.value)}
                        />

                        <div className={css.documento}>
                            <select
                                className={css.selectPequeno}
                                value={formulario.status_documento}
                                onChange={(e) => atualizarCampo("status_documento", e.target.value)}
                            >
                                <option value="1">Documento regular</option>
                                <option value="2">Documento irregular</option>
                                <option value="3">Documento pendente</option>
                            </select>
                        </div>
                    </div>

                    <div className={css.direita}>
                        <div className={css.preview}>
                            {previewFoto && (
                                <img
                                    src={previewFoto}
                                    alt="Preview do veiculo"
                                    className={css.imagemPreview}
                                />
                            )}
                        </div>

                        <label className={css.addFoto}>
                            {foto || previewAtual ? "Trocar Foto" : "Adicionar Foto"}
                            <input
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                hidden
                                onChange={selecionarFoto}
                            />
                        </label>
                    </div>
                </div>

                <div className={css.botoes}>
                    <button type="submit" className={css.salvar} disabled={salvando}>
                        {salvando ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                        type="button"
                        className={css.cancelar}
                        onClick={() => navigate("/dashboardAdmVeiculos")}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </main>
    );
}

export default CadastroVeiculo;
