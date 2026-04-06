import css from "./Cadastro.module.css";
import Input from "../components/Input/Input.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Cadastro({ API }) {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cpf, setCpf] = useState("");
    const [foto, setFoto] = useState(null);
    const [inputFoto, setInputFoto] = useState(0);
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    function selecionarFoto(e) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            setFoto(null);
            return;
        }

        const tiposPermitidos = ["image/png", "image/jpeg"];
        if (!tiposPermitidos.includes(arquivo.type)) {
            setErro("Aceitamos apenas arquivos png e jpeg.");
            setFoto(null);
            e.target.value = "";
            return;
        }

        setErro("");
        setFoto(arquivo);
    }

    function removerFoto() {
        setFoto(null);
        setInputFoto((valorAtual) => valorAtual + 1);
    }

    async function cadastrar(e) {
        e.preventDefault();
        setErro("");

        if (
            !nome.trim() ||
            !email.trim() ||
            !telefone.trim() ||
            !cpf.trim() ||
            !senha.trim() ||
            !confirmarSenha.trim()
        ) {
            setErro("Preencha todos os campos.");
            return;
        }

        if (cpf.length !== 11) {
            setErro("CPF deve ter exatamente 11 números.");
            return;
        }

        if (senha !== confirmarSenha) {
            setErro("As senhas não coincidem.");
            return;
        }

        const formData = new FormData();
        formData.append("nome", nome);
        formData.append("email", email);
        formData.append("telefone", telefone);
        formData.append("cpf", cpf);
        formData.append("senha", senha);
        if (foto) {
            formData.append("foto_perfil", foto);
        }

        const retorno = await fetch(`${API}/criar_usuario`, {
            method: "POST",
            credentials: "include",
            body: formData
        });

        const dados = await retorno.json();

        if (!retorno.ok) {
            setErro(dados.erro || dados.mensagem || "Erro ao cadastrar.");
            return;
        }

        navigate("/confirmar-email", { state: { email } });
    }

    return (
        <main className={css.container}>
            <div className={css.coluna_esquerda}>
                <img className={css.imagem} src="/ImgCadastro/ImgCadastro.png" alt="Homem com carro" />
            </div>

            <div className={css.linha_vertical}></div>

            <div className={css.coluna_direita}>
                <form className={css.formulario} onSubmit={cadastrar}>
                    <div className={css.cabecalho_form}>
                        <h1 className={css.titulo}><span>Crie</span> sua Conta</h1>
                        <h6 className={css.subtitulo}>Preencha os dados abaixo para criar sua conta</h6>
                        {erro && <p className={css.erro_api}>{erro}</p>}
                    </div>

                    <div className={css.area_upload}>
                        <label className={css.botao_upload} htmlFor="arquivo_foto">
                            Escolha o arquivo
                        </label>
                        <span className={css.texto_upload}>Aceitamos apenas arquivos png e jpeg</span>
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
                            <span className={css.nome_arquivo}>Arquivo selecionado: {foto.name}</span>
                            <button
                                type="button"
                                className={css.botao_remover_foto}
                                onClick={removerFoto}
                            >
                                Remover foto
                            </button>
                        </div>
                    )}

                    <div className={css.campo_inteiro}>
                        <Input
                            label="Nome"
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

                    <div className={css.campo_metade}>
                        <Input
                            label="Telefone"
                            type="text"
                            img="/ImgCadastro/telefone.png"
                            alt="icone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                            inputMode="numeric"
                            maxLength={11}
                            minLength={11}
                            required={true}
                        />
                    </div>

                    <div className={css.campo_metade}>
                        <Input
                            label="CPF"
                            type="text"
                            img="/ImgCadastro/cadeado.png"
                            alt="icone"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                            inputMode="numeric"
                            maxLength={11}
                            minLength={11}
                            pattern="[0-9]{11}"
                            required={true}
                        />
                    </div>

                    <div className={css.campo_metade}>
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

                    <div className={css.campo_metade}>
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

                    <div className={css.area_botao}>
                        <button className={css.botao_criar} type="submit">
                            Criar Conta
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default Cadastro;
