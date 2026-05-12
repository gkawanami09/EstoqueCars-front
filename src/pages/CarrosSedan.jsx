import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
import css from "./CarrosSedan.module.css";

function CarrosSedan({ API }) {
    return <CatalogoCarros API={API} categoriaAtual="Sedan" css={css} />;
}

export default CarrosSedan;
