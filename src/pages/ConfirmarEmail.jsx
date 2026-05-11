import css from "./ConfirmarEmail.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

function ConfirmarEmail({ API }) {
    const location = useLocation();
    const navigate = useNavigate();

    const [etapa, setEtapa] = useState(1);
    const [email, setEmail] = useState(location.state?.email || "");
    const [codigo, setCodigo] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    function continuarParaCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const emailLimpo = email.trim();

        if (!emailLimpo) {
            setErro("Informe o e-mail cadastrado.");
            return;
        }

        setEmail(emailLimpo);
        setCodigo("");
        setEtapa(2);
    }

    // Confirma o codigo recebido por email antes de liberar a conta.
    async function verificarCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const emailLimpo = email.trim();
        const codigoLimpo = codigo.replace(/\D/g, "");

        if (!emailLimpo || codigoLimpo.length !== 6) {
            setErro("Informe os 6 dígitos do código.");
            return;
        }

        // Envia email e codigo para a rota de confirmacao da API.
        const retorno = await fetch(`${API}/confirmar_email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email: emailLimpo,
                codigo: codigoLimpo
            })
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            setErro(dados.erro || dados.mensagem || "Não foi possível confirmar o e-mail.");
            return;
        }

        setSucesso(dados.mensagem || "E-mail confirmado com sucesso!");
        navigate("/login");
    }

    function voltarParaEmail() {
        setErro("");
        setSucesso("");
        setCodigo("");
        setEtapa(1);
    }

    return (
        <main className={css.container}>
            <div className={css.coluna_esquerda}>
                <img className={css.imagem} src="/ImgConfirmar/ImgConfirmar.png" alt="Confirmação por e-mail" />
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <section className={css.conteudo}>
                    <h1 className={css.titulo}>
                        {etapa === 1 ? "Confirmar seu" : "Digite o código de"} <span>{etapa === 1 ? "e-mail" : "verificação"}</span>
                    </h1>
                    <p className={css.subtitulo}>
                        {etapa === 1
                            ? "Informe o e-mail cadastrado para continuar."
                            : "Informe o código recebido no e-mail para validar sua conta."}
                    </p>

                    {etapa === 1 ? (
                        <form className={css.formulario} onSubmit={continuarParaCodigo}>
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

                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            <button type="submit" className={css.botao_verificar}>
                                Continuar
                            </button>
                        </form>
                    ) : (
                        <form className={css.formulario} onSubmit={verificarCodigo}>
                            <p className={css.email_confirmado}>{email}</p>

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className={css.codigo_input_unico}
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                            />

                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            <button type="submit" className={css.botao_verificar}>
                                Verificar código
                            </button>

                            <button
                                type="button"
                                className={css.botao_secundario}
                                onClick={voltarParaEmail}
                            >
                                Alterar e-mail
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </main>
    );
}

export default ConfirmarEmail;
