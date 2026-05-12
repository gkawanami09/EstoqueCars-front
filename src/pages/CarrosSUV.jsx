import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
import css from "./CarrosSUV.module.css";

function CarrosSUV({ API }) {
    return <CatalogoCarros API={API} categoriaAtual="SUV" css={css} />;
}

export default CarrosSUV;
