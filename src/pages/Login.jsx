import css from "./Login.module.css";
import Input from "../components/Input/Input.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login({ API }) {
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState("")
    const navigate = useNavigate()

    async function entrar(e) {
        e.preventDefault()
        setErro("")

        if (!email.trim() || !senha.trim()) {
            setErro("Preencha todos os campos.")
            return
        }

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

        localStorage.setItem("usuario_logado", JSON.stringify({ nome, email }))

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
