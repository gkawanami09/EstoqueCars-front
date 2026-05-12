import CatalogoCarros from "../components/CatalogoCarros/CatalogoCarros";
import css from "./CarrosEsportivos.module.css";

function CarrosEsportivos({ API }) {
    return <CatalogoCarros API={API} categoriaAtual="Esportivo" css={css} />;
}

export default CarrosEsportivos;
