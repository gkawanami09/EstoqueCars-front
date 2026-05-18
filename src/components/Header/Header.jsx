import { Link, useNavigate } from 'react-router-dom'
import css from './Header.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'
import { useEffect, useState } from 'react'

function Header({ API }) {
    const [menuAberto, setMenuAberto] = useState(false)
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("logo_site_url") || "/Logo.png")
    const navigate = useNavigate()
    const usuarioSalvo = localStorage.getItem('usuario_logado')
    const usuarioLogado = !!usuarioSalvo

    function buscarRotaDashboard() {
        if (!usuarioSalvo) {
            return '/dashboard'
        }

        try {
            const usuario = JSON.parse(usuarioSalvo)
            return [1, 2].includes(Number(usuario.tipo_usuario)) ? '/dashboardAdm' : '/dashboard'
        } catch {
            return '/dashboard'
        }
    }

    const rotaDashboard = buscarRotaDashboard()

    useEffect(() => {
        function atualizarLogo() {
            setLogoUrl(localStorage.getItem("logo_site_url") || "/Logo.png")
        }

        window.addEventListener("logo-atualizada", atualizarLogo)
        return () => window.removeEventListener("logo-atualizada", atualizarLogo)
    }, [])

    function toggleMenu() {
        setMenuAberto(!menuAberto)
    }

    function fecharMenu() {
        setMenuAberto(false)
    }

    async function sair() {
        await fetch(`${API}/logout`, {
            method: 'POST',
            credentials: 'include'
        })
        localStorage.removeItem('usuario_logado')
        localStorage.removeItem('access_token')
        fecharMenu()
        navigate('/login')
    }

    return(
        <header className={css.container}>
            <Link className={css.logoBox} to="/">
                <div>
                    <img
                        className={css.logo}
                        src={logoUrl}
                        alt="Logo"
                        onError={(e) => {
                            e.currentTarget.src = "/Logo.png"
                        }}
                    />
                </div>
            </Link>

            <nav className={css.navDesktop}>
                <a href="/#Carros">Carros</a>
                <a href="/#Servicos">Serviços</a>
                <a href="/#Duvidas">Dúvidas</a>
                <a href="/#Contato">Contato</a>
            </nav>

            <div className={css.buttonsDesktop}>
                {usuarioLogado ? (
                    <>
                        <Link className={css.botaoDashboardDesktop} to={rotaDashboard}>
                            Dashboard
                        </Link>
                        <button className={css.botaoLogoutDesktop} type="button" onClick={sair}>Logout</button>
                    </>
                ) : (
                    <>
                        <Link className={css.linkCadastro} to='/cadastro'>Cadastro</Link>
                        <ButtonLink buttonTo='/login' buttonNome='Entrar'/>
                    </>
                )}
            </div>

            <button className={css.menuBotao} type="button" onClick={toggleMenu} aria-label="Abrir menu">
                {menuAberto ? '×' : '☰'}
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

                    {usuarioLogado ? (
                        <>
                            <Link className={css.botaoDashboardMobile} to={rotaDashboard} onClick={fecharMenu}>
                                Dashboard
                            </Link>
                            <button className={css.botaoLogoutMobile} type="button" onClick={sair}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link className={css.botaoEntrarMobile} to="/login" onClick={fecharMenu}>Entrar</Link>
                            <Link className={css.botaoCadastroMobile} to="/cadastro" onClick={fecharMenu}>Cadastrar</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    )
}

export default Header
