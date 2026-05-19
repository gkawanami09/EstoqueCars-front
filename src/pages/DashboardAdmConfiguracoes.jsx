import { useEffect, useState } from "react";
import Input from "../components/Input/Input.jsx";
import css from "./DashboardAdmConfiguracoes.module.css";

const TEMA_PADRAO = {
    corPrimaria: "#EF4444",
    corSecundaria: "#171414",
    fonte: "Montserrat",
    logo: "/ImgNavBar/LogoNav.png"
};
const JUROS_PADRAO = 4;

function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function montarUrlLogo(API, url) {
    if (!url) {
        return "";
    }

    if (String(url).includes("seu-servidor.com/uploads/")) {
        return `${API}/uploads/${String(url).split("/uploads/")[1]}?v=${Date.now()}`;
    }

    if (String(url).startsWith("/")) {
        return `${API}${url}?v=${Date.now()}`;
    }

    return String(url).includes("/uploads/") ? `${url}?v=${Date.now()}` : url;
}

function somenteNumeros(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function formatarCnpj(valor) {
    return somenteNumeros(valor)
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarTelefone(valor) {
    const numeros = somenteNumeros(valor).slice(0, 11);

    if (numeros.length <= 10) {
        return numeros
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return numeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function aplicarCores(corPrimaria, corSecundaria, fonte) {
    document.documentElement.style.setProperty("--cor-principal", corPrimaria || "#EF4444");
    document.documentElement.style.setProperty("--cor-secundaria", corSecundaria || "#171414");
    document.documentElement.style.setProperty("--preto-nav", corSecundaria || "#171414");
    document.documentElement.style.setProperty("--fonte-site", fonte || "Montserrat");
}

function salvarLogoSite(url) {
    if (!url) {
        return;
    }

    localStorage.removeItem("logo_padrao_ativo");
    localStorage.setItem("logo_site_url", url);
    window.dispatchEvent(new Event("logo-atualizada"));
}

function salvarTaxaJurosSite(taxa) {
    localStorage.setItem("taxa_juro_mensal", String(taxaJurosConfigurada(taxa)).replace(",", "."));
    window.dispatchEvent(new Event("juros-atualizado"));
}

function numeroDaTaxa(valor) {
    return Number(String(valor ?? "").replace(",", "."));
}

function taxaJurosConfigurada(valor) {
    const taxa = numeroDaTaxa(valor);
    return Number.isFinite(taxa) && taxa > 0 ? taxa : JUROS_PADRAO;
}

function voltarLogoPadraoSite() {
    localStorage.setItem("logo_padrao_ativo", "1");
    localStorage.removeItem("logo_site_url");
    window.dispatchEvent(new Event("logo-atualizada"));
}

function DashboardAdmConfiguracoes({ API }) {
    const [logo, setLogo] = useState(null);
    const [usarLogoPadrao, setUsarLogoPadrao] = useState(false);
    const [previewLogo, setPreviewLogo] = useState("");
    const [corPrimaria, setCorPrimaria] = useState(TEMA_PADRAO.corPrimaria);
    const [corSecundaria, setCorSecundaria] = useState(TEMA_PADRAO.corSecundaria);
    const [fonte, setFonte] = useState(TEMA_PADRAO.fonte);
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [taxaJuros, setTaxaJuros] = useState(String(JUROS_PADRAO));
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarConfiguracoes() {
            setCarregando(true);
            setErro("");

            try {
                const resposta = await fetch(`${API}/configuracoes`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                const dados = await resposta.json();

                if (!resposta.ok) {
                    setErro(dados.erro || "Erro ao carregar configuracoes.");
                    return;
                }

                const logoUrl = montarUrlLogo(API, dados.logo_url);
                const usandoPadrao = localStorage.getItem("logo_padrao_ativo") === "1";
                setPreviewLogo(usandoPadrao ? TEMA_PADRAO.logo : logoUrl);
                if (!usandoPadrao) {
                    salvarLogoSite(logoUrl);
                }
                setUsarLogoPadrao(false);
                setCorPrimaria(dados.cor_primaria || TEMA_PADRAO.corPrimaria);
                setCorSecundaria(dados.cor_secundaria || TEMA_PADRAO.corSecundaria);
                setFonte(dados.fonte_visual || TEMA_PADRAO.fonte);
                aplicarCores(dados.cor_primaria, dados.cor_secundaria, dados.fonte_visual);
                setNomeEmpresa(dados.nome_empresa || "");
                setCnpj(formatarCnpj(dados.cnpj || ""));
                setEmail(dados.email_contato || "");
                setTelefone(formatarTelefone(dados.telefone_empresa || dados.telefone_contato || ""));
                const taxaConfigurada = taxaJurosConfigurada(dados.taxa_juro ?? dados.taxa_juros);
                setTaxaJuros(String(taxaConfigurada));
                salvarTaxaJurosSite(taxaConfigurada);
            } catch {
                setErro("Erro de conexão com o servidor.");
            } finally {
                setCarregando(false);
            }
        }

        carregarConfiguracoes();
    }, [API]);

    useEffect(() => {
        aplicarCores(corPrimaria, corSecundaria, fonte);
    }, [corPrimaria, corSecundaria, fonte]);

    function alterarLogo(e) {
        const arquivo = e.target.files?.[0] || null;
        setLogo(arquivo);
        setUsarLogoPadrao(false);

        if (arquivo) {
            setPreviewLogo(URL.createObjectURL(arquivo));
        }
    }

    function voltarPadrao() {
        setCorPrimaria(TEMA_PADRAO.corPrimaria);
        setCorSecundaria(TEMA_PADRAO.corSecundaria);
        setFonte(TEMA_PADRAO.fonte);
        setTaxaJuros(String(JUROS_PADRAO));
        setLogo(null);
        setUsarLogoPadrao(true);
        setPreviewLogo(TEMA_PADRAO.logo);
        voltarLogoPadraoSite();
        salvarTaxaJurosSite(JUROS_PADRAO);
        aplicarCores(TEMA_PADRAO.corPrimaria, TEMA_PADRAO.corSecundaria, TEMA_PADRAO.fonte);
        setMensagem({
            tipo: "sucesso",
            texto: "Padrao aplicado. Clique em Salvar para gravar."
        });
    }

    async function salvar(e) {
        e.preventDefault();
        setErro("");
        setMensagem(null);
        setSalvando(true);

        const formData = new FormData();
        formData.append("nome_empresa", nomeEmpresa);
        formData.append("cnpj", somenteNumeros(cnpj));
        formData.append("telefone_empresa", somenteNumeros(telefone));
        formData.append("telefone_contato", somenteNumeros(telefone));
        formData.append("email_contato", email);
        const taxaParaSalvar = taxaJurosConfigurada(taxaJuros);
        formData.append("taxa_juro", String(taxaParaSalvar).replace(",", "."));
        formData.append("taxa_juros", String(taxaParaSalvar).replace(",", "."));
        formData.append("cor_primaria", corPrimaria);
        formData.append("cor_secundaria", corSecundaria);
        formData.append("fonte_visual", fonte);

        try {
            if (logo) {
                formData.append("logo", logo);
            }

            const resposta = await fetch(`${API}/configuracoes`, {
                method: "PUT",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            const dados = await resposta.json();

            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao salvar configuracoes.");
                return;
            }

            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Configurações atualizadas com sucesso!"
            });
            setTaxaJuros(String(taxaParaSalvar));
            aplicarCores(corPrimaria, corSecundaria, fonte);
            salvarTaxaJurosSite(taxaParaSalvar);

            if (logo || usarLogoPadrao) {
                const logoAtualizada = `${API}/uploads/logo_empresa.png?v=${Date.now()}`;
                setPreviewLogo(logoAtualizada);
                if (usarLogoPadrao) {
                    voltarLogoPadraoSite();
                    setPreviewLogo(TEMA_PADRAO.logo);
                } else {
                    salvarLogoSite(logoAtualizada);
                }
            }

            setLogo(null);
            setUsarLogoPadrao(false);
        } catch {
            setErro("Erro de conexão com o servidor.");
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>Configurações da Plataforma</h1>

            {mensagem && (
                <div className={css.mensagem}>
                    {mensagem.texto}
                </div>
            )}

            {carregando && (
                <div className={css.mensagem}>
                    Carregando configurações...
                </div>
            )}

            <form className={css.formulario} onSubmit={salvar}>
                <div className={css.grid}>
                    <div className={css.esquerda}>
                        <h2>Logo</h2>

                        {previewLogo && (
                            <img src={previewLogo} className={css.logoPreview} alt="Logo da empresa" />
                        )}

                        <input type="file" accept="image/*" onChange={alterarLogo} />

                        <h2>Cores</h2>

                        <div className={css.duplo}>
                            <Input
                                label="Cor primaria"
                                type="color"
                                value={corPrimaria}
                                onChange={(e) => setCorPrimaria(e.target.value)}
                            />

                            <Input
                                label="Cor secundaria"
                                type="color"
                                value={corSecundaria}
                                onChange={(e) => setCorSecundaria(e.target.value)}
                            />
                        </div>

                        <h2>Fonte</h2>

                        <select
                            className={css.select}
                            value={fonte}
                            onChange={(e) => setFonte(e.target.value)}
                        >
                            <option>Arial</option>
                            <option>Roboto</option>
                            <option>Montserrat</option>
                        </select>
                    </div>

                    <div className={css.direita}>
                        <h2>Dados da Empresa</h2>

                        <Input
                            label="Nome"
                            value={nomeEmpresa}
                            onChange={(e) => setNomeEmpresa(e.target.value)}
                        />

                        <Input
                            label="CNPJ"
                            value={cnpj}
                            inputMode="numeric"
                            maxLength={18}
                            onChange={(e) => setCnpj(formatarCnpj(e.target.value))}
                        />

                        <h2>Contato</h2>

                        <Input
                            label="E-mail"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <Input
                            label="Telefone"
                            value={telefone}
                            inputMode="numeric"
                            maxLength={15}
                            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                        />

                        <h2>Juros da Empresa</h2>

                        <label className={css.campo}>
                            <span>Taxa mensal (%)</span>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={taxaJuros}
                                onChange={(e) => setTaxaJuros(e.target.value)}
                            />
                        </label>
                    </div>
                </div>

                {erro && <p className={css.erro}>{erro}</p>}

                <div className={css.botoes}>
                    <button className={css.botaoPadrao} type="button" onClick={voltarPadrao} disabled={salvando || carregando}>
                        Voltar ao padrão
                    </button>
                    <button className={css.salvar} type="submit" disabled={salvando || carregando}>
                        {salvando ? "Salvando..." : "Salvar"}
                    </button>
                </div>
            </form>
        </main>
    );
}

export default DashboardAdmConfiguracoes;
