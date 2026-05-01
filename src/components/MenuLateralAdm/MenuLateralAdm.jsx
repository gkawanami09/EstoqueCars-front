import { Link, useLocation, useNavigate } from "react-router-dom";
import css from "./MenuLateralAdm.module.css";

function MenuLateralAdm({ aberto = false, aoNavegar }) {
    const navigate = useNavigate();
    const location = useLocation();

    function sair() {
        localStorage.removeItem("usuario_logado");
        navigate("/login", { replace: true });
    }

    function classeItem(rotas) {
        const rotaAtual = location.pathname.toLowerCase();
        const ativo = rotas.some((rota) => rotaAtual.startsWith(rota));

        return `${css.menu_item} ${ativo ? css.menu_ativo : ""}`;
    }

    function navegar(rota) {
        navigate(rota);
        aoNavegar?.();
    }

    return (
        <aside className={`${css.menu_lateral} ${aberto ? css.menu_aberto : ""}`}>
            <div className={css.logo_container}>
                <Link to = "/">
                <img src="/ImgNavBar/LogoNav.png" alt="Estoque Cars" className={css.logo} />
                </Link>
            </div> <br />

            <nav className={css.menu}>
                <button
                    type="button"
                    className={`${css.menu_item} ${location.pathname.toLowerCase() === "/dashboardadm" ? css.menu_ativo : ""}`}
                    onClick={() => navegar("/dashboardAdm")}
                >
                    <img src="/Casa.png" alt="Dashboard" className={css.icone_img} />
                    Dashboard
                </button>

                <button
                    type="button"
                    className={classeItem(["/dashboardadmveiculos", "/dashboardadmmarcas", "/cadastrov", "/editarveiculos", "/detalhesveiculos"])}
                    onClick={() => navegar("/dashboardAdmVeiculos")}
                >
                    <img src="/ImgNavBar/Veículo.png" alt="Veiculos" className={css.icone_img} />
                    Veiculos
                </button>

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Vendas.png" alt="Vendas" className={css.icone_img} />
                    Vendas
                </button>

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Estoque.png" alt="Estoque" className={css.icone_img} />
                    Estoque
                </button>

                <button
                    type="button"
                    className={classeItem(["/dashboardadmclientes"])}
                    onClick={() => navegar("/dashboardAdmClientes")}
                >
                    <img src="/ImgNavBar/Clientes.png" alt="Clientes" className={css.icone_img} />
                    Clientes
                </button>

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Documentos.png" alt="Documentos" className={css.icone_img} />
                    Documentos
                </button>

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Financeiro.png" alt="Financeiro" className={css.icone_img} />
                    Financeiro
                </button>

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Relatórios.png" alt="Relatorios" className={css.icone_img} />
                    Relatorios
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

export default MenuLateralAdm;
