import { useLocation, useNavigate } from "react-router-dom";
import css from "./MenuLateral.module.css";

function MenuLateral({ aberto = false, aoNavegar }) {
    const navigate = useNavigate();
    const location = useLocation();

    function sair() {
        localStorage.removeItem("usuario_logado");
        navigate("/login", { replace: true });
    }

    function classeItem(rota) {
        return `${css.menu_item} ${location.pathname.toLowerCase() === rota ? css.menu_ativo : ""}`;
    }

    function navegar(rota) {
        navigate(rota);
        aoNavegar?.();
    }

    return (
        <aside className={`${css.menu_lateral} ${aberto ? css.menu_aberto : ""}`}>

            
            <div className={css.logo_container}>
                
                <img src="/ImgNavBar/LogoNav.png" alt="Estoque Cars" className={css.logo} />
            </div> <br />

            <nav className={css.menu}>
                <button type="button" className={classeItem("/dashboard")} onClick={() => navegar("/dashboard")}>
                    <img src="/IconCar.png" alt="Dashboard" className={css.icone_img} />
                    Dashboard
                </button>

                <button type="button" className={classeItem("/favoritos")} onClick={() => navegar("/favoritos")}>
                    <img src="/IconCoracao.png" alt="Favoritos" className={css.icone_img} />
                    Favoritos
                </button>

                <button type="button" className={classeItem("/minhaconta")} onClick={() => navegar("/minhaConta")}>
                    <img src="/IconEngrenagem.png" alt="Minha conta" className={css.icone_img} />
                    Minha conta
                </button>
            </nav>

            <div className={css.rodape_menu}>
                <button type="button" className={css.botao_sair} onClick={sair}>
                    <img src="/IconSair.png" alt="Sair" className={css.icone_img} />
                    Sair
                </button>
            </div>
        </aside>
    );
}

export default MenuLateral;
