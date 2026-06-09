// Importa recursos de ./ConfirmarEmail.module.css.
import css from "./ConfirmarEmail.module.css";
// Importa recursos de react-router-dom.
import { useLocation, useNavigate } from "react-router-dom";
// Importa recursos de react.
import { useState } from "react";

// Declara a função ConfirmarEmail usada por esta página.
function ConfirmarEmail({ API }) {
    // Declara location para uso neste fluxo.
    const location = useLocation();
    // Declara navigate para uso neste fluxo.
    const navigate = useNavigate();

    // Declara os dados usados neste fluxo.
    const [etapa, setEtapa] = useState(1);
    // Declara os dados usados neste fluxo.
    const [email, setEmail] = useState(location.state?.email || "");
    // Declara os dados usados neste fluxo.
    const [codigo, setCodigo] = useState("");
    // Declara os dados usados neste fluxo.
    const [erro, setErro] = useState("");
    // Declara os dados usados neste fluxo.
    const [sucesso, setSucesso] = useState("");

    // Declara a função continuarParaCodigo usada por esta página.
    function continuarParaCodigo(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");

        // Declara emailLimpo para uso neste fluxo.
        const emailLimpo = email.trim();

        // Verifica esta condição antes de continuar o fluxo.
        if (!emailLimpo) {
            // Atualiza o estado por meio de setErro.
            setErro("Informe o e-mail cadastrado.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setEmail.
        setEmail(emailLimpo);
        // Atualiza o estado por meio de setCodigo.
        setCodigo("");
        // Atualiza o estado por meio de setEtapa.
        setEtapa(2);
    }

    // Confirma o codigo recebido por email antes de liberar a conta.
    async function verificarCodigo(e) {
        // Executa preventDefault nesta etapa do fluxo.
        e.preventDefault();
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");

        // Declara emailLimpo para uso neste fluxo.
        const emailLimpo = email.trim();
        // Declara codigoLimpo para uso neste fluxo.
        const codigoLimpo = codigo.replace(/\D/g, "");

        // Verifica esta condição antes de continuar o fluxo.
        if (!emailLimpo || codigoLimpo.length !== 6) {
            // Atualiza o estado por meio de setErro.
            setErro("Informe os 6 dígitos do código.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
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

        // Declara dados para uso neste fluxo.
        const dados = await retorno.json();

        // Verifica esta condição antes de continuar o fluxo.
        if (!retorno.ok) {
            // Atualiza o estado por meio de setErro.
            setErro(dados.erro || dados.mensagem || "Não foi possível confirmar o e-mail.");
            // Retorna o resultado desta função ou o conteúdo visual da página.
            return;
        }

        // Atualiza o estado por meio de setSucesso.
        setSucesso(dados.mensagem || "E-mail confirmado com sucesso!");
        // Navega o usuário para a próxima página do fluxo.
        navigate("/login");
    }

    // Declara a função voltarParaEmail usada por esta página.
    function voltarParaEmail() {
        // Atualiza o estado por meio de setErro.
        setErro("");
        // Atualiza o estado por meio de setSucesso.
        setSucesso("");
        // Atualiza o estado por meio de setCodigo.
        setCodigo("");
        // Atualiza o estado por meio de setEtapa.
        setEtapa(1);
    }

    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa os elementos desta parte da interface. */}
            <div className={css.coluna_esquerda}>
                {/* Exibe esta imagem na interface. */}
                <img className={css.imagem} src="/ImgConfirmar/ImgConfirmar.png" alt="Confirmação por e-mail" />
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
                        {etapa === 1 ? "Confirmar seu" : "Digite o código de"} <span>{etapa === 1 ? "e-mail" : "verificação"}</span>
                    </h1>
                    {/* Exibe esta mensagem ou informação. */}
                    <p className={css.subtitulo}>
                        {/* Escolhe qual conteúdo exibir conforme a condição. */}
                        {etapa === 1
                            ? "Informe o e-mail cadastrado para continuar."
                            : "Informe o código recebido no e-mail para validar sua conta."}
                    </p>

                    {/* Escolhe qual conteúdo exibir conforme a condição. */}
                    {etapa === 1 ? (
                        <form className={css.formulario} onSubmit={continuarParaCodigo}>
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
                            <button type="submit" className={css.botao_verificar}>
                                Continuar
                            </button>
                        </form>
                    ) : (
                        <form className={css.formulario} onSubmit={verificarCodigo}>
                            {/* Exibe esta mensagem ou informação. */}
                            <p className={css.email_confirmado}>{email}</p>

                            {/* Exibe este campo de entrada de dados. */}
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                className={css.codigo_input_unico}
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000"
                            />

                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {erro && <p className={css.erro_api}>{erro}</p>}
                            {/* Renderiza este conteúdo somente quando a condição for atendida. */}
                            {sucesso && <p className={css.sucesso_api}>{sucesso}</p>}

                            {/* Exibe este botão de ação. */}
                            <button type="submit" className={css.botao_verificar}>
                                Verificar código
                            </button>

                            {/* Exibe este botão de ação. */}
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

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default ConfirmarEmail;
