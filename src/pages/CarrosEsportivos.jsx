// Importa recursos de ../components/CatalogoCarros/CatalogoCarros.
import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
// Importa recursos de ./CarrosEsportivos.module.css.
import css from "./CarrosEsportivos.module.css";

// Declara a função CarrosEsportivos usada por esta página.
function CarrosEsportivos({ API }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return <CatalogoCarros API={API} categoriaAtual="Esportivo" css={css} />;
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CarrosEsportivos;
