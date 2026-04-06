import { useNavigate } from "react-router-dom";
import css from "./Dashboard.module.css";

function Dashboard({ API }) {
    const navigate = useNavigate();

    const usuario = JSON.parse(localStorage.getItem("usuario_logado") || "null");
    const nome = usuario?.nome || "Usuário";

    function sair() {
        fetch(`${API}/logout`, {
            method: "POST",
            credentials: "include"
        });

        localStorage.removeItem("usuario_logado");
        navigate("/login");
    }

    return (
        <main className={css.container}>
            <section className={css.card}>
                <h1 className={css.titulo}>Olá, <span>{nome}</span></h1>
                <p className={css.subtitulo}>Você está na área restrita do sistema.</p>
                <button className={css.botao} type="button" onClick={sair}>
                    Logout
                </button>
            </section>
        </main>
    );
}

export default Dashboard;
