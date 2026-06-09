// Importa recursos de ../components/CatalogoCarros/CatalogoCarros.
import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
// Importa recursos de ./CarrosSedan.module.css.
import css from "./CarrosSedan.module.css";

// Declara a função CarrosSedan usada por esta página.
function CarrosSedan({ API }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return <CatalogoCarros API={API} categoriaAtual="Sedan" css={css} />;
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CarrosSedan;
