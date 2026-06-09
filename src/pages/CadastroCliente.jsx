// Importa recursos de ./CadastroCliente.module.css.
import css from "./CadastroCliente.module.css";
// Importa recursos de ../components/Input/Input.jsx.
import Input from "../components/Input/Input.jsx";
// Importa recursos de react.
import { useState } from "react";
// Importa recursos de react-imask.
import { IMaskInput } from "react-imask";
// Importa recursos de react-router-dom.
import { useNavigate } from "react-router-dom";

// Declara a função CadastroCliente usada por esta página.
function CadastroCliente({ API }) {
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();
    // Declara os dados usados neste fluxo.
    const [nome, setNome] = useState("");
    // Declara os dados usados neste fluxo.
    const [email, setEmail] = useState("");
    // Declara os dados usados neste fluxo.
    const [telefone, setTelefone] = useState("");
    // Declara os dados usados neste fluxo.
    const [cpf, setCpf] = useState("");
    // Declara os dados usados neste fluxo.
    const [foto, setFoto] = useState(null);
    // Declara os dados usados neste fluxo.
    const [inputFoto, setInputFoto] = useState(0);
    // Declara os dados usados neste fluxo.
    const [senha, setSenha] = useState("");
    // Declara os dados usados neste fluxo.
    const [confirmarSenha, setConfirmarSenha] = useState("");
    // Declara os dados usados neste fluxo.
    const [tipoUsuario, setTipoUsuario] = useState("cliente");

    // Declara os dados usados neste fluxo.
    const [mensagem, setMensagem] = useState(null);
    // Declara os dados usados neste fluxo.
    const [salvando, setSalvando] = useState(false);

    // Declara a função cabecalhoAutorizacao usada por esta página.
    function cabecalhoAutorizacao() {
        // Declara token para uso neste fluxo.
        const token = localStorage.getItem("access_token");
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    // Declara a função lerRespostaJson usada por esta página.
    async function lerRespostaJson(resposta) {
        // Declara texto para uso neste fluxo.
        const texto = await resposta.text();

        // Verifica esta condição antes de continuar o fluxo.
        if (!texto) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return {};
        }

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return JSON.parse(texto);
        } catch {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return {};
        }
    }

    // Declara a função selecionarFoto usada por esta página.
    function selecionarFoto(e) {
        // Declara arquivo para uso neste fluxo.
        const arquivo = e.target.files?.[0];

        // Verifica esta condição antes de continuar o fluxo.
        if (!arquivo) {
            // Atualiza o estado por meio de setFoto.
            setFoto(null);
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara tiposPermitidos para uso neste fluxo.
        const tiposPermitidos = ["image/png", "image/jpeg"];
        // Verifica esta condição antes de continuar o fluxo.
        if (!tiposPermitidos.includes(arquivo.type)) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "erro", texto: "Aceitamos apenas arquivos png e jpeg." });
            // Atualiza o estado por meio de setFoto.
            setFoto(null);
            // Executa esta etapa do fluxo.
            e.target.value = "";
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);
        // Atualiza o estado por meio de setFoto.
        setFoto(arquivo);
    }

    // Declara a função removerFoto usada por esta página.
    function removerFoto() {
        // Atualiza o estado por meio de setFoto.
        setFoto(null);
        // Atualiza o estado por meio de setInputFoto.
        setInputFoto((valorAtual) => valorAtual + 1);
    }

    // Declara a função cadastrar usada por esta página.
    async function cadastrar(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setMensagem.
        setMensagem(null);

        // Verifica esta condição antes de continuar o fluxo.
        if (
            !nome.trim() ||
            !email.trim() ||
            !telefone.trim() ||
            !cpf.trim() ||
            !senha.trim() ||
            !confirmarSenha.trim()
        ) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "erro", texto: "Preencha todos os campos obrigatórios." });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (cpf.length !== 11) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "erro", texto: "CPF deve ter exatamente 11 números." });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (senha !== confirmarSenha) {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "erro", texto: "As senhas não coincidem." });
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara formData para uso neste fluxo.
        const formData = new FormData();
        // Executa append nesta etapa do fluxo.
        formData.append("nome", nome);
        // Executa append nesta etapa do fluxo.
        formData.append("email", email);
        // Executa append nesta etapa do fluxo.
        formData.append("telefone", telefone);
        // Executa append nesta etapa do fluxo.
        formData.append("cpf", cpf);
        // Executa append nesta etapa do fluxo.
        formData.append("senha", senha);
        // Verifica esta condição antes de continuar o fluxo.
        if (tipoUsuario === "vendedor") {
            // Executa append nesta etapa do fluxo.
            formData.append("tipo", "1");
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (foto) {
            // Executa append nesta etapa do fluxo.
            formData.append("foto_perfil", foto);
        }

        // Atualiza o estado por meio de setSalvando.
        setSalvando(true);

        // Tenta executar a operação e permite tratar possíveis falhas.
        try {
            // Declara retorno para uso neste fluxo.
            const retorno = await fetch(`${API}/criar_usuario`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });

            // Declara dados para uso neste fluxo.
            const dados = await lerRespostaJson(retorno);

            // Verifica esta condição antes de continuar o fluxo.
            if (!retorno.ok) {
                // Atualiza o estado por meio de setMensagem.
                setMensagem({ tipo: "erro", texto: dados.erro || dados.mensagem || "Erro ao cadastrar." });
                // Retorna o resultado desta função ou o conteúdo visual da página.
                return;
            }

            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "sucesso", texto: "Conta criada com sucesso!" });

            // Limpa o formulário após o sucesso (opcional, pode redirecionar também)
            setNome(""); setEmail(""); setTelefone(""); setCpf("");
            // Atualiza o estado por meio de setSenha.
            setSenha(""); setConfirmarSenha(""); removerFoto();
            // Navega o usuário para a próxima página do fluxo.
            navigate("/dashboardAdmClientes");

        } catch {
            // Atualiza o estado por meio de setMensagem.
            setMensagem({ tipo: "erro", texto: "Não foi possível conectar ao servidor." });
        } finally {
            // Atualiza o estado por meio de setSalvando.
            setSalvando(false);
        }
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <div className={css.layout_dashboard}>
            {/* Abre o conteúdo principal desta página. */}
            <main className={css.conteudo_principal}>

                {/* Exibe o cabeçalho desta área. */}
                <header className={css.cabecalho}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div>
                        {/* Exibe o título principal desta página. */}
                        <h1 className={css.titulo}>Cadastrar Usuário</h1>
                        {/* Exibe esta mensagem ou informação. */}
                        <p className={css.subtitulo}>Preencha os dados para adicionar um novo cliente ou vendedor ao sistema.</p>
                    </div>
                </header>

                {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                {mensagem && (
                    <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.mensagem_info}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span className={css.mensagem_icone}>{mensagem.tipo === "sucesso" ? "✓" : "!"}</span>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.mensagem_texto}>
                                {/* Renderiza o elemento strong nesta parte da página. */}
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atenção"}</strong>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        {/* Exibe este botão de ação. */}
                        <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">x</button>
                    </div>
                )}

                {/* Agrupa esta seção de conteúdo. */}
                <section className={css.card_formulario}>
                    {/* Agrupa os campos e ações deste formulário. */}
                    <form onSubmit={cadastrar}>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.area_tipo_usuario}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span className={css.label_tipo}>Perfil do Usuário:</span>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.opcoes_tipo}>
                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label className={css.radio_label}>
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="radio"
                                        value="cliente"
                                        checked={tipoUsuario === "cliente"}
                                        onChange={(e) => setTipoUsuario(e.target.value)}
                                    />
                                    Cliente
                                </label>
                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label className={css.radio_label}>
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="radio"
                                        value="vendedor"
                                        checked={tipoUsuario === "vendedor"}
                                        onChange={(e) => setTipoUsuario(e.target.value)}
                                    />
                                    Vendedor
                                </label>
                            </div>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.form_grid}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.campo_inteiro}>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="Nome Completo"
                                    type="text"
                                    img="/ImgCadastro/pessoa.png"
                                    alt="icone"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required={true}
                                />
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.campo_inteiro}>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="E-mail"
                                    type="email"
                                    img="/ImgCadastro/email.png"
                                    alt="icone"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required={true}
                                />
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="Telefone"
                                    type="text"
                                    as={IMaskInput}
                                    mask="(00) 00000-0000"
                                    unmask={true}
                                    img="/ImgCadastro/telefone.png"
                                    alt="icone"
                                    value={telefone}
                                    onAccept={(valor) => setTelefone(valor)}
                                    inputMode="numeric"
                                    required={true}
                                />
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="CPF"
                                    type="text"
                                    as={IMaskInput}
                                    mask="000.000.000-00"
                                    unmask={true}
                                    img="/ImgCadastro/cadeado.png"
                                    alt="icone"
                                    value={cpf}
                                    onAccept={(valor) => setCpf(valor)}
                                    inputMode="numeric"
                                    required={true}
                                />
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="Senha"
                                    type="password"
                                    img="/ImgCadastro/senha.png"
                                    alt="icone"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    required={true}
                                />
                            </div>

                            {/* Agrupa os elementos desta parte da interface. */}
                            <div>
                                {/* Renderiza o componente Input nesta parte da página. */}
                                <Input
                                    label="Confirmar Senha"
                                    type="password"
                                    img="/ImgCadastro/senha.png"
                                    alt="icone"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.area_upload_wrapper}>
                            {/* Renderiza o elemento span nesta parte da página. */}
                            <span className={css.label_tipo}>Foto de Perfil (Opcional):</span>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.area_upload}>
                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label className={css.botao_upload} htmlFor="arquivo_foto">
                                    Selecionar Imagem
                                </label>
                                {/* Renderiza o elemento span nesta parte da página. */}
                                <span className={css.texto_upload}>Apenas PNG e JPEG</span>
                                {/* Exibe este campo de entrada de dados. */}
                                <input
                                    key={inputFoto}
                                    id="arquivo_foto"
                                    className={css.input_file_escondido}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    onChange={selecionarFoto}
                                />
                            </div>

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {foto && (
                                <div className={css.area_preview_foto}>
                                    {/* Renderiza o elemento span nesta parte da página. */}
                                    <span className={css.nome_arquivo}>{foto.name}</span>
                                    {/* Exibe este botão de ação. */}
                                    <button type="button" className={css.botao_remover_foto} onClick={removerFoto}>
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Agrupa os elementos desta parte da interface. */}
                        <div className={css.modal_botoes}>
                            {/* Exibe este botão de ação. */}
                            <button className={css.btn_salvar} type="submit" disabled={salvando}>
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {salvando ? "Salvando..." : "Finalizar Cadastro"}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CadastroCliente;
