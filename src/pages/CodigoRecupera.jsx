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
            setErro(dados.erro || dados.mensagem || "Não foi possível enviar o código.");
            return;
        }

        setSucesso(dados.mensagem || "Código enviado para seu e-mail.");
        setTipo("validarCodigo");
        setCodigo("");
        setNovaSenha("");
        setConfirmarSenha("");
        setEtapa(2);
    }

    async function validarCodigo(e) {
        e.preventDefault();
        setErro("");
        setSucesso("");

        const codigoLimpo = codigo.replace(/\D/g, "");

        if (!email.trim() || !codigoLimpo.trim()) {
            setErro("Preencha e-mail e código.");
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
            setErro(dados.erro || dados.mensagem || "Não foi possível validar o código.");
            return;
        }

        if (!dados.valido) {
            setErro(dados.erro || dados.mensagem || "Código inválido.");
            return;
        }

        setTipo("redefinirSenha");
        setSucesso(dados.mensagem || "Código válido! Agora defina sua nova senha.");
    }

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
            setErro("As senhas não coincidem.");
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
                "Não foi possível redefinir a senha."
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
                <img className={css.imagem} src="/ImgConfirmar/ImgConfirmar.png" alt="Recuperação de conta" />
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <section className={css.conteudo}>
                    <h1 className={css.titulo}>
                        {etapa === 1 ? "Recuperar sua" : "Redefinir sua"} <span>conta</span>
                    </h1>

                    <p className={css.subtitulo}>
                        {etapa === 1
                            ? "Digite seu e-mail para receber o código de recuperação."
                            : tipo === "validarCodigo"
                                ? "Informe o código recebido no e-mail para validar sua identidade."
                                : "Código validado. Agora defina sua nova senha."}
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
                                Enviar código
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
                                <label className={css.email_label}>Código</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className={css.email_input}
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Digite o código"
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
                                        A nova senha deve seguir as regras do sistema e não pode repetir suas 3 últimas senhas.
                                    </p>
                                </>
                            )}

                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            <button type="submit" className={css.botao_acao}>
                                {tipo === "validarCodigo" ? "Confirmar Código" : "Redefinir Senha"}
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

