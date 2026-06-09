// Importa recursos de ./Login.module.css.
import css from "./Login.module.css";
// Importa recursos de ../components/Input/Input.jsx.
import Input from "../components/Input/Input.jsx";
// Importa recursos de react-router-dom.
import { Link, useNavigate } from "react-router-dom";
// Importa recursos de react.
import { useState } from "react";

// Declara a função Login usada por esta página.
function Login({ API }) {
    // Declara os dados usados neste fluxo.
    const [email, setEmail] = useState("")
    // Declara os dados usados neste fluxo.
    const [senha, setSenha] = useState("")
    // Declara os dados usados neste fluxo.
    const [erro, setErro] = useState("")
   // Declara navigate para uso neste fluxo.
   const navigate = useNavigate()

    // Declara a função pegarTipoUsuario usada por esta página.
    function pegarTipoUsuario(dados) {
        // Retorna o resultado desta função ou o conteúdo visual da página.
        return Number(
            dados.tipo_usuario ??
            dados["tipo_usuario"] ??
            dados.tipoUsuario ??
            dados.TIPO_USUARIO ??
            dados.tipo ??
            1
        )
    }

    // Valida o login na API e salva os dados do usuario no localStorage.
    async function entrar(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault()
        // Atualiza o estado por meio de setErro.
        setErro("")

        // Verifica esta condição antes de continuar o fluxo.
        if (!email.trim() || !senha.trim()) {
            // Atualiza o estado por meio de setErro.
            setErro("Preencha todos os campos.")
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return
        }

        // credentials include mantem cookies de sessao/token enviados pelo backend.
        const retorno = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, senha })
        })

        // Declara dados para uso neste fluxo.
        const dados = await retorno.json()

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Atualiza o estado por meio de setErro.
            setErro(dados.erro || dados.mensagem || "Falha no login.")
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return
        }

        // Declara nomePadrao para uso neste fluxo.
        const nomePadrao = email.split("@")[0]
        // Declara nome para uso neste fluxo.
        const nome =
            dados.nome ||
            nomePadrao
        // Declara tipoUsuario para uso neste fluxo.
        const tipoUsuario = pegarTipoUsuario(dados)

        // Executa removeItem nesta etapa do fluxo.
        localStorage.removeItem("usuário_logado")
        // Atualiza o estado por meio de setItem.
        localStorage.setItem("usuario_logado", JSON.stringify({
            id_usuario: dados.id_usuario || dados.id_user || dados.id,
            nome,
            email,
            telefone: dados.telefone || "",
            cpf: dados.cpf || "",
            tipo_usuario: tipoUsuario
        }))

        // Declara token para uso neste fluxo.
        const token = dados.token || dados.access_token
        // Verifica esta condição antes de continuar o fluxo.
        if (token) {
            // Atualiza o estado por meio de setItem.
            localStorage.setItem("access_token", token)
        }

        // Verifica esta condição antes de continuar o fluxo.
        if ([1, 2].includes(tipoUsuario)) {
            // Navega o usuário para a próxima página do fluxo.
            navigate("/dashboardAdm")
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return
        }

        // Navega o usuário para a próxima página do fluxo.
        navigate("/dashboard")
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_esquerda}>
                {/* Exibe esta imagem na interface. */}
                <img className={css.imagem} src="/ImgLogin/ImgLogin.png" alt="Homem sentado no pneu" />
            </div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.linha_vertical}></div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_direita}>
                {/* Agrupa os campos e ações deste formulário. */}
                <form className={css.formulario} onSubmit={entrar}>
                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.cabecalho_form}>
                        {/* Exibe o título principal desta página. */}
                        <h1 className={css.titulo}>Faça <span>login</span> na sua conta</h1>
                        {/* Exibe esta mensagem ou informação. */}
                        <p className={css.subtitulo}>
                            {/* Renderiza o elemento br nesta parte da página. */}
                            Entre para acessar a sua conta e comprar os <br /> melhores carros usados.
                        </p>
                        {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                        {erro && <p className={css.erro_api}>{erro}</p>}
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.campo}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            img="/ImgLogin/Email.png"
                            required={true}
                        />
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.campo}>
                        {/* Renderiza o componente Input nesta parte da página. */}
                        <Input
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            img="/ImgLogin/Cadeado.png"
                            required={true}
                        />
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_esqueceu_senha}>
                        {/* Renderiza o componente Link nesta parte da página. */}
                        <Link to="/CodigoRecupera" className={css.link_esqueceu}>
                            Esqueceu a senha?
                        </Link>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_esqueceu_senha}>
                        {/* Renderiza o componente Link nesta parte da página. */}
                        <Link to="/confirmar-email" state={{ email }} className={css.link_esqueceu}>
                            Validar e-mail
                        </Link>
                    </div>

                    {/* Agrupa os elementos desta parte da interface. */}
                    <div className={css.area_botao}>
                        {/* Exibe este botão de ação. */}
                        <button type="submit" className={css.botao_entrar}>
                            Entrar
                        </button>
                        
                    </div>
                </form>
            </div>
        </main>
    )
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default Login
