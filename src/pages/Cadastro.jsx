// Importa recursos de ./Cadastro.module.css.
import css from "./Cadastro.module.css";
// Importa recursos de ../components/Input/Input.jsx.
import Input from "../components/Input/Input.jsx";
// Importa recursos de react-router-dom.
import {useNavigate} from "react-router-dom";
// Importa recursos de react.
import {useState} from "react";
// Importa recursos de react-imask.
import {IMaskInput} from "react-imask";

// Declara a função Cadastro usada por esta página.
function Cadastro({API}) {
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
    const [erro, setErro] = useState("");
   // Declara navigate para uso neste fluxo.
   const navigate = useNavigate();

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
            // Atualiza o estado por meio de setErro.
            setErro("Aceitamos apenas arquivos png e jpeg.");
            // Atualiza o estado por meio de setFoto.
            setFoto(null);
            // Executa esta etapa do fluxo.
            e.target.value = "";
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setErro.
        setErro("");
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

    // Envia os dados do formulario para criar o usuario na API.
    async function cadastrar(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");

        // Verifica esta condição antes de continuar o fluxo.
        if (
            !nome.trim() ||
            !email.trim() ||
            !telefone.trim() ||
            !cpf.trim() ||
            !senha.trim() ||
            !confirmarSenha.trim()
        ) {
            // Atualiza o estado por meio de setErro.
            setErro("Preencha todos os campos.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (cpf.length !== 11) {
            // Atualiza o estado por meio de setErro.
            setErro("CPF deve ter exatamente 11 números.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (senha !== confirmarSenha) {
            // Atualiza o estado por meio de setErro.
            setErro("As senhas não coincidem.");
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
        if (foto) {
            // Executa append nesta etapa do fluxo.
            formData.append("foto_perfil", foto);
        }

        // FormData permite enviar texto e foto de perfil no mesmo request.
        const retorno = await fetch(`${API}/criar_usuario`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        // Declara dados para uso neste fluxo.
        const dados = await retorno.json();

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Atualiza o estado por meio de setErro.
            setErro(dados.erro || dados.mensagem || "Erro ao cadastrar.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Navega o usuário para a próxima página do fluxo.
        navigate("/confirmar-email", {state: {email}});
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_esquerda}>
                {/* Exibe esta imagem na interface. */}
                <img className={css.imagem} src="/ImgCadastro/ImgCadastro.png" alt="Homem com carro"/>
            </div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.linha_vertical}></div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_direita}>
                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formulario} onSubmit={cadastrar}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.cabecalho_form}>
                        {/* Exibe o título principal desta página. */}
                        <h1 className={css.titulo}><span>Crie</span> sua Conta</h1>
                        {/* Renderiza o elemento h6 nesta parte da página. */}
                        <h6 className={css.subtitulo}>Preencha os dados abaixo para criar sua conta</h6>
                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                        {erro && <p className={css.erro_api}>{erro}</p>}
                    </div>


                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.campo_inteiro}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Nome"
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
                    <div className={css.campo_metade}>
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
                    <div className={css.campo_metade}>
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
                    <div className={css.campo_metade}>
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
                    <div className={css.campo_metade}>
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

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_upload}>
                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                        <label className={css.botao_upload} htmlFor="arquivo_foto">
                            Escolha o arquivo
                        </label>
                        {/* Renderiza o elemento span nesta parte da página. */}
                        <span className={css.texto_upload}>Aceitamos apenas arquivos png e jpeg</span>
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
                            <span className={css.nome_arquivo}>Arquivo selecionado: {foto.name}</span>
                            {/* Exibe este botão de ação. */}
                            <button
                                type="button"
                                className={css.botao_remover_foto}
                                onClick={removerFoto}
                            >
                                Remover foto
                            </button>
                        </div>
                    )}

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_botao}>
                        {/* Exibe este botão de ação. */}
                        <button className={css.botao_criar} type="submit">
                            Criar Conta
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default Cadastro;