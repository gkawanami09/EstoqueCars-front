import { Link, useLocation, useNavigate } from "react-router-dom";
import css from "./MenuLateralAdm.module.css";
import { useEffect, useState } from "react";

function MenuLateralAdm({ aberto, aoNavegar, tipoUsuario }) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdm = Number(tipoUsuario) === 2;
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("logo_site_url") || "/ImgNavBar/LogoNav.png");
    const [fechado, setFechado] = useState(false);

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
        <aside className={`${css.menu_lateral} ${aberto ? css.menu_aberto : ""} ${fechado ? css.menu_fechado : ""}`}>
            <button
                className={css.botao_toggle}
                onClick={() => setFechado(!fechado)}
            >
                {fechado ? "›" : "‹"}
            </button>
            <div className={css.logo_container}>
                <Link to = "/">
                <img
                    src={logoUrl}
                    alt="Estoque Cars"
                    className={css.logo}
                    onError={(e) => {
                        e.currentTarget.src = "/ImgNavBar/LogoNav.png";
                    }}
                />
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
                    Veículos
                </button>

         

                <button
                    type="button"
                    className={classeItem(["/dashboardadmvendas"])}
                    onClick={() => navegar("/dashboardAdmVendas")}
                >
                    <img src="/ImgNavBar/Vendas.png" alt="Vendas" className={css.icone_img} />
                    Vendas
                </button>

                <button type="button" 
                        className={css.menu_item}
                        onClick={() => navegar("/dashboardAdmEstoque")}
                >
                    <img src="/ImgNavBar/Estoque.png" alt="Estoque" className={css.icone_img} />
                    Estoque
                </button>

                {isAdm && (
                    <button
                        type="button"
                        className={classeItem(["/dashboardadmclientes"])}
                        onClick={() => navegar("/dashboardAdmClientes")}
                    >
                        <img src="/ImgNavBar/Clientes.png" alt="Usuários" className={css.icone_img} />
                        Usuários
                    </button>
                )}

  

                <button type="button" 
                        className={classeItem(["/dashboardadmfinanceiros"])}
                        onClick={() => navegar("/dashboardADMFinanceiros")}
                >
                    <img src="/ImgNavBar/Financeiro.png" alt="Financeiro" className={css.icone_img} />
                    Financeiro
                </button>

            

                {isAdm && (
                    <button type="button" 
                            className={css.menu_item}
                            onClick={() => navegar("/DashboardAdmConfiguracoes")}
                    >
                        <img src="/IconEngrenagem.png" alt="Configurações" className={css.icone_img} />
                        Configurações
                    </button>
                )}
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
