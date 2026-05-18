import { NavLink, useNavigate } from "react-router-dom";
import css from "./NavBar.module.css";
import { useEffect, useState } from "react";

function NavBar() {
    const navigate = useNavigate();
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("logo_site_url") || "/ImgNavBar/LogoNav.png");

    useEffect(() => {
        function atualizarLogo() {
            setLogoUrl(localStorage.getItem("logo_site_url") || "/ImgNavBar/LogoNav.png");
        }

        window.addEventListener("logo-atualizada", atualizarLogo);
        return () => window.removeEventListener("logo-atualizada", atualizarLogo);
    }, []);

    function sair() {
        localStorage.removeItem("usuario_logado");
        navigate("/login", { replace: true });
    }

    return (
        <aside className={css.sidebar}>
            <div>
                <button type="button" className={css.logoBotao} onClick={() => navigate("/")}>
                    <img
                        className={css.logo}
                        src={logoUrl}
                        alt="Estoque Cars"
                        onError={(e) => {
                            e.currentTarget.src = "/ImgNavBar/LogoNav.png";
                        }}
                    />
                </button>

                <nav className={css.nav}>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `${css.link} ${isActive ? css.link_ativo : ""}`.trim()
                        }
                    >
                        <img className={css.icone} src="/ImgNavBar/carro.png" alt="" aria-hidden="true" />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink
                        to="/favoritos"
                        className={({ isActive }) =>
                            `${css.link} ${isActive ? css.link_ativo : ""}`.trim()
                        }
                    >
                        <img className={css.icone} src="/ImgNavBar/favorito.png" alt="" aria-hidden="true" />
                        <span>Favoritos</span>
                    </NavLink>

                    <NavLink
                        to="/minha-conta"
                        className={({ isActive }) =>
                            `${css.link} ${isActive ? css.link_ativo : ""}`.trim()
                        }
                    >
                        <img className={css.icone} src="/ImgNavBar/engrenagem.png" alt="" aria-hidden="true" />
                        <span>Minha conta</span>
                    </NavLink>
                </nav>
            </div>

            <button type="button" className={css.sair} onClick={sair}>
                <img className={css.icone} src="/ImgNavBar/Sair.png" alt="" aria-hidden="true" />
                <span>Sair</span>
            </button>
        </aside>
    );
}

export default NavBar;
