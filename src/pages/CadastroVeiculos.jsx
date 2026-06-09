// Importa recursos de ./CadastroVeiculos.module.css.
import css from "./CadastroVeiculos.module.css";
// Importa recursos de ../components/Input/Input.jsx.
import Input from "../components/Input/Input.jsx";
// Importa recursos de react.
import { useCallback, useEffect, useState } from "react";
// Importa recursos de react-router-dom.
import { useNavigate, useParams } from "react-router-dom";
// Importa recursos de react-imask.
import { IMaskInput } from "react-imask";

// Declara formularioInicial para uso neste fluxo.
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

// Declara cambios para uso neste fluxo.
const cambios = [
    { id_cambio: "1", nome: "Automático" },
    { id_cambio: "2", nome: "Manual" }
];

// Declara a função normalizarStatusEstoque usada por esta página.
function normalizarStatusEstoque(valor) {
    // Declara status para uso neste fluxo.
    const status = String(valor || "").toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "2" || status.includes("indispon")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "2";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "3" || status.includes("vend")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "3";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "1";
}

// Declara a função normalizarStatusDocumento usada por esta página.
function normalizarStatusDocumento(valor) {
    // Declara status para uso neste fluxo.
    const status = String(valor || "").toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "2" || status.includes("irregular")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "2";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (status === "3" || status.includes("pendente")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "3";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "1";
}

// Declara a função normalizarEstadoConservacao usada por esta página.
function normalizarEstadoConservacao(valor) {
    // Declara estado para uso neste fluxo.
    const estado = String(valor || "").toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (estado === "2" || estado.includes("regular")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "2";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (estado === "3" || estado.includes("ruim")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "3";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return "1";
}

// Declara a função formatarErroApi usada por esta página.
function formatarErroApi(texto) {
    // Declara mensagem para uso neste fluxo.
    const mensagem = String(texto || "");
    // Declara mensagemLower para uso neste fluxo.
    const mensagemLower = mensagem.toLowerCase();

    // Verifica esta condição antes de continuar o fluxo.
    if (
        mensagemLower.includes("sqlcode") ||
        mensagemLower.includes("stored procedure") ||
        mensagemLower.includes("conversion error")
    ) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "Não foi possível salvar o veículo. Confira os campos de categoria, marca, câmbio, status e conservação.";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (mensagemLower.includes("renavam")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "RENAVAM inválido. Confira se ele possui 11 dígitos e tente novamente.";
    }

    // Verifica esta condição antes de continuar o fluxo.
    if (mensagemLower.includes("placa")) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return "A placa informada já existe ou está inválida. Confira os dados e tente novamente.";
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return mensagem || "Não foi possível salvar o veículo. Tente novamente.";
}

// Declara a função cabecalhoAutorizacao usada por esta página.
function cabecalhoAutorizacao() {
    // Declara token para uso neste fluxo.
    const token = localStorage.getItem("access_token");
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Declara a função limparPlaca usada por esta página.
function limparPlaca(valor) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);
}

// Declara a função mascararPlaca usada por esta página.
function mascararPlaca(valor) {
    // Declara placa para uso neste fluxo.
    const placa = limparPlaca(valor);

    // Verifica esta condição antes de continuar o fluxo.
    if (/^[A-Z]{3}[0-9]{4}$/.test(placa)) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return `${placa.slice(0, 3)}-${placa.slice(3)}`;
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return placa;
}

// Declara a função limparRenavam usada por esta página.
function limparRenavam(valor) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return String(valor || "").replace(/\D/g, "").slice(0, 11);
}

// Declara a função CadastroVeiculo usada por esta página.
function CadastroVeiculo({ API }) {
    // Declara os dados usados neste fluxo.
    const [formulario, setFormulario] = useState(formularioInicial);
    // Declara os dados usados neste fluxo.
    const [categorias, setCategorias] = useState([]);
    // Declara os dados usados neste fluxo.
    const [marcas, setMarcas] = useState([]);
    // Declara os dados usados neste fluxo.
    const [foto, setFoto] = useState(null);
    // Declara os dados usados neste fluxo.
    const [previewAtual, setPreviewAtual] = useState("");
    // Declara os dados usados neste fluxo.
    const [mensagem, setMensagem] = useState(null);
    // Declara os dados usados neste fluxo.
    const [salvando, setSalvando] = useState(false);
    // Declara os dados usados neste fluxo.
    const [carregando, setCarregando] = useState(false);
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();
    // Declara os dados usados neste fluxo.
    const { id } = useParams();
    // Declara estaEditando para uso neste fluxo.
    const estaEditando = Boolean(id);

    // Declara a função atualizarCampo usada por esta página.
    function atualizarCampo(campo, valor) {
        // Atualiza o estado por meio de setFormulario.
        setFormulario((dadosAtuais) => ({
            ...dadosAtuais,
            [campo]: valor
        }));
    }

    // Carrega as categorias para preencher o select do formulario.
    const buscarCategorias = useCallback(async () => {
        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/buscar_categoria`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (resposta.ok) {
                // Atualiza o estado por meio de setCategorias.
                setCategorias(dados.categoria || []);
            }
        } catch {
            // Atualiza o estado por meio de setCategorias.
            setCategorias([]);
        }
    }, [API]);

    // Carrega as marcas cadastradas para vincular ao veiculo.
    const buscarMarcas = useCallback(async () => {
        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/buscar_marca`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (resposta.ok) {
                // Declara listaMarcas para uso neste fluxo.
                const listaMarcas = dados.marca || dados.marcas || dados;
                // Atualiza o estado por meio de setMarcas.
                setMarcas(Array.isArray(listaMarcas) ? listaMarcas : []);
            }
        } catch {
            // Atualiza o estado por meio de setMarcas.
            setMarcas([]);
        }
    }, [API]);

    // Quando esta editando, busca o veiculo pelo id da rota e preenche o formulario.
    const carregarCarro = useCallback(async () => {
        // Atualiza o estado por meio de setCarregando.
        setCarregando(true);
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(`${API}/listar_carro`, {
                method: "GET",
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: formatarErroApi(dados.erro || "Erro ao carregar veículo.")
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Declara carro para uso neste fluxo.
            const carro = (dados.carros || []).find((item) => String(item.id) === String(id));

            // Verifica esta condição antes de continuar o fluxo.
            if (!carro) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: "Carro não encontrado. Volte para a lista e tente novamente."
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setFormulario.
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
                placa: mascararPlaca(carro.placa),
                renavam: limparRenavam(carro.renavam)
            });
            // Atualiza o estado por meio de setPreviewAtual.
            setPreviewAtual(carro.imagem ? `${API}${carro.imagem}` : "");
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
            });
        } finally {
            // Atualiza o estado por meio de setCarregando.
            setCarregando(false);
        }
    }, [API, id]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Executa buscarCategorias nesta etapa do fluxo.
        buscarCategorias();
        // Executa buscarMarcas nesta etapa do fluxo.
        buscarMarcas();
    }, [buscarCategorias, buscarMarcas]);

    // Executa useEffect nesta etapa do fluxo.
    useEffect(() => {
        // Verifica esta condição antes de continuar o fluxo.
        if (estaEditando) {
            // Executa carregarCarro nesta etapa do fluxo.
            carregarCarro();
        }
    }, [carregarCarro, estaEditando]);

    // Declara a função selecionarFoto usada por esta página.
    function selecionarFoto(e) {
        // Declara arquivo para uso neste fluxo.
        const arquivo = e.target.files?.[0];
        // Atualiza o estado por meio de setFoto.
        setFoto(arquivo || null);
    }

    // Monta o FormData porque o cadastro tambem envia imagem do veiculo.
    function montarFormData() {
        // Declara formData para uso neste fluxo.
        const formData = new FormData();

        // Executa forEach nesta etapa do fluxo.
        Object.entries(formulario).forEach(([campo, valor]) => {
            // Verifica esta condição antes de continuar o fluxo.
            if (campo === "preco") {
                // Executa append nesta etapa do fluxo.
                formData.append(campo, String(valor).replace(",", "."));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Verifica esta condição antes de continuar o fluxo.
            if (campo === "quilometragem") {
                // Executa append nesta etapa do fluxo.
                formData.append(campo, String(valor).replace(/\D/g, ""));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Verifica esta condição antes de continuar o fluxo.
            if (campo === "placa") {
                // Executa append nesta etapa do fluxo.
                formData.append(campo, limparPlaca(valor));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Verifica esta condição antes de continuar o fluxo.
            if (campo === "renavam") {
                // Executa append nesta etapa do fluxo.
                formData.append(campo, limparRenavam(valor));
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Executa append nesta etapa do fluxo.
            formData.append(campo, valor);
        });

        // Verifica esta condição antes de continuar o fluxo.
        if (foto) {
            // Executa append nesta etapa do fluxo.
            formData.append("foto_veiculo", foto);
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return formData;
    }

    // Decide entre cadastrar ou editar e envia os dados para a API.
    async function salvar(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Declara camposObrigatorios para uso neste fluxo.
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

        // Declara temCampoVazio para uso neste fluxo.
        const temCampoVazio = camposObrigatorios.some((campo) => !String(formulario[campo]).trim());
        // Verifica esta condição antes de continuar o fluxo.
        if (temCampoVazio) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Preencha os campos obrigatorios antes de salvar."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (String(formulario.renavam).replace(/\D/g, "").length !== 11) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "O RENAVAM deve conter exatamente 11 dígitos."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (limparPlaca(formulario.placa).length !== 7) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "A placa deve conter exatamente 7 caracteres."
            });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setSalvando.
        setSalvando(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara url para uso neste fluxo.
            const url = estaEditando
                ? `${API}/editar_carro/${id}`
                : `${API}/cadastrar_carro`;

            // Declara resposta para uso neste fluxo.
            const resposta = await fetch(url, {
                method: estaEditando ? "PUT" : "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: montarFormData()
            });
            // Declara dados para uso neste fluxo.
            const dados = await resposta.json();

            // Verifica esta condição antes de continuar o fluxo.
            if (!resposta.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({
                    tipo: "erro",
                    texto: formatarErroApi(dados.erro || dados.mensagem)
                });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Veículo salvo com sucesso."
            });

            // Atualiza o estado por meio de setTimeout.
            setTimeout(() => {
                // Navega o usuário para a próxima página do fluxo.
                navigate("/dashboardAdmVeiculos");
            }, 1100);
        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({
                tipo: "erro",
                texto: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
            });
        } finally {
            // Atualiza o estado por meio de setSalvando.
            setSalvando(false);
        }
    }

    // Declara previewFoto para uso neste fluxo.
    const previewFoto = foto ? URL.createObjectURL(foto) : previewAtual;

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Exibe o título principal desta página. */}
            <h1 className={css.titulo}>
                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                {estaEditando ? "Editar Veículo" : "Cadastro Veículos"}
            </h1>

            {/* Agrupa os campos e ações deste formulário. */}
            <form className={css.formulario} onSubmit={salvar}>
                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {mensagem && (
                    <div
                       className={`${css.mensagem} ${
                            mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro
                        }`}
                        role="alert"
                    >
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div>
                            {/* Renderiza o elemento strong nesta parte da página. */}
                            <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Confira os dados"}</strong>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span>{mensagem.texto}</span>
                        </div>
                        {/* Exibe este botão de ação. */}
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
                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {carregando && <div className={css.status}>Carregando dados do veículo...</div>}

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.grid}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.esquerda}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.documento}>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.selectPequeno}
                                value={formulario.status_estoque}
                                onChange={(e) => atualizarCampo("status_estoque", e.target.value)}
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="1">Em estoque</option>
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="2">Indisponível</option>
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="3">Vendido</option>
                            </select>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Placa"
                                value={formulario.placa}
                                onChange={(e) => atualizarCampo("placa", mascararPlaca(e.target.value))}
                                maxLength={8}
                                required={true}
                            />

                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Renavam"
                                value={formulario.renavam}
                                onChange={(e) => atualizarCampo("renavam", limparRenavam(e.target.value))}
                                maxLength={11}
                                inputMode="numeric"
                                required={true}
                            />
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.select}
                                value={formulario.id_categoria}
                                onChange={(e) => atualizarCampo("id_categoria", e.target.value)}
                                required
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="">Categoria</option>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {categorias.map((categoria) => (
                                    <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                        {categoria.nome}
                                    </option>
                                ))}
                            </select>

                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.select}
                                value={formulario.id_marca}
                                onChange={(e) => atualizarCampo("id_marca", e.target.value)}
                                required
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="">Marca</option>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {marcas.map((marca) => {
                                    // Declara idMarca para uso neste fluxo.
                                    const idMarca = marca.id_marca || marca.ID_MARCA || marca.id || marca.ID;
                                    // Declara nomeMarca para uso neste fluxo.
                                    const nomeMarca = marca.marca || marca.MARCA || marca.nome || marca.NOME;

                                    // Retorna o resultado desta função ou o conteúdo visual da página.
                                    return (
                                        <option key={idMarca} value={idMarca}>
                                            {nomeMarca}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Modelo"
                                value={formulario.modelo}
                                onChange={(e) => atualizarCampo("modelo", e.target.value)}
                                required={true}
                            />

                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.select}
                                value={formulario.cambio}
                                onChange={(e) => atualizarCampo("cambio", e.target.value)}
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="">Câmbio</option>
                                {/* Percorre os dados para renderizar os itens desta área. */}
                                {cambios.map((cambio) => {
                                    // Retorna o resultado desta função ou o conteúdo visual da página.
                                    return (
                                        <option key={cambio.id_cambio} value={cambio.id_cambio}>
                                            {cambio.nome}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Ano Fabricação"
                                value={formulario.ano_fabricacao}
                                onChange={(e) => atualizarCampo("ano_fabricacao", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                inputMode="numeric"
                                required={true}
                            />
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Ano Modelo"
                                value={formulario.ano_modelo}
                                onChange={(e) => atualizarCampo("ano_modelo", e.target.value.replace(/\D/g, "").slice(0, 4))}
                                inputMode="numeric"
                                required={true}
                            />
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Renderiza o componente Input nesta parte da página. */}
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
                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Cor"
                                value={formulario.cor}
                                onChange={(e) => atualizarCampo("cor", e.target.value)}
                            />
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.duplo}>
                            {/* Relaciona um texto explicativo ao campo correspondente. */}
                            <label className={css.campoSelect}>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>Estado do veículo</span>
                                {/* Exibe uma lista de opções para seleção. */}
                                <select
                                    className={css.select}
                                    value={formulario.estado_conservacao}
                                    onChange={(e) => atualizarCampo("estado_conservacao", e.target.value)}
                                >
                                    {/* Renderiza o elemento option nesta parte da página. */}
                                    <option value="1">Bom</option>
                                    {/* Renderiza o elemento option nesta parte da página. */}
                                    <option value="2">Regular</option>
                                    {/* Renderiza o elemento option nesta parte da página. */}
                                    <option value="3">Ruim</option>
                                </select>
                            </label>

                            {/* Renderiza o componente Input nesta parte da página. */}
                            <Input
                                label="Preço de Venda"
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

                        {/* Renderiza o elemento textarea nesta parte da página. */}
                        <textarea
                            className={css.descricao}
                            placeholder="Descrição"
                            value={formulario.descricao}
                            onChange={(e) => atualizarCampo("descricao", e.target.value)}
                        />

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.documento}>
                            {/* Exibe uma lista de opções para seleção. */}
                            <select
                                className={css.selectPequeno}
                                value={formulario.status_documento}
                                onChange={(e) => atualizarCampo("status_documento", e.target.value)}
                            >
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="1">Documento regular</option>
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="2">Documento irregular</option>
                                {/* Renderiza o elemento option nesta parte da página. */}
                                <option value="3">Documento pendente</option>
                            </select>
                        </div>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.direita}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.preview}>
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {previewFoto && (
                                <img
                                    src={previewFoto}
                                    alt="Preview do veículo"
                                    className={css.imagemPreview}
                                />
                            )}
                        </div>

                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.addFoto}>
                            {/* Escolhe qual conteúdo exibir conforme a condição. */}
                            {foto || previewAtual ? "Trocar Foto" : "Adicionar Foto"}
                            {/* Exibe este campo de entrada de dados. */}
                            <input
                                type="file"
                                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                hidden
                                onChange={selecionarFoto}
                            />
                        </label>
                    </div>
                </div>

                {/* Agrupa os elementos desta parte da interface. */}
                <div className={css.botoes}>
                    {/* Exibe este botão de ação. */}
                    <button type="submit" className={css.salvar} disabled={salvando}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {salvando ? "Salvando..." : "Salvar"}
                    </button>
                    {/* Exibe este botão de ação. */}
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

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CadastroVeiculo;
