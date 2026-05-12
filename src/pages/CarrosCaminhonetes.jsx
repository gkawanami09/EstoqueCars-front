import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
import css from "./CarrosCaminhonetes.module.css";

function CarrosCaminhonetes({ API }) {
    return <CatalogoCarros API={API} categoriaAtual="Caminhonete" css={css} />;
}

export default CarrosCaminhonetes;
