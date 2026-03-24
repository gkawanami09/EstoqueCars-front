import Header from "../components/Header/Header"
import Banner from "../components/Banner/Banner"
import Categoria from "../components/Categoria/Categoria"
import CarrosHome from "../components/CarrosHome/CarrosHome"
import Beneficio from "../components/Beneficio/Beneficio"
import Etapas from "../components/Etapas/Etapas"

function Home() {
    return(
        <>
            <Header />
            <Banner span1="Maior Garagem" titulo="de Carros Usados do" span2="Senai" subtitulo="Nossa equipe oferece uma ampla seleção de carros a pronta entrega." buttonTo="/carros" buttonNome="ver carros"/>
            <Categoria subtitulo="Escolha o seu estilo de carro" titulo="Categorias"/>
            <CarrosHome subtitulo="Explore nossa coleção exclusiva" titulo="Diversos Modelos de " span="Carros"/>
            <Beneficio titulo1="Oferecemos uma" span1="ampla" titulo2="seleção de" span2="carros acessíveis" subtitulo="O HB20 é um usado acessível que chama atenção pelo equilíbrio entre economia, estilo e praticidade."/>
            <Etapas subtitulo="Siga etapas simples" titulo1="Como" span="comprar" titulo2="seu carro"/>
        </>
    )
}

export default Home