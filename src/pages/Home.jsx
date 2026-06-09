// Importa recursos de ../components/Banner/Banner.
import Banner from '../components/Banner/Banner'
// Importa recursos de ../components/Categoria/Categoria.
import Categoria from '../components/Categoria/Categoria'
// Importa recursos de ../components/CarrosHome/CarrosHome.
import CarrosHome from '../components/CarrosHome/CarrosHome'
// Importa recursos de ../components/Beneficio/Beneficio.
import Beneficio from '../components/Beneficio/Beneficio'
// Importa recursos de ../components/Etapas/Etapas.
import Etapas from '../components/Etapas/Etapas'
// Importa recursos de ../components/Faq/Faq.
import Faq from '../components/Faq/Faq'
// Importa recursos de ../components/Contato/Contato.
import Contato from '../components/Contato/Contato'

// Declara a função Home usada por esta página.
function Home() {
    // Retorna o resultado desta função ou o conteúdo visual da página.
    return(
        <>
            {/* Renderiza o componente Banner nesta parte da página. */}
            <Banner
                span1='Maior Garagem'
                titulo='de Carros Usados do'
                span2='Senai'
                subtitulo='Nossa equipe oferece uma ampla selecao de carros a pronta entrega.'
                buttonTo='/CarrosSedan'
                buttonNome='Ver carros'
            />

            {/* Renderiza o componente Categoria nesta parte da página. */}
            <Categoria subtitulo='Escolha o seu estilo de carro' titulo='Categorias'/>

            {/* Renderiza o componente Beneficio nesta parte da página. */}
            <Beneficio
                titulo1='Oferecemos uma'
                span1='ampla'
            />

            {/* Renderiza o componente Etapas nesta parte da página. */}
            <Etapas subtitulo='Siga etapas simples' titulo1='Como' span='Comprar' titulo2='seu Carro'/>

            {/* Renderiza o componente Faq nesta parte da página. */}
            <Faq subtitulo='FAQ' />

            {/* Renderiza o componente Contato nesta parte da página. */}
            <Contato />
        </>
    )
}

// Exporta esta página para que ela possa ser usada pelas rotas do sistema.
export default Home
