import css from "./MinhaConta.module.css";
import MenuLateral from "../components/MenuLateral/MenuLateral.jsx";

function MinhaConta() {
    return (
        <div className={css.layout_minha_conta}>

            <MenuLateral />

            <main className={css.conteudo_principal}>

                <header className={css.cabecalho}>
                    <div>
                        <h1 className={css.titulo}>
                            Minha <span className={css.destaque_vermelho}>conta</span>
                        </h1>
                        <p className={css.subtitulo}>Gerencie suas informações pessoais e segurança</p>
                    </div>
                </header>

                <div className={css.container_cards}>
                    <section className={css.card_topo}>
                        <div className={css.info_usuario_topo}>
                            <div className={css.avatar_grande}>
                                <img src="/IconPerfil.png" alt="Avatar" className={css.img_avatar} />
                            </div>
                            <div className={css.dados_usuario}>
                                <h2>Usuário da Silva</h2>
                                <p>exemplo@gmail.com</p>
                                <p>(18) 99999-9999</p>
                            </div>
                        </div>
                        <div className={css.alterar_foto_area}>
                            <p>Alterar foto de perfil</p>
                            <div className={css.box_foto_placeholder}>
                                <img src="/IconAddFotoPerfil.png" alt="Adicionar foto" className={css.icone_add_foto} />
                            </div>
                        </div>
                    </section>

                    <div className={css.cards_inferiores}>
                        <section className={css.card_form}>
                            <h2 className={css.titulo_card}>Informações pessoais</h2>

                            <div className={css.grupo_input}>
                                <label>Nome completo</label>
                                <input type="text" defaultValue="Usuário da Silva" className={css.input_padrao} />
                            </div>

                            <div className={css.grupo_input}>
                                <label>E-mail:</label>
                                <input type="email" defaultValue="exemplo@gmail.com" className={css.input_padrao} />
                            </div>

                            <div className={css.grupo_input}>
                                <label>Telefone:</label>
                                <input type="tel" defaultValue="(18) 99999-9999" className={css.input_padrao} />
                            </div>

                            <div className={css.area_botoes}>
                                <button className={css.botao_cancelar}>Cancelar</button>
                                <button className={css.botao_salvar}>Salvar alterações</button>
                            </div>
                        </section>


                        <section className={css.card_form}>
                            <h2 className={`${css.titulo_card} ${css.destaque_vermelho}`}>Segurança</h2>

                            <div className={css.grupo_input}>
                                <label>Senha atual</label>
                                <div className={css.input_com_icone}>
                                    <input type="password" className={css.input_padrao} />
                                    <img src="/IconCadeado.png" alt="Cadeado" className={css.cadeado} />
                                </div>
                            </div>

                            <div className={css.grupo_input}>
                                <label>Nova senha</label>
                                <div className={css.input_com_icone}>
                                    <input type="password" className={css.input_padrao} />
                                    <img src="/IconCadeado.png" alt="Cadeado" className={css.cadeado} />
                                </div>
                            </div>

                            <div className={css.grupo_input}>
                                <label>Confirmar nova senha</label>
                                <div className={css.input_com_icone}>
                                    <input type="password" className={css.input_padrao} />
                                    <img src="/IconCadeado.png" alt="Cadeado" className={css.cadeado} />
                                </div>
                            </div>

                            <div className={css.area_botoes}>
                                <button className={css.botao_cancelar}>Cancelar</button>

                            </div>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default MinhaConta;