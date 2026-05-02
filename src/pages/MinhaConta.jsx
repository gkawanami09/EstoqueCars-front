// Importa hooks usados para estado e dados iniciais.
import { useMemo, useState } from "react";
// Importa input com mascara para telefone e CPF.
import { IMaskInput } from "react-imask";
// Importa CSS module desta tela.
import css from "./MinhaConta.module.css";

// Usuario vazio usado quando nao existe usuario salvo.
const usuarioVazio = {
    id_usuario: "",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    tipo_usuario: ""
};

// Le o usuario salvo no localStorage depois do login.
function lerUsuarioLogado() {
    try {
        // Tenta converter o JSON salvo no navegador.
        return JSON.parse(localStorage.getItem("usuario_logado")) || usuarioVazio;
    } catch {
        // Se der erro no JSON, usa usuario vazio.
        return usuarioVazio;
    }
}

// Tenta pegar o ID do usuario dentro do token JWT.
function idPeloToken() {
    // Busca token salvo no navegador.
    const token = localStorage.getItem("access_token");

    // Token JWT precisa ter pontos.
    if (!token || !token.includes(".")) {
        return "";
    }

    try {
        // Decodifica a parte do payload do JWT.
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        // Aceita varios nomes possiveis para o id.
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        // Se nao conseguir ler, retorna vazio.
        return "";
    }
}

// Monta a URL da foto quando a API retorna caminho ou nome de arquivo.
function montarUrlFoto(API, valor) {
    // Sem valor, nao tem foto.
    if (!valor) {
        return "";
    }

    // Se ja veio URL completa, usa direto.
    if (String(valor).startsWith("http")) {
        return valor;
    }

    // Se veio caminho com barra, coloca a URL da API antes.
    if (String(valor).startsWith("/")) {
        return `${API}${valor}`;
    }

    // Se veio so o nome do arquivo, aponta para uploads.
    return `${API}/uploads/${valor}`;
}

// Tela Minha Conta do usuario.
function MinhaConta({ API }) {
    // Le usuario inicial apenas uma vez.
    const usuarioInicial = useMemo(() => lerUsuarioLogado(), []);
    // Guarda os dados base do usuario.
    const [usuarioBase, setUsuarioBase] = useState(usuarioInicial);
    // Descobre o ID pelo usuario salvo ou pelo token.
    const idUsuario = usuarioBase.id_usuario || usuarioBase.id_user || usuarioBase.id || idPeloToken();

    // Guarda os campos editaveis do formulario.
    const [formulario, setFormulario] = useState({
        nome: usuarioBase.nome || "",
        email: usuarioBase.email || "",
        telefone: usuarioBase.telefone || "",
        cpf: usuarioBase.cpf || "",
        senha: ""
    });
    // Guarda o arquivo de foto escolhido.
    const [foto, setFoto] = useState(null);
    // Guarda a URL temporaria para pre-visualizar a foto.
    const [previewFoto, setPreviewFoto] = useState("");
    // Guarda mensagem visual de sucesso ou erro.
    const [mensagem, setMensagem] = useState(null);
    // Controla carregamento do botao salvar.
    const [salvando, setSalvando] = useState(false);
    // Muda a URL da foto para forcar o navegador a recarregar.
    const [versaoFoto, setVersaoFoto] = useState(Date.now());
    // Controla qual extensao de foto esta sendo tentada.
    const [tentativaFoto, setTentativaFoto] = useState(0);

    // Lista de caminhos possiveis para a foto de perfil.
    const fotosPossiveis = [
        montarUrlFoto(API, usuarioBase.foto_perfil || usuarioBase.foto || usuarioBase.imagem),
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.pgn` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.png` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.jpg` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.jpeg` : "",
        idUsuario ? `${API}/uploads/${idUsuario}.jpg` : "",
        idUsuario ? `${API}/uploads/${idUsuario}.png` : "",
    ].filter(Boolean);

    // Escolhe a foto atual ou usa o icone padrao.
    const fotoPerfil = fotosPossiveis[tentativaFoto]
        ? `${fotosPossiveis[tentativaFoto]}?v=${versaoFoto}`
        : "/IconPerfil.png";

    // Atualiza um campo do formulario.
    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
    }

    // Guarda a foto escolhida pelo usuario.
    function selecionarFoto(e) {
        // Pega o primeiro arquivo escolhido.
        const arquivo = e.target.files?.[0];
        // Guarda arquivo para enviar no FormData.
        setFoto(arquivo || null);
        // Cria preview local da imagem.
        setPreviewFoto(arquivo ? URL.createObjectURL(arquivo) : "");
        // Reinicia tentativa de carregamento.
        setTentativaFoto(0);
    }

    // Volta os campos para o valor salvo.
    function limparFormulario() {
        setFormulario({
            nome: usuarioBase.nome || "",
            email: usuarioBase.email || "",
            telefone: usuarioBase.telefone || "",
            cpf: usuarioBase.cpf || "",
            senha: ""
        });
        // Remove foto escolhida.
        setFoto(null);
        // Remove preview.
        setPreviewFoto("");
        // Limpa mensagem.
        setMensagem(null);
    }

    // Atualiza o usuario salvo no localStorage depois do sucesso da API.
    function salvarUsuarioLocal() {
        // Monta objeto com dados atualizados.
        const usuarioAtualizado = {
            ...usuarioBase,
            id_usuario: idUsuario,
            nome: formulario.nome,
            email: formulario.email,
            telefone: formulario.telefone,
            cpf: formulario.cpf
        };

        // Salva no navegador.
        localStorage.setItem("usuario_logado", JSON.stringify(usuarioAtualizado));
        // Atualiza estado base.
        setUsuarioBase(usuarioAtualizado);
    }

    // Atualiza os dados da conta e envia foto/senha somente quando preenchidos.
    async function salvar(e) {
        // Impede refresh da pagina.
        e.preventDefault();
        // Limpa mensagem antiga.
        setMensagem(null);

        // Sem ID nao da para chamar a rota.
        if (!idUsuario) {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel identificar sua conta. Faca login novamente."
            });
            return;
        }

        // Nome e email sao obrigatorios.
        if (!formulario.nome.trim() || !formulario.email.trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Informe pelo menos nome e e-mail."
            });
            return;
        }

        // FormData permite enviar texto e arquivo juntos.
        const formData = new FormData();
        // Envia nome sem espacos sobrando.
        formData.append("nome", formulario.nome.trim());
        // Envia email sem espacos sobrando.
        formData.append("email", formulario.email.trim());
        // Envia telefone somente com numeros.
        formData.append("telefone", String(formulario.telefone || "").replace(/\D/g, ""));
        // Envia CPF somente com numeros.
        formData.append("cpf", String(formulario.cpf || "").replace(/\D/g, ""));

        // Senha so e enviada quando o usuario digitou uma nova.
        if (formulario.senha.trim()) {
            formData.append("senha", formulario.senha);
        }

        // Foto so e enviada quando o usuario escolheu arquivo.
        if (foto) {
            formData.append("foto_perfil", foto);
        }

        // Liga carregamento do botao.
        setSalvando(true);

        try {
            // Busca token para enviar no Authorization.
            const token = localStorage.getItem("access_token");
            // FormData e necessario porque a API tambem pode receber foto_perfil.
            const resposta = await fetch(`${API}/editar_usuario/${idUsuario}`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                credentials: "include",
                body: formData
            });
            // Converte resposta para JSON.
            const dados = await resposta.json();

            // Se a API retornou erro, mostra na tela.
            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel atualizar sua conta."
                });
                return;
            }

            // Atualiza o usuario local.
            salvarUsuarioLocal();
            // Limpa a senha depois de salvar.
            setFormulario((atual) => ({ ...atual, senha: "" }));
            // Limpa arquivo escolhido.
            setFoto(null);
            // Limpa preview.
            setPreviewFoto("");
            // Forca recarregar a imagem.
            setVersaoFoto(Date.now());
            // Volta para a primeira tentativa de foto.
            setTentativaFoto(0);
            // Mostra sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Conta atualizada com sucesso."
            });
        } catch {
            // Erro de conexao.
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            // Desliga carregamento.
            setSalvando(false);
        }
    }

    // Renderiza a tela.
    return (
        // Container principal.
        <div className={css.layout_minha_conta}>
            <main className={css.conteudo_principal}>
                <header className={css.cabecalho}>
                    <div>
                        <h1 className={css.titulo}>
                            Minha <span className={css.destaque_vermelho}>conta</span>
                        </h1>
                        <p className={css.subtitulo}>Gerencie suas informações pessoais e segurança</p>
                    </div>
                </header>

                {mensagem && (
                    <div className={`${css.mensagem} ${mensagem.tipo === "sucesso" ? css.mensagem_sucesso : css.mensagem_erro}`}>
                        <div>
                            <strong>{mensagem.tipo === "sucesso" ? "Tudo certo" : "Atencao"}</strong>
                            <span>{mensagem.texto}</span>
                        </div>
                        <button type="button" onClick={() => setMensagem(null)} aria-label="Fechar mensagem">
                            x
                        </button>
                    </div>
                )}

                <form className={css.container_cards} onSubmit={salvar}>
                    <section className={css.card_topo}>
                        <div className={css.info_usuario_topo}>
                            <div className={css.avatar_grande}>
                                <img
                                    src={previewFoto || fotoPerfil}
                                    alt="Avatar"
                                    className={css.img_avatar}
                                    onError={(e) => {
                                        if (tentativaFoto < fotosPossiveis.length - 1) {
                                            setTentativaFoto((atual) => atual + 1);
                                            return;
                                        }

                                        e.currentTarget.src = "/IconPerfil.png";
                                    }}
                                />
                            </div>
                            <div className={css.dados_usuario}>
                                <h2>{formulario.nome || "Usuario"}</h2>
                                <p>{formulario.email || "E-mail nao informado"}</p>
                                <p>{formulario.telefone || "Telefone nao informado"}</p>
                            </div>
                        </div>
                        <label className={css.alterar_foto_area}>
                            <span>Alterar foto de perfil</span>
                            <input type="file" accept="image/*" onChange={selecionarFoto} />
                            <div className={css.box_foto_placeholder}>
                                <img src="/IconAddFotoPerfil.png" alt="Adicionar foto" className={css.icone_add_foto} />
                            </div>
                        </label>
                    </section>

                    <div className={css.cards_inferiores}>
                        <section className={css.card_form}>
                            <h2 className={css.titulo_card}>Informações pessoais</h2>

                            <div className={css.grupo_input}>
                                <label>Nome completo</label>
                                <input
                                    type="text"
                                    value={formulario.nome}
                                    onChange={(e) => atualizarCampo("nome", e.target.value)}
                                    className={css.input_padrao}
                                    required
                                />
                            </div>

                            <div className={css.grupo_input}>
                                <label>E-mail</label>
                                <input
                                    type="email"
                                    value={formulario.email}
                                    onChange={(e) => atualizarCampo("email", e.target.value)}
                                    className={css.input_padrao}
                                    required
                                />
                            </div>

                            <div className={css.grupo_input}>
                                <label>Telefone</label>
                                <IMaskInput
                                    mask="(00) 00000-0000"
                                    unmask={true}
                                    value={formulario.telefone}
                                    onAccept={(valor) => atualizarCampo("telefone", String(valor))}
                                    className={css.input_padrao}
                                />
                            </div>

                            <div className={css.grupo_input}>
                                <label>CPF</label>
                                <IMaskInput
                                    mask="000.000.000-00"
                                    unmask={true}
                                    value={formulario.cpf}
                                    onAccept={(valor) => atualizarCampo("cpf", String(valor))}
                                    className={css.input_padrao}
                                />
                            </div>
                        </section>

                        <section className={css.card_form}>
                            <h2 className={`${css.titulo_card} ${css.destaque_vermelho}`}>Segurança</h2>

                            <div className={css.grupo_input}>
                                <label>Nova senha</label>
                                <div className={css.input_com_icone}>
                                    <input
                                        type="password"
                                        value={formulario.senha}
                                        onChange={(e) => atualizarCampo("senha", e.target.value)}
                                        className={css.input_padrao}
                                        placeholder="Deixe vazio para manter a atual"
                                    />
                                    <img src="/IconCadeado.png" alt="Cadeado" className={css.cadeado} />
                                </div>
                            </div>

                            <div className={css.area_botoes}>
                                <button type="button" className={css.botao_cancelar} onClick={limparFormulario}>
                                    Cancelar
                                </button>
                                <button type="submit" className={css.botao_salvar} disabled={salvando}>
                                    {salvando ? "Salvando..." : "Salvar alterações"}
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default MinhaConta;
