import css from './MenuLateral.module.css';

function MenuLateral() {

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
                    <img src="/IconCoracao.png" alt="Favoritos" className={css.icone_img} />
                    Favoritos
                </button>

                <button className={css.menu_item}>
                    <img src="/IconEngrenagem.png" alt="Minha conta" className={css.icone_img} />
                    Minha conta
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

export default MenuLateral;