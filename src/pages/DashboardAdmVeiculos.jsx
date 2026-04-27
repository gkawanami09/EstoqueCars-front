import css from "./DashboardAdmVeiculos.module.css";
import MenuLateralAdm from "../components/MenuLateralAdm/MenuLateralAdm.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function DashboardAdmVeiculos() {
    const navigate = useNavigate();
    return (
        <div className={css.layout_dashboard}>
            <MenuLateralAdm />
            <main className={css.conteudo_principal}>
                <header className={css.cabecalho}>
                    <h1 className={css.titulo_boas_vindas}>
                        Veículos
                    </h1>
                    <button
                        className={css.btn_add}
                        onClick={() => navigate("/cadastroVeiculos")}
                    >Cadastrar Veículo
                    </button>
                </header>
                <div className={css.area_busca}>
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

                <section className={css.tabela_container}>


                    <table className={css.tabela}>
                        <thead>
                        <tr>
                            <th>Foto</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Ano</th>
                            <th>Km</th>
                            <th>Cor</th>
                            <th>Preço</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center" }}>
                                Nenhum veículo cadastrado
                            </td>
                        </tr>
                        </tbody>

                    </table>
                </section>

            </main>
        </div>
    );
}

export default DashboardAdmVeiculos;