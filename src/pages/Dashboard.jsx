import css from "./Dashboard.module.css";

function Dashboard() {
    let usuario = {};

    try {
        usuario = JSON.parse(localStorage.getItem("usuario_logado")) || {};
    } catch {
        usuario = {};
    }

    const nomeUsuario = usuario.nome || "Usuario";

    return (
        <div className={css.layout_dashboard}>

            <main className={css.conteudo_principal}>

                <header className={css.cabecalho}>
                    <h1 className={css.titulo_boas_vindas}>
                        Bem-vindo, <span className={css.nome_usuario}>{nomeUsuario}</span>
                    </h1>
                    <div className={css.area_usuario}>
                        <div className={css.perfil_usuario}>

                        </div>
                    </div>
                </header>

                <div className={css.area_busca}>
                    <img
                        src="/IconBusca.png"
                        alt="Buscar"
                        className={css.icone_busca}
                    />
                    <input
                        type="text"
                        placeholder="Buscar veiculos"
                        className={css.input_busca}
                    />
                </div>

                <section className={css.secao_filtros}>
                    <button className={css.botao_filtro}>Sedan</button>
                    <button className={css.botao_filtro}>Eletrico</button>
                    <button className={css.botao_filtro}>Esportivo</button>
                    <button className={css.botao_filtro}>Caminhonete</button>
                    <button className={css.botao_filtro}>SUV</button>
                </section>

            </main>
        </div>
    );
}

export default Dashboard;
