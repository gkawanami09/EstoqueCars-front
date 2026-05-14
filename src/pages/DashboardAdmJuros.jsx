import { useEffect, useState } from "react";
import css from "./DashboardAdmJuros.module.css";

const CHAVE_CONFIG_JUROS = "config_taxa_juros_empresa";

const configuracaoInicial = {
    taxaMensal: "2.5",
    tipoJuros: "composto"
};

function numeroDoCampo(valor) {
    return Number(String(valor || "0").replace(",", "."));
}

function DashboardAdmJuros() {
    const [configuracao, setConfiguracao] = useState(configuracaoInicial);
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        const salvo = localStorage.getItem(CHAVE_CONFIG_JUROS);

        if (!salvo) return;

        try {
            setConfiguracao({
                ...configuracaoInicial,
                ...JSON.parse(salvo)
            });
        } catch {
            setConfiguracao(configuracaoInicial);
        }
    }, []);

    function atualizarCampo(campo, valor) {
        setConfiguracao((atual) => ({
            ...atual,
            [campo]: valor
        }));
        setMensagem("");
    }

    function salvarConfiguracao(evento) {
        evento.preventDefault();

        const taxaMensal = numeroDoCampo(configuracao.taxaMensal);

        if (taxaMensal < 0) {
            setMensagem("A taxa de juros nao pode ser negativa.");
            return;
        }

        localStorage.setItem(CHAVE_CONFIG_JUROS, JSON.stringify(configuracao));
        setMensagem("Taxa de juros salva com sucesso.");
    }

    return (
        <main className={css.pagina}>
            <header className={css.cabecalho}>
                <div>
                    <h1>Taxa de Juros</h1>
                    <p>Configure a taxa usada pela empresa para vendas parceladas.</p>
                </div>
            </header>

            {mensagem && (
                <div className={css.mensagem}>
                    {mensagem}
                </div>
            )}

            <form className={css.formulario} onSubmit={salvarConfiguracao}>
                <div className={css.campo}>
                    <label htmlFor="taxaMensal">Taxa mensal (%)</label>
                    <input
                        id="taxaMensal"
                        type="number"
                        min="0"
                        step="0.01"
                        value={configuracao.taxaMensal}
                        onChange={(e) => atualizarCampo("taxaMensal", e.target.value)}
                    />
                </div>

                <div className={css.campo}>
                    <label htmlFor="tipoJuros">Tipo de juros</label>
                    <select
                        id="tipoJuros"
                        value={configuracao.tipoJuros}
                        onChange={(e) => atualizarCampo("tipoJuros", e.target.value)}
                    >
                        <option value="composto">Composto</option>
                        <option value="simples">Simples</option>
                    </select>
                </div>

                <p className={css.aviso}>
                    Esta configuracao fica salva apenas neste navegador ate existir uma rota da API.
                </p>

                <button type="submit" className={css.salvar}>
                    Salvar taxa
                </button>
            </form>
        </main>
    );
}

export default DashboardAdmJuros;
