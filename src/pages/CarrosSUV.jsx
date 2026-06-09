// Importa recursos de ../components/CatalogoCarros/CatalogoCarros.
import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
// Importa recursos de ./CarrosSUV.module.css.
import css from "./CarrosSUV.module.css";

// Declara a função CarrosSUV usada por esta página.
function CarrosSUV({ API }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return <CatalogoCarros API={API} categoriaAtual="SUV" css={css} />;
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CarrosSUV;
