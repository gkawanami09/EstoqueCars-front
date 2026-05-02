import { useMemo, useState } from "react";
import { IMaskInput } from "react-imask";
import css from "./MinhaConta.module.css";

const usuarioVazio = {
    id_usuario: "",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    tipo_usuario: ""
};

function lerUsuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem("usuario_logado")) || usuarioVazio;
    } catch {
        return usuarioVazio;
    }
}

function idPeloToken() {
    const token = localStorage.getItem("access_token");

    if (!token || !token.includes(".")) {
        return "";
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        return "";
    }
}

function montarUrlFoto(API, valor) {
    if (!valor) {
        return "";
    }

    if (String(valor).startsWith("http")) {
        return valor;
    }

    if (String(valor).startsWith("/")) {
        return `${API}${valor}`;
    }

    return `${API}/uploads/${valor}`;
}

function MinhaConta({ API }) {
    const usuarioInicial = useMemo(() => lerUsuarioLogado(), []);
    const [usuarioBase, setUsuarioBase] = useState(usuarioInicial);
    const idUsuario = usuarioBase.id_usuario || usuarioBase.id_user || usuarioBase.id || idPeloToken();

    const [formulario, setFormulario] = useState({
        nome: usuarioBase.nome || "",
        email: usuarioBase.email || "",
        telefone: usuarioBase.telefone || "",
        cpf: usuarioBase.cpf || "",
        senha: ""
    });
    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState("");
    const [mensagem, setMensagem] = useState(null);
    const [salvando, setSalvando] = useState(false);
    const [versaoFoto, setVersaoFoto] = useState(Date.now());
    const [tentativaFoto, setTentativaFoto] = useState(0);

    const fotosPossiveis = [
        montarUrlFoto(API, usuarioBase.foto_perfil || usuarioBase.foto || usuarioBase.imagem),
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.pgn` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.png` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.jpg` : "",
        idUsuario ? `${API}/uploads/foto_perfil${idUsuario}.jpeg` : "",
        idUsuario ? `${API}/uploads/${idUsuario}.jpg` : "",
        idUsuario ? `${API}/uploads/${idUsuario}.png` : "",
    ].filter(Boolean);

    const fotoPerfil = fotosPossiveis[tentativaFoto]
        ? `${fotosPossiveis[tentativaFoto]}?v=${versaoFoto}`
        : "/IconPerfil.png";

    function atualizarCampo(campo, valor) {
        setFormulario((atual) => ({ ...atual, [campo]: valor }));
    }

    function selecionarFoto(e) {
        const arquivo = e.target.files?.[0];
        setFoto(arquivo || null);
        setPreviewFoto(arquivo ? URL.createObjectURL(arquivo) : "");
        setTentativaFoto(0);
    }

    function limparFormulario() {
        setFormulario({
            nome: usuarioBase.nome || "",
            email: usuarioBase.email || "",
            telefone: usuarioBase.telefone || "",
            cpf: usuarioBase.cpf || "",
            senha: ""
        });
        setFoto(null);
        setPreviewFoto("");
        setMensagem(null);
    }

    function salvarUsuarioLocal() {
        const usuarioAtualizado = {
            ...usuarioBase,
            id_usuario: idUsuario,
            nome: formulario.nome,
            email: formulario.email,
            telefone: formulario.telefone,
            cpf: formulario.cpf
        };

        localStorage.setItem("usuario_logado", JSON.stringify(usuarioAtualizado));
        setUsuarioBase(usuarioAtualizado);
    }

    async function salvar(e) {
        e.preventDefault();
        setMensagem(null);

        if (!idUsuario) {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel identificar sua conta. Faca login novamente."
            });
            return;
        }

        if (!formulario.nome.trim() || !formulario.email.trim()) {
            setMensagem({
                tipo: "erro",
                texto: "Informe pelo menos nome e e-mail."
            });
            return;
        }

        const formData = new FormData();
        formData.append("nome", formulario.nome.trim());
        formData.append("email", formulario.email.trim());
        formData.append("telefone", String(formulario.telefone || "").replace(/\D/g, ""));
        formData.append("cpf", String(formulario.cpf || "").replace(/\D/g, ""));

        if (formulario.senha.trim()) {
            formData.append("senha", formulario.senha);
        }

        if (foto) {
            formData.append("foto_perfil", foto);
        }

        setSalvando(true);

        try {
            const token = localStorage.getItem("access_token");
            const resposta = await fetch(`${API}/editar_usuario/${idUsuario}`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                credentials: "include",
                body: formData
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setMensagem({
                    tipo: "erro",
                    texto: dados.erro || "Nao foi possivel atualizar sua conta."
                });
                return;
            }

            salvarUsuarioLocal();
            setFormulario((atual) => ({ ...atual, senha: "" }));
            setFoto(null);
            setPreviewFoto("");
            setVersaoFoto(Date.now());
            setTentativaFoto(0);
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Conta atualizada com sucesso."
            });
        } catch {
            setMensagem({
                tipo: "erro",
                texto: "Nao foi possivel conectar ao servidor."
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
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
