import Banner from '../components/Banner/Banner'
import Categoria from '../components/Categoria/Categoria'
import CarrosHome from '../components/CarrosHome/CarrosHome'
import Beneficio from '../components/Beneficio/Beneficio'
import Etapas from '../components/Etapas/Etapas'
import Faq from '../components/Faq/Faq'
import Contato from '../components/Contato/Contato'

function Home() {
    return(
        <>
            <Banner
                span1='Maior Garagem'
                titulo='de Carros Usados do'
                span2='Senai'
                subtitulo='Nossa equipe oferece uma ampla selecao de carros a pronta entrega.'
                buttonTo='/CarrosSedan'
                buttonNome='ver carros'
            />

            <Categoria subtitulo='Escolha o seu estilo de carro' titulo='Categorias'/>

            <Beneficio
                titulo1='Oferecemos uma'
                span1='ampla'
            />

            <Etapas subtitulo='Siga etapas simples' titulo1='Como' span='Comprar' titulo2='seu Carro'/>

            <Faq subtitulo='FAQ' />

            <Contato />
        </>
    )
}

export default Home
