// Importa recursos de ../components/CatalogoCarros/CatalogoCarros.
import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
// Importa recursos de ./CarrosCaminhonetes.module.css.
import css from "./CarrosCaminhonetes.module.css";

// Declara a função CarrosCaminhonetes usada por esta página.
function CarrosCaminhonetes({ API }) {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return <CatalogoCarros API={API} categoriaAtual="Caminhonete" css={css} />;
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default CarrosCaminhonetes;
