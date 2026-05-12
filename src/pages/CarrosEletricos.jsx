import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
import css from "./CarrosEletricos.module.css";

function CarrosEletricos({ API }) {
    return <CatalogoCarros API={API} categoriaAtual="Elétrico" css={css} />;
}

export default CarrosEletricos;
