import css from './Footer.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'

function Footer() {
    return (
        <footer className={css.footer}>
            <div className={css.conteudo}>
                <div className={css.esquerda}>
                    <img className={css.logo} src="/ImgFooter/logo.png" alt="Estoque Cars" />
                    <div className={css.endereco}>
                        <p>Rua Diamante negro,</p>
                        <p>1903,</p>
                        <p>Vila Lobos,</p>
                        <p>São Mauro</p>
                    </div>
                </div>

                <div className={css.centro}>
                    <nav className={css.menu}>
                        <a href="#Carros">Carros</a>
                        <a href="#Servicos">Serviços</a>
                        <a href="#Duvidas">Dúvidas</a>
                        <a href="#Contato">Contato</a>
                    </nav>
                    <div className={css.linha}></div>
                    <div className={css.redes}>
                        <img src="/ImgFooter/face.png" alt="Facebook" />
                        <img src="/ImgFooter/zap.png" alt="WhatsApp" />
                        <img src="/ImgFooter/insta.png" alt="Instagram" />
                    </div>
                    <p className={css.direitos}>2026 Estoque Cars. Todos os direitos reservados.</p>
                </div>

                <div className={css.direita}>
                    <div className={css.divisoria}></div>
                    <div className={css.acoes}>
                        <ButtonLink className={css.botao} buttonTo="/login" buttonNome="Entrar" variant="vermelho"/>
                        <ButtonLink className={css.botao} buttonTo="/cadastro" buttonNome="Cadastrar" variant="branco"/>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
