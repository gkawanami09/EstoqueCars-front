import { Link } from 'react-router-dom'
import css from './Header.module.css'
function Header() {
    return(
        <header className={css.container}>
            <div>
                <img src="/img/Logo.png" alt="Logo" />
            </div>
            <nav>
                <a href="#Carros">Carros</a>
                <a href="#Servicos">Serviços</a>
                <a href="#Duvidas">Dúvidas</a>
                <a href="#Contato">Contato</a>
            </nav>
            <div className={css.buttons}>
                <Link className={css.Link} to='/cadastro'>Cadastro</Link>
                <Link className={css.button} to='/Entrar'>Entrar</Link>
            </div>
        </header>
    )
}

export default Header