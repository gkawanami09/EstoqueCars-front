import css from "./Login.module.css";
import Input from "../components/Input/Input.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login({ API }) {
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState("")
    const navigate = useNavigate()

    function pegarTipoUsuario(dados) {
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
        e.preventDefault()
        setErro("")

        if (!email.trim() || !senha.trim()) {
            setErro("Preencha todos os campos.")
            return
        }

        // credentials include mantem cookies de sessao/token enviados pelo backend.
        const retorno = await fetch(`${API}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, senha })
        })

        const dados = await retorno.json()

        if (!retorno.ok) {
            setErro(dados.erro || dados.mensagem || "Falha no login.")
            return
        }

        const nomePadrao = email.split("@")[0]
        const nome =
            dados.nome ||
            nomePadrao
        const tipoUsuario = pegarTipoUsuario(dados)

        localStorage.removeItem("usuário_logado")
        localStorage.setItem("usuario_logado", JSON.stringify({
            id_usuario: dados.id_usuario || dados.id_user || dados.id,
            nome,
            email,
            telefone: dados.telefone || "",
            cpf: dados.cpf || "",
            tipo_usuario: tipoUsuario
        }))

        const token = dados.token || dados.access_token
        if (token) {
            localStorage.setItem("access_token", token)
        }

        if (tipoUsuario === 2) {
            navigate("/dashboardAdm")
            return
        }

        navigate("/dashboard")
    }

    return (
        <main className={css.container}>
            <div className={css.coluna_esquerda}>
                <img className={css.imagem} src="/ImgLogin/ImgLogin.png" alt="Homem sentado no pneu" />
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <form className={css.formulario} onSubmit={entrar}>
                    <div className={css.cabecalho_form}>
                        <h1 className={css.titulo}>Faça <span>login</span> na sua conta</h1>
                        <p className={css.subtitulo}>
                            Entre para acessar a sua conta e comprar os <br /> melhores carros usados.
                        </p>
                        {erro && <p className={css.erro_api}>{erro}</p>}
                    </div>

                    <div className={css.campo}>
                        <Input
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            img="/ImgLogin/Email.png"
                            required={true}
                        />
                    </div>

                    <div className={css.campo}>
                        <Input
                            label="Senha"
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            img="/ImgLogin/Cadeado.png"
                            required={true}
                        />
                    </div>

                    <div className={css.area_esqueceu_senha}>
                        <Link to="/CodigoRecupera" className={css.link_esqueceu}>
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <div className={css.area_esqueceu_senha}>
                        <Link to="/confirmar-email" state={{ email }} className={css.link_esqueceu}>
                            Validar e-mail
                        </Link>
                    </div>

                    <div className={css.area_botao}>
                        <button type="submit" className={css.botao_entrar}>
                            Entrar
                        </button>
                        
                    </div>
                </form>
            </div>
        </main>
    )
}

export default Login
