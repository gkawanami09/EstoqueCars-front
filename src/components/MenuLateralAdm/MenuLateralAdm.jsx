import css from './MenuLateralAdm.module.css';

function MenuLateralAdm() {

    return (
        <aside className={css.menu_lateral}>
            <div className={css.logo_container}>
                <img src="/ImgNavBar/LogoNav.png" alt="Estoque Cars" className={css.logo} />
            </div>

            <nav className={css.menu}>
                <button className={css.menu_item} >
                    <img src="/IconCar.png" alt="Dashboard" className={css.icone_img} />
                    Dashboard
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Veículo.png" alt="Veículos" className={css.icone_img} />
                    Veículos
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Vendas.png" alt="Vendas" className={css.icone_img} />
                    Vendas
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Estoque.png" alt="Estoque" className={css.icone_img} />
                    Estoque
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Clientes.png" alt="Clientes" className={css.icone_img} />
                    Clientes
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Documentos.png" alt="Documentos" className={css.icone_img} />
                    Documentos
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Financeiro.png" alt="Financeiro" className={css.icone_img} />
                    Financeiro
                </button>

                <button className={css.menu_item}>
                    <img src="/ImgNavBar/Relatórios.png" alt="Relatórios" className={css.icone_img} />
                    Relatórios
                </button>
            </nav>

            <div className={css.rodape_menu}>
                <button className={css.botao_sair}>
                    <img src="/IconSair.png" alt="Sair" className={css.icone_img} />
                    Sair
                </button>
            </div>
        </aside>
    );
}

export default MenuLateralAdm;