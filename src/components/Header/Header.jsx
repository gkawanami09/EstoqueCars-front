import { Link } from 'react-router-dom'
import css from './Header.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'
import { useState } from 'react'

function Header() {
    const [menuAberto, setMenuAberto] = useState(false)

    function toggleMenu() {
        setMenuAberto(!menuAberto)
    }

    function fecharMenu() {
        setMenuAberto(false)
    }

    return(
        <header className={css.container}>
            <Link className={css.logoBox} to="/">
                <div>
                    <img className={css.logo} src="/Logo.png" alt="Logo" />
                </div>
            </Link>

            <nav className={css.navDesktop}>
                <a href="/#Carros">Carros</a>
                <a href="/#Servicos">Serviços</a>
                <a href="/#Duvidas">Dúvidas</a>
                <a href="/#Contato">Contato</a>
            </nav>

            <div className={css.buttonsDesktop}>
                <Link className={css.linkCadastro} to='/cadastro'>Cadastro</Link>
                <ButtonLink buttonTo='/login' buttonNome='Entrar'/>
            </div>

            <button className={css.menuBotao} type="button" onClick={toggleMenu} aria-label="Abrir menu">
                {menuAberto ? "×" : "☰"}
            </button>

            {menuAberto && (
                <div className={css.menuMobile}>
                    <button className={css.fecharMenu} type="button" onClick={fecharMenu} aria-label="Fechar menu">
                        ×
                    </button>

                    <a href="/#Carros" onClick={fecharMenu}>Carros</a>
                    <a href="/#Servicos" onClick={fecharMenu}>Serviços</a>
                    <a href="/#Duvidas" onClick={fecharMenu}>Dúvidas</a>
                    <a href="/#Contato" onClick={fecharMenu}>Contato</a>

                    <Link className={css.botaoEntrarMobile} to="/login" onClick={fecharMenu}>Entrar</Link>
                    <Link className={css.botaoCadastroMobile} to="/cadastro" onClick={fecharMenu}>Cadastrar</Link>
                </div>
            )}
        </header>
    )
}

export default Header
