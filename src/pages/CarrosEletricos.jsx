// Importa recursos de ../components/CatalogoCarros/CatalogoCarros.
import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
// Importa recursos de ./CarrosEletricos.module.css.
import css from "./CarrosEletricos.module.css";

// Declara a função CarrosEletricos usada por esta página.
function CarrosEletricos({ API }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return <CatalogoCarros API={API} categoriaAtual="Elétrico" css={css} />;
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CarrosEletricos;
