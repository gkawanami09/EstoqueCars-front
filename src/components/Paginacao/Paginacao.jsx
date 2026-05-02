import css from "./Paginacao.module.css";

const ITENS_POR_PAGINA = 15;

function Paginacao({ paginaAtual, totalItens, onMudarPagina }) {
    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);

    if (totalPaginas <= 1) {
        return null;
    }

    return (
        <nav className={css.paginacao} aria-label="Paginacao da listagem">
            <button
                type="button"
                onClick={() => onMudarPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
            >
                Anterior
            </button>

            <span>
                Pagina {paginaAtual} de {totalPaginas}
            </span>

            <button
                type="button"
                onClick={() => onMudarPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
            >
                Proxima
            </button>
        </nav>
    );
}

export { ITENS_POR_PAGINA };
export default Paginacao;
