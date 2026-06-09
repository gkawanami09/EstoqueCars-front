// Importa recursos de ./CodigoRecupera.module.css.
import css from "./CodigoRecupera.module.css";
// Importa recursos de react-router-dom.
import { useNavigate } from "react-router-dom";
// Importa recursos de react.
import { useState } from "react";

// Declara a função CodigoRecupera usada por esta página.
function CodigoRecupera({ API }) {
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();

    // Declara os dados usados neste fluxo.
    const [etapa, setEtapa] = useState(1);
    // Declara os dados usados neste fluxo.
    const [tipo, setTipo] = useState("validarCodigo");
    // Declara os dados usados neste fluxo.
    const [email, setEmail] = useState("");
    // Declara os dados usados neste fluxo.
    const [codigo, setCodigo] = useState("");
    // Declara os dados usados neste fluxo.
    const [novaSenha, setNovaSenha] = useState("");
    // Declara os dados usados neste fluxo.
    const [confirmarSenha, setConfirmarSenha] = useState("");
    // Declara os dados usados neste fluxo.
    const [erro, setErro] = useState("");
    // Declara os dados usados neste fluxo.
    const [sucesso, setSucesso] = useState("");

    // Solicita para a API enviar o codigo de recuperacao ao email informado.
    async function enviarCodigo(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");

        // Verifica esta condição antes de continuar o fluxo.
        if (!email.trim()) {
            // Atualiza o estado por meio de setErro.
            setErro("Informe o e-mail cadastrado.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara retorno para uso neste fluxo.
        const retorno = await fetch(`${API}/codigo_verificacao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email })
        });

        // Executa json nesta etapa do fluxo.
        await retorno.json();

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setTipo.
        setTipo("validarCodigo");
        // Atualiza o estado por meio de setCodigo.
        setCodigo("");
        // Atualiza o estado por meio de setNovaSenha.
        setNovaSenha("");
        // Atualiza o estado por meio de setConfirmarSenha.
        setConfirmarSenha("");
        // Atualiza o estado por meio de setEtapa.
        setEtapa(2);
    }

    // Confere se o codigo digitado pertence ao email informado.
    async function validarCodigo(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");

        // Declara codigoLimpo para uso neste fluxo.
        const codigoLimpo = codigo.replace(/\D/g, "");

        // Verifica esta condição antes de continuar o fluxo.
        if (!email.trim() || !codigoLimpo.trim()) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara retorno para uso neste fluxo.
        const retorno = await fetch(`${API}/recuperar_senha`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                email,
                codigo: codigoLimpo
            })
        });

        // Declara dados para uso neste fluxo.
        const dados = await retorno.json();

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (!dados.valido) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setTipo.
        setTipo("redefinirSenha");
    }

    // Envia a nova senha para finalizar a recuperacao.
    async function redefinirSenha(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");

        // Declara codigoLimpo para uso neste fluxo.
        const codigoLimpo = codigo.replace(/\D/g, "");

        // Verifica esta condição antes de continuar o fluxo.
        if (!email.trim() || !codigoLimpo.trim() || !novaSenha.trim() || !confirmarSenha.trim()) {
            // Atualiza o estado por meio de setErro.
            setErro("Preencha todos os campos.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Verifica esta condição antes de continuar o fluxo.
        if (novaSenha !== confirmarSenha) {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Declara retorno para uso neste fluxo.
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

        // Declara dados para uso neste fluxo.
        const dados = await retorno.json();

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Atualiza o estado por meio de setErro.
            setErro(
                dados.erro_senha ||
                dados.erro ||
                dados.mensagem ||
                "Não foi possível redefinir a senha."
            );
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setSucesso.
        setSucesso(dados.mensagem || "Senha redefinida com sucesso!");
        // Navega o usuário para a próxima página do fluxo.
        navigate("/login");
    }

    // Declara a função voltarEtapaEmail usada por esta página.
    function voltarEtapaEmail() {
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");
        // Atualiza o estado por meio de setCodigo.
        setCodigo("");
        // Atualiza o estado por meio de setNovaSenha.
        setNovaSenha("");
        // Atualiza o estado por meio de setConfirmarSenha.
        setConfirmarSenha("");
        // Atualiza o estado por meio de setTipo.
        setTipo("validarCodigo");
        // Atualiza o estado por meio de setEtapa.
        setEtapa(1);
    }

    // Declara a função enviarEtapa2 usada por esta página.
    function enviarEtapa2(e) {
        // Verifica esta condição antes de continuar o fluxo.
        if (tipo === "redefinirSenha") {
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return redefinirSenha(e);
        }

        // Retorna o resultado desta função ou o conteúdo visual da página.
        return validarCodigo(e);
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_esquerda}>
                {/* Exibe esta imagem na interface. */}
                <img
                    className={css.imagem}
                    src="/ImgConfirmar/ImgConfirmar.png"
                    alt="Recuperação de conta por e-mail"
                />
            </div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.linha_vertical}></div>

            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_direita}>
                {/* Agrupa esta seção de conteúdo. */}
                <section className={css.conteudo}>
                    {/* Exibe o título principal desta página. */}
                    <h1 className={css.titulo}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {etapa === 1 ? "Recuperar sua" : "Redefinir sua"} <span>conta</span>
                    </h1>

                    {/* Exibe esta mensagem ou informação. */}
                    <p className={css.subtitulo}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {etapa === 1
                            ? "Informe o e-mail cadastrado para receber o código de recuperação."
                            : tipo === "validarCodigo"
                                ? "Informe o código recebido no e-mail para validar sua identidade."
                                : "Código validado. Agora defina sua nova senha."}
                    </p>

                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                    {etapa === 1 ? (
                        <form className={css.formulario} onSubmit={enviarCodigo}>
                            {/* Agrupa os elementos desta parte da interface. */}
                            <div className={css.email_area}>
                                {/* Relaciona um texto explicativo ao campo correspondente. */}
                                <label className={css.email_label}>E-mail</label>
                                {/* Exibe este campo de entrada de dados. */}
                                <input
                                    className={css.email_input}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@gmail.com"
                                />
                            </div>

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            {/* Exibe este botão de ação. */}
                            <button type="submit" className={css.botao_acao}>
                                Enviar código
                            </button>
                        </form>
                    ) : (
                        <form className={css.formulario} onSubmit={enviarEtapa2}>
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {tipo !== "redefinirSenha" && (
                                <div className={css.email_area}>
                                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                                    <label className={css.email_label}>E-mail</label>
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        className={css.email_input}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemplo@gmail.com"
                                    />
                                </div>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {tipo !== "redefinirSenha" && (
                                <div className={css.email_area}>
                                    {/* Relaciona um texto explicativo ao campo correspondente. */}
                                    <label className={css.email_label}>Código</label>
                                    {/* Exibe este campo de entrada de dados. */}
                                    <input
                                        type="text"
                                        className={css.email_input}
                                        value={codigo}
                                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        inputMode="numeric"
                                        maxLength={6}
                                        minLength={6}
                                        placeholder="000000"
                                    />
                                </div>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {tipo === "redefinirSenha" && (
                                <>
                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.email_area}>
                                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                                        <label className={css.email_label}>Nova senha</label>
                                        {/* Exibe este campo de entrada de dados. */}
                                        <input
                                            type="password"
                                            className={css.email_input}
                                            value={novaSenha}
                                            onChange={(e) => setNovaSenha(e.target.value)}
                                            placeholder="********"
                                        />
                                    </div>

                                    {/* Agrupa os elementos desta parte da interface. */}
                                    <div className={css.email_area}>
                                        {/* Relaciona um texto explicativo ao campo correspondente. */}
                                        <label className={css.email_label}>Confirmar nova senha</label>
                                        {/* Exibe este campo de entrada de dados. */}
                                        <input
                                            type="password"
                                            className={css.email_input}
                                            value={confirmarSenha}
                                            onChange={(e) => setConfirmarSenha(e.target.value)}
                                            placeholder="********"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            {/* Exibe este botão de ação. */}
                            <button type="submit" className={css.botao_acao}>
                                {/* Escolhe qual conteúdo exibir conforme a condição. */}
                                {tipo === "redefinirSenha" ? "Redefinir senha" : "Validar código"}
                            </button>

                            {/* Exibe este botão de ação. */}
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

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CodigoRecupera;
