import css from "./CodigoRecupera.module.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function CodigoRecupera({ API }) {
    const navigate = useNavigate();

    const [etapa, setEtapa] = useState(1);
    const [tipo, setTipo] = useState("validarCodigo");
    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // Solicita para a API enviar o codigo de recuperacao ao email informado.
    async function enviarCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        if (!email.trim()) {
            setErro("Informe o e-mail cadastrado.");
            return;
        }

        const retorno = await fetch(`${API}/codigo_verificacao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email })
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            return;
        }

        setTipo("validarCodigo");
        setCodigo("");
        setNovaSenha("");
        setConfirmarSenha("");
        setEtapa(2);
    }

    // Confere se o codigo digitado pertence ao email informado.
    async function validarCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const codigoLimpo = codigo.replace(/\D/g, "");

        if (!email.trim() || !codigoLimpo.trim()) {
            return;
        }

        const retorno = await fetch(`${API}/recuperar_senha`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email,
                codigo: codigoLimpo
            })
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            return;
        }

        if (!dados.valido) {
            return;
        }

        setTipo("redefinirSenha");
    }

    // Envia a nova senha para finalizar a recuperacao.
    async function redefinirSenha(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const codigoLimpo = codigo.replace(/\D/g, "");

        if (!email.trim() || !codigoLimpo.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
            setErro("Preencha todos os campos.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            return;
        }

        const retorno = await fetch(`${API}/recuperar_senha`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email,
                codigo: codigoLimpo,
                nova_senha: novaSenha
            })
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            setErro(
                dados.erro_senha ||
                dados.erro ||
                dados.mensagem ||
            );
            return;
        }

        setSucesso(dados.mensagem || "Senha redefinida com sucesso!");
        navigate("/login");
    }

    function voltarEtapaEmail() {
        setErro("");
        setSucesso("");
        setCodigo("");
        setNovaSenha("");
        setConfirmarSenha("");
        setTipo("validarCodigo");
        setEtapa(1);
    }

    function enviarEtapa2(e) {
        if (tipo === "redefinirSenha") {
            return redefinirSenha(e);
        }

        return validarCodigo(e);
    }

    return (
        <main className={css.container}>
            <div className={css.coluna_esquerda}>
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <section className={css.conteudo}>
                    <h1 className={css.titulo}>
                        {etapa === 1 ? "Recuperar sua" : "Redefinir sua"} <span>conta</span>
                    </h1>

                    <p className={css.subtitulo}>
                        {etapa === 1
                            : tipo === "validarCodigo"
                                ? "Informe o c�digo recebido no e-mail para validar sua identidade."
                                : "C�digo validado. Agora defina sua nova senha."}
                    </p>

                    {etapa === 1 ? (
                        <form className={css.formulario} onSubmit={enviarCodigo}>
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

                            <button type="submit" className={css.botao_acao}>
                            </button>
                        </form>
                    ) : (
                        <form className={css.formulario} onSubmit={enviarEtapa2}>
                            {tipo !== "redefinirSenha" && (
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
                            )}
                             {tipo !== "redefinirSenha" && (
                            <div className={css.email_area}>
                                <input
                                    type="text"
                                    className={css.email_input}
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    inputMode="numeric"
                                    maxLength={6}
                                    minLength={6}
                                />
                            </div>
                             )}

                            {tipo === "redefinirSenha" && (
                                <>
                                    <div className={css.email_area}>
                                        <label className={css.email_label}>Nova senha</label>
                                        <input
                                            type="password"
                                            className={css.email_input}
                                            value={novaSenha}
                                            onChange={(e) => setNovaSenha(e.target.value)}
                                            placeholder="********"
                                        />
                                    </div>

                                    <div className={css.email_area}>
                                        <label className={css.email_label}>Confirmar nova senha</label>
                                        <input
                                            type="password"
                                            className={css.email_input}
                                            value={confirmarSenha}
                                            onChange={(e) => setConfirmarSenha(e.target.value)}
                                            placeholder="********"
                                        />
                                    </div>

                                    <p className={css.aviso}>
                                    </p>
                                </>
                            )}

                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            <button type="submit" className={css.botao_acao}>
                            </button>

                            <button
                                type="button"
                                className={css.botao_secundario}
                                onClick={voltarEtapaEmail}
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

export default CodigoRecupera;
