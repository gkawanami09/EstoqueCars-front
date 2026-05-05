import css from "./CadastroCliente.module.css";
import Input from "../components/Input/Input.jsx";
import { useState } from "react";
import { IMaskInput } from "react-imask";
import { useNavigate } from "react-router-dom";

function CadastroCliente({ API }) {
    const navigate = useNavigate();
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cpf, setCpf] = useState("");
    const [foto, setFoto] = useState(null);
    const [inputFoto, setInputFoto] = useState(0);
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [tipoUsuario, setTipoUsuario] = useState("cliente");

    const [mensagem, setMensagem] = useState(null);
    const [salvando, setSalvando] = useState(false);

    function cabecalhoAutorizacao() {
        const token = localStorage.getItem("access_token");
        return token ? { Authorization: `Bearer ${token}` } : undefined;
    }

    async function lerRespostaJson(resposta) {
        const texto = await resposta.text();

        if (!texto) {
            return {};
        }

        try {
            return JSON.parse(texto);
        } catch {
            return {};
        }
    }

    function selecionarFoto(e) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            setFoto(null);
            return;
        }

        const tiposPermitidos = ["image/png", "image/jpeg"];
        if (!tiposPermitidos.includes(arquivo.type)) {
            setMensagem({ tipo: "erro", texto: "Aceitamos apenas arquivos png e jpeg." });
            setFoto(null);
            e.target.value = "";
            return;
        }

        setMensagem(null);
        setFoto(arquivo);
    }

    function removerFoto() {
        setFoto(null);
        setInputFoto((valorAtual) => valorAtual + 1);
    }

    async function cadastrar(e) {
        e.preventDefault();
        setMensagem(null);

        if (
            !nome.trim() ||
            !email.trim() ||
            !telefone.trim() ||
            !cpf.trim() ||
            !senha.trim() ||
            !confirmarSenha.trim()
        ) {
            setMensagem({ tipo: "erro", texto: "Preencha todos os campos obrigatórios." });
            return;
        }

        if (cpf.length !== 11) {
            setMensagem({ tipo: "erro", texto: "CPF deve ter exatamente 11 números." });
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem({ tipo: "erro", texto: "As senhas não coincidem." });
            return;
        }

        const formData = new FormData();
        formData.append("nome", nome);
        formData.append("email", email);
        formData.append("telefone", telefone);
        formData.append("cpf", cpf);
        formData.append("senha", senha);
        formData.append("tipo_usuario", tipoUsuario === "vendedor" ? "1" : "0");

        if (foto) {
            formData.append("foto_perfil", foto);
        }

        setSalvando(true);

        try {
            const retorno = await fetch(`${API}/criar_usuario`, {
                method: "POST",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });

            const dados = await lerRespostaJson(retorno);

            if (!retorno.ok) {
                setMensagem({ tipo: "erro", texto: dados.erro || dados.mensagem || "Erro ao cadastrar." });
                return;
            }

            setMensagem({ tipo: "sucesso", texto: "Conta criada com sucesso!" });

            // Limpa o formulário após o sucesso (opcional, pode redirecionar também)
            setNome(""); setEmail(""); setTelefone(""); setCpf("");
            setSenha(""); setConfirmarSenha(""); removerFoto();
            navigate("/dashboardAdmClientes");

        } catch {
            setMensagem({ tipo: "erro", texto: "Não foi possível conectar ao servidor." });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className={css.layout_dashboard}>
            <main className={css.conteudo_principal}>

                <header className={css.cabecalho}>
                    <div>
                        <h1 className={css.titulo}>Cadastrar Usuário</h1>
                        <p className={css.subtitulo}>Preencha os dados para adicionar um novo cliente ou vendedor ao sistema.</p>
                    </div>
                </header>

                {mensagem && (
                    <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
                        <div className={css.mensagem_info}>
                            <span className={css.mensagem_icone}>{mensagem.tipo === "sucesso" ? "✓" : "!"}</span>
                            <div className={css.mensagem_texto}>
                                <strong>{mensagem.tipo === "sucesso" ? "Sucesso" : "Atenção"}</strong>
                                <span>{mensagem.texto}</span>
                            </div>
                        </div>
                        <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">x</button>
                    </div>
                )}

                <section className={css.card_formulario}>
                    <form onSubmit={cadastrar}>

                        <div className={css.area_tipo_usuario}>
                            <span className={css.label_tipo}>Perfil do Usuário:</span>
                            <div className={css.opcoes_tipo}>
                                <label className={css.radio_label}>
                                    <input
                                        type="radio"
                                        value="cliente"
                                        checked={tipoUsuario === "cliente"}
                                        onChange={(e) => setTipoUsuario(e.target.value)}
                                    />
                                    Cliente
                                </label>
                                <label className={css.radio_label}>
                                    <input
                                        type="radio"
                                        value="vendedor"
                                        checked={tipoUsuario === "vendedor"}
                                        onChange={(e) => setTipoUsuario(e.target.value)}
                                    />
                                    Vendedor
                                </label>
                            </div>
                        </div>

                        <div className={css.form_grid}>
                            <div className={css.campo_inteiro}>
                                <Input
                                    label="Nome Completo"
                                    type="text"
                                    img="/ImgCadastro/pessoa.png"
                                    alt="icone"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    required={true}
                                />
                            </div>

                            <div className={css.campo_inteiro}>
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

                            <div>
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

                            <div>
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

                            <div>
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

                            <div>
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
                        </div>

                        <div className={css.area_upload_wrapper}>
                            <span className={css.label_tipo}>Foto de Perfil (Opcional):</span>
                            <div className={css.area_upload}>
                                <label className={css.botao_upload} htmlFor="arquivo_foto">
                                    Selecionar Imagem
                                </label>
                                <span className={css.texto_upload}>Apenas PNG e JPEG</span>
                                <input
                                    key={inputFoto}
                                    id="arquivo_foto"
                                    className={css.input_file_escondido}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                                    onChange={selecionarFoto}
                                />
                            </div>

                            {foto && (
                                <div className={css.area_preview_foto}>
                                    <span className={css.nome_arquivo}>{foto.name}</span>
                                    <button type="button" className={css.botao_remover_foto} onClick={removerFoto}>
                                        Remover
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={css.modal_botoes}>
                            <button className={css.btn_salvar} type="submit" disabled={salvando}>
                                {salvando ? "Salvando..." : "Finalizar Cadastro"}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CadastroCliente;
