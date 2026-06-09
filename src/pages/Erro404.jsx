// Importa recursos de ./Erro404.module.css.
import css from "./Erro404.module.css";
// Importa recursos de react-router-dom.
import { Link } from "react-router-dom";

// Declara a função Erro404 usada por esta página.
function Erro404() {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return (
        <main className={css.container}>
            {/* Agrupa esta seção de conteúdo. */}
            <section className={css.card}>
                {/* Exibe o título principal desta página. */}
                <h1 className={css.codigo}>404</h1>
                {/* Renderiza o componente Link nesta parte da página. */}
                <Link className={css.botao} to="/">
                    Voltar para Home
                </Link>
            </section>
        </main>
    );
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default Erro404;