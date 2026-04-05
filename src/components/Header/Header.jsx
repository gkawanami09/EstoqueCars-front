import { Link } from 'react-router-dom'
import css from './Header.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'

function Header() {
    return(
        <header className={css.container}>
            <Link className={css.logoBox} to="/">
                <div>
                    <img className={css.logo} src="/Logo.png" alt="Logo" />
                </div>
            </Link>
            <nav>
                <a href="#Carros">Carros</a>
                <a href="#Servicos">Serviços</a>
                <a href="#Duvidas">Dúvidas</a>
                <a href="#Contato">Contato</a>
            </nav>
            <div className={css.buttons}>
                <Link className={css.Link} to='/cadastro'>Cadastro</Link>
                <ButtonLink buttonTo='/login' buttonNome='Entrar'/>
            </div>
        </header>
    )
}

export default Header
