import css from "./ConfirmarEmail.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function ConfirmarEmail({ API }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(location.state?.email || "")
    const [codigo, setCodigo] = useState("")
    const [erro, setErro] = useState("")
    const [sucesso, setSucesso] = useState("")

    // Confirma o codigo recebido por email antes de liberar a conta.
    async function verificarCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const codigoLimpo = codigo.replace(/\D/g, "")

        if (!email.trim() || codigoLimpo.length !== 6) {
            return;
        }

        // Envia email e codigo para a rota de confirmacao da API.
        const retorno = await fetch(`${API}/confirmar_email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, codigo: codigoLimpo })
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            return;
        }

        setSucesso(dados.mensagem || "E-mail confirmado com sucesso!");
        navigate("/login");
    }

    return (
        <main className={css.container}>
            <div className={css.coluna_esquerda}>
                <img className={css.imagem} src="/ImgConfirmar/ImgConfirmar.png" alt="Confirma��o por e-mail" />
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <section className={css.conteudo}>

                    <form className={css.formulario} onSubmit={verificarCodigo}>
                        <div className={css.email_area}>
                            <label className={css.email_label}>E-mail</label>
                            <input
                                className={css.email_input}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemplo@gmail.com"
                            />
                        </div>

                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className={css.codigo_input_unico}
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                        />

                        {erro && <p className={css.erro_api}>{erro}</p>}
                        {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                        <button type="submit" className={css.botao_verificar}>
                        </button>
                    </form>

                </section>
            </div>
        </main>
    );
}

export default ConfirmarEmail;