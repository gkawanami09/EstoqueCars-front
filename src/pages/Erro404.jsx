import css from "./Erro404.module.css";
import { Link } from "react-router-dom";

function Erro404() {
    return (
        <main className={css.container}>
            <section className={css.card}>
                <h1 className={css.codigo}>404</h1>
                <h2 className={css.titulo}>Página não encontrada</h2>
                <p className={css.texto}>A rota que você tentou acessar não existe.</p>
                <Link className={css.botao} to="/">
                    Voltar para Home
                </Link>
            </section>
        </main>
    );
}

export default Erro404;
