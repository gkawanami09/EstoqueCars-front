import css from "./Dashboard.module.css";
import MenuLateral from "../components/MenuLateral/MenuLateral.jsx";

function Dashboard() {

    return (
        <div className={css.layout_dashboard}>

            <MenuLateral />

            <main className={css.conteudo_principal}>

                <header className={css.cabecalho}>
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>Usuário</span>
                    </h1>
                    <div className={css.area_usuario}>
                        <div className={css.perfil_usuario}>

                        </div>
                    </div>
                </header>

                <div className={css.area_busca}>
                    {/* Ícone de busca adicionado aqui na frente */}
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    <input
                        type="text"
                        placeholder="Buscar veículos"
                        className={css.input_busca}
                    />
                </div>

                <section className={css.secao_filtros}>
                    <button className={css.botao_filtro}>Sedan</button>
                    <button className={css.botao_filtro}>Elétrico</button>
                    <button className={css.botao_filtro}>Esportivo</button>
                    <button className={css.botao_filtro}>Caminhonete</button>
                    <button className={css.botao_filtro}>SUV</button>
                </section>

            </main>
        </div>
    );
}

export default Dashboard;