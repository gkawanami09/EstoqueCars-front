import Header from "../components/Header/Header"
import Banner from "../components/Banner/Banner"
import Categoria from "../components/Categoria/Categoria"
import CarrosHome from "../components/CarrosHome/CarrosHome"

function Home() {
    return(
        <>
            <Header />
            <Banner span1="Maior Garagem" titulo="de Carros Usados do" span2="Senai" subtitulo="Nossa equipe oferece uma ampla seleção de carros a pronta entrega." buttonTo="/carros" buttonNome="ver carros"/>
            <Categoria subtitulo="Escolha o seu estilo de carro" titulo="Categorias"/>
            <CarrosHome subtitulo="Explore nossa coleção exclusiva" titulo="Diversos Modelos de " span="Carros"/>
        </>
    )
}

export default Home