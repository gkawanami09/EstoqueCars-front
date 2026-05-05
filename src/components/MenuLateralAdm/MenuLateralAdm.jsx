import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import css from "./MenuLateralAdm.module.css";
import { lerConfigEmpresa } from "../../utils/configEmpresa";

function MenuLateralAdm({ aberto = false, aoNavegar }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [configEmpresa, setConfigEmpresa] = useState(() => lerConfigEmpresa());

    useEffect(() => {
        function atualizarConfig() {
            setConfigEmpresa(lerConfigEmpresa());
        }

        window.addEventListener("config_empresa_atualizada", atualizarConfig);
        window.addEventListener("storage", atualizarConfig);

        return () => {
            window.removeEventListener("config_empresa_atualizada", atualizarConfig);
            window.removeEventListener("storage", atualizarConfig);
        };
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
        <aside className={`${css.menu_lateral} ${aberto ? css.menu_aberto : ""}`}>
            <div className={css.logo_container}>
                <Link to = "/">
                <img src={configEmpresa.logo || "/ImgNavBar/LogoNav.png"} alt={configEmpresa.nome || "Estoque Cars"} className={css.logo} />
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

         

                <button type="button" className={css.menu_item}>
                    <img src="/ImgNavBar/Vendas.png" alt="Vendas" className={css.icone_img} />
                    Vendas
                </button>

                <button
                    type="button"
                    className={classeItem(["/dashboardadmveiculos"])}
                    onClick={() => navegar("/dashboardAdmVeiculos")}
                >
                    <img src="/ImgNavBar/Estoque.png" alt="Estoque" className={css.icone_img} />
                    Estoque
                </button>

                <button
                    type="button"
                    className={classeItem(["/dashboardadmclientes"])}
                    onClick={() => navegar("/dashboardAdmClientes")}
                >
                    <img src="/ImgNavBar/Clientes.png" alt="Usuários" className={css.icone_img} />
                    Usuários
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
                    Relatórios
                </button>
                <button
                    type="button"
                    className={classeItem(["/configuracaoempresa"])}
                    onClick={() => navegar("/configuracaoEmpresa")}
                >
                    <img src="/ImgNavBar/engrenagem.png" alt="Configuracoes" className={css.icone_img} />
                    Configurações
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
