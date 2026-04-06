import css from "./Dashboard.module.css";

function Dashboard() {

    const usuario = JSON.parse(localStorage.getItem("usuario_logado") || "null");
    const nome = usuario?.nome || "Usuário";

    return (
        <main className={css.container}>
            <section className={css.card}>
                <h1 className={css.titulo}>Olá, <span>{nome}</span></h1>
                <p className={css.subtitulo}>Você está na área restrita do sistema.</p>
            </section>
        </main>
    );
}

export default Dashboard;
