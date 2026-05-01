import { Navigate, Outlet, useLocation } from "react-router-dom";
import MenuLateral from "../MenuLateral/MenuLateral.jsx";
import MenuLateralAdm from "../MenuLateralAdm/MenuLateralAdm.jsx";
import css from "./ProtectedRoute.module.css";

const rotasAdm = [
    "/dashboardadm",
    "/dashboardadmveiculos",
    "/dashboardadmclientes",
    "/dashboardadmmarcas",
    "/cadastrov",
    "/editarveiculos",
    "/detalhesveiculos",
    "/cadastroservicos",
    "/edicaoservicos",
    "/cadastromanutencao",
    "/cadastroedicaomanutencao"
];

const rotasUsuario = [
    "/dashboard",
    "/favoritos",
    "/minhaconta",
    "/minha-conta"
];

function ProtectedRoute() {
    const usuarioSalvo = localStorage.getItem("usuario_logado");
    const location = useLocation();

    if (!usuarioSalvo) {
        return <Navigate to="/login" replace />;
    }

    const usuario = JSON.parse(usuarioSalvo);
    const tipoUsuario = Number(usuario.tipo_usuario);
    const isAdm = tipoUsuario === 2;
    const rotaAtual = location.pathname.toLowerCase();
    const rotaAdm = rotasAdm.some((rota) => rotaAtual.startsWith(rota));
    const rotaUsuario = rotasUsuario.some((rota) => rotaAtual === rota || rotaAtual.startsWith(`${rota}/`));

    if (rotaAdm && !isAdm) {
        return <Navigate to="/dashboard" replace />;
    }

    if (rotaUsuario && isAdm) {
        return <Navigate to="/dashboardAdm" replace />;
    }

    return (
        <div className={css.layout}>
            {isAdm ? <MenuLateralAdm /> : <MenuLateral />}

            <main className={css.conteudo}>
                <Outlet />
            </main>
        </div>
    );
}

export default ProtectedRoute;
