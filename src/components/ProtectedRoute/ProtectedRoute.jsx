import { Navigate, Outlet } from "react-router-dom";
import NavBar from "../NavBar/NavBar";
import css from "./ProtectedRoute.module.css";

function ProtectedRoute({ API }) {
    const usuarioSalvo = localStorage.getItem("usuario_logado");

    if (!usuarioSalvo) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className={css.layout}>
            <NavBar API={API} />
            <main className={css.conteudo}>
                <Outlet />
            </main>
        </div>
    );
}

export default ProtectedRoute;
