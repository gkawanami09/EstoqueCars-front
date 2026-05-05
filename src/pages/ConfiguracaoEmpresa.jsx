import { useMemo, useState } from "react";
import css from "./ConfiguracaoEmpresa.module.css";
import { configPadrao, lerConfigEmpresa, salvarConfigEmpresa } from "../utils/configEmpresa";

const fontes = ["Montserrat", "Arial", "Inter", "Segoe UI", "Roboto", "Verdana"];

function ConfiguracaoEmpresa() {
    const configInicial = useMemo(() => lerConfigEmpresa(), []);
    const [config, setConfig] = useState(configInicial);
    const [mensagem, setMensagem] = useState("");

    function atualizarCampo(campo, valor) {
        setConfig((atual) => ({
            ...atual,
            [campo]: valor
        }));
    }

    function selecionarLogo(e) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            return;
        }

        if (!arquivo.type.startsWith("image/")) {
            setMensagem("Escolha um arquivo de imagem para usar como logo.");
            return;
        }

        const leitor = new FileReader();
        leitor.onload = () => {
            atualizarCampo("logo", String(leitor.result || ""));
        };
        leitor.readAsDataURL(arquivo);
    }

    function salvar(e) {
        e.preventDefault();
        salvarConfigEmpresa(config);
        setMensagem("Configurações salvas com sucesso.");
    }

    function restaurarPadrao() {
        setConfig(configPadrao);
        salvarConfigEmpresa(configPadrao);
        setMensagem("Configurações padrão restauradas.");
    }

    return (
        <main className={css.container}>
            <header className={css.cabecalho}>
                <div>
                    <h1>Configurar empresa</h1>
                    <p>Personalize a identidade visual usada no sistema.</p>
                </div>
            </header>

            {mensagem && (
                <div className={css.mensagem}>
                    <strong>Sucesso</strong>
                    <span>{mensagem}</span>
                    <button type="button" onClick={() => setMensagem("")} aria-label="Fechar mensagem">x</button>
                </div>
            )}

            <section className={css.grade}>
                <form className={css.formulario} onSubmit={salvar}>
                    <label>
                        Nome da empresa
                        <input
                            type="text"
                            value={config.nome}
                            onChange={(e) => atualizarCampo("nome", e.target.value)}
                            maxLength="80"
                        />
                    </label>

                    <div className={css.duplo}>
                        <label>
                            Cor principal
                            <input
                                type="color"
                                value={config.corPrincipal}
                                onChange={(e) => atualizarCampo("corPrincipal", e.target.value)}
                            />
                        </label>

                        <label>
                            Cor do menu
                            <input
                                type="color"
                                value={config.corMenu}
                                onChange={(e) => atualizarCampo("corMenu", e.target.value)}
                            />
                        </label>
                    </div>

                    <label>
                        Fonte do site
                        <select value={config.fonte} onChange={(e) => atualizarCampo("fonte", e.target.value)}>
                            {fontes.map((fonte) => (
                                <option key={fonte} value={fonte}>{fonte}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Logo do sistema
                        <input type="file" accept="image/*" onChange={selecionarLogo} />
                    </label>

                    <div className={css.botoes}>
                        <button type="button" className={css.cancelar} onClick={restaurarPadrao}>
                            Restaurar padrao
                        </button>
                        <button type="submit" className={css.salvar}>
                            Salvar configuracoes
                        </button>
                    </div>
                </form>

                <aside className={css.preview}>
                    <span>Previa</span>
                    <div className={css.preview_menu} style={{ background: config.corMenu }}>
                        <div className={css.preview_logo}>
                            {config.logo ? (
                                <img src={config.logo} alt={config.nome} />
                            ) : (
                                <strong>{String(config.nome || "E").slice(0, 1).toUpperCase()}</strong>
                            )}
                        </div>
                        <button type="button" style={{ background: config.corPrincipal }}>Dashboard</button>
                        <button type="button">Veículos</button>
                    </div>
                    <div className={css.preview_card} style={{ fontFamily: config.fonte }}>
                        <h2>{config.nome || "Estoque Cars"}</h2>
                        <p>Cor principal, fonte e logo aplicadas no sistema.</p>
                        <button type="button" style={{ background: config.corPrincipal }}>
                            Botão principal
                        </button>
                    </div>
                </aside>
            </section>
        </main>
    );
}

export default ConfiguracaoEmpresa;
