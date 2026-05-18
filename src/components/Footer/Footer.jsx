import css from './Footer.module.css'
import ButtonLink from '../ButtonLink/ButtonLink'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function Footer({ API }) {
    const location = useLocation()
    const navigate = useNavigate()
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("logo_site_url") || "/ImgFooter/logo.png")
    const usuarioLogado = !3
    !localStorage.getItem('usuario_logado')

    const semMargemTopo =
        location.pathname === '/cadastro' ||
        location.pathname === '/login' ||
        location.pathname === '/CodigoRecupera' ||
        location.pathname === '/confirmar-email'

    useEffect(() => {
        function atualizarLogo() {
            setLogoUrl(localStorage.getItem("logo_site_url") || "/ImgFooter/logo.png")
        }

        window.addEventListener("logo-atualizada", atualizarLogo)
        return () => window.removeEventListener("logo-atualizada", atualizarLogo)
    }, [])

    async function sair() {
        await fetch(`${API}/logout`, {
            method: 'POST',
            credentials: 'include'
        })
        localStorage.removeItem('usuario_logado')
        localStorage.removeItem('access_token')
        navigate('/login')
    }

    return (
        <footer className={`${css.footer} ${semMargemTopo ? css.sem_margem_topo : ''}`}>
            <div className={css.conteudo}>
                <div className={css.esquerda}>
                    <Link to="/" className={css.logoLink}>
                        <img
                            className={css.logo}
                            src={logoUrl}
                            alt="Estoque Cars"
                            onError={(e) => {
                                e.currentTarget.src = "/ImgFooter/logo.png"
                            }}
                        />
                    </Link>
                    <div className={css.endereco}>
                        <p>Rua Diamante negro,</p>
                        <p>1903,</p>
                        <p>Vila Lobos,</p>
                        <p>São Mauro</p>
                    </div>
                </div>

                <div className={css.centro}>
                    <nav className={css.menu}>
                        <a href="/#Carros">Carros</a>
                        <a href="/#Servicos">Serviços</a>
                        <a href="/#Duvidas">Dúvidas</a>
                        <a href="/#Contato">Contato</a>
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
                        {usuarioLogado ? (
                            <button className={`${css.botao} ${css.botaoLogout}`} type="button" onClick={sair}>
                                Logout
                            </button>
                        ) : (
                            <>
                                <ButtonLink className={css.botao} buttonTo="/login" buttonNome="Entrar" variant="vermelho"/>
                                <ButtonLink className={css.botao} buttonTo="/cadastro" buttonNome="Cadastrar" variant="branco"/>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
