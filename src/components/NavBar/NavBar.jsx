import { NavLink, useNavigate } from "react-router-dom";
import css from "./NavBar.module.css";

function NavBar() {
    const navigate = useNavigate();

    function sair() {
        localStorage.removeItem("usuario_logado");
        navigate("/login", { replace: true });
    }

    return (
        <aside className={css.sidebar}>
            <div>
                <img className={css.logo} src="/ImgNavBar/LogoNav.png" alt="Estoque Cars" />

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
