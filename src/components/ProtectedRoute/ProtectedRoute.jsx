import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import MenuLateral from "../MenuLateral/MenuLateral.jsx";
import MenuLateralAdm from "../MenuLateralAdm/MenuLateralAdm.jsx";
import css from "./ProtectedRoute.module.css";

const rotasAdm = [
    "/dashboardadm",
    "/dashboardadmveiculos",
    "/dashboardadmclientes",
    "/dashboardadmmarcas",
    "/dashboardadmvendas",
    "/dashboardadmfinanceiros",
    "/dashboardadmjuros",
    "/cadastrocliente",
    "/cadastroveiculos",
    "/cadastrov",
    "/editarveiculos",
    "/cadastroservicos",
    "/edicaoservicos",
    "/manutencoes",
    "/cadastromanutencao",
    "/cadastroedicaomanutencao",
    "/dashboardadmconfiguracoes"
];

const rotasSomenteAdm = [
    "/dashboardadmclientes",
    "/cadastrocliente",
    "/dashboardadmjuros",
    "/dashboardadmconfiguracoes"
];

const rotasUsuario = [
    "/dashboard",
    "/favoritos",
    "/minhaconta",
    "/minha-conta"
];

function ProtectedRoute() {
    const [menuAberto, setMenuAberto] = useState(false);
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado");
    const location = useLocation();

    if (!usuarioSalvo) {
        return <Navigate to="/login" replace />;
    }

    const usuario = JSON.parse(usuarioSalvo);
    const tipoUsuario = Number(usuario.tipo_usuario || usuario["tipo_usuário"]);
    const isAdm = tipoUsuario === 2;
    const isPainelAdm = [1, 2].includes(tipoUsuario);
    const rotaAtual = location.pathname.toLowerCase();
    const rotaAdm = rotasAdm.some((rota) => rotaAtual.startsWith(rota));
    const rotaSomenteAdm = rotasSomenteAdm.some((rota) => rotaAtual.startsWith(rota));
    const rotaUsuario = rotasUsuario.some((rota) => rotaAtual === rota || rotaAtual.startsWith(`${rota}/`));

    if (rotaAdm && !isPainelAdm) {
        return <Navigate to="/dashboard" replace />;
    }

    if (rotaSomenteAdm && !isAdm) {
        return <Navigate to="/dashboardAdm" replace />;
    }

    if (rotaUsuario && isPainelAdm) {
        return <Navigate to="/dashboardAdm" replace />;
    }

    return (
        <div className={css.layout}>
            {/* Botão Hamburguer para Mobile */}
            <button 
                className={css.hamburguer} 
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir menu"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2z" />
                </svg>
            </button>

            {/* Overlay para fechar o menu ao clicar fora */}
            {menuAberto && (
                <div className={css.overlay} onClick={() => setMenuAberto(false)} />
            )}

            {isPainelAdm ? 
                <MenuLateralAdm aberto={menuAberto} aoNavegar={() => setMenuAberto(false)} tipoUsuario={tipoUsuario} /> : 
                <MenuLateral aberto={menuAberto} aoNavegar={() => setMenuAberto(false)} />
            }

            <main className={css.conteudo}>
                <Outlet />
            </main>
        </div>
    );
}

export default ProtectedRoute;
