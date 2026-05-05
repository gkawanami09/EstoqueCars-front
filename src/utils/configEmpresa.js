const CHAVE_CONFIG_EMPRESA = "config_empresa";

const configPadrao = {
    nome: "Estoque Cars",
    corPrincipal: "#f25555",
    corMenu: "#171414",
    fonte: "Montserrat",
    logo: ""
};

function lerConfigEmpresa() {
    try {
        const configSalva = JSON.parse(localStorage.getItem(CHAVE_CONFIG_EMPRESA) || "{}");
        return {
            ...configPadrao,
            ...configSalva
        };
    } catch {
        return configPadrao;
    }
}

function aplicarConfigEmpresa(config = lerConfigEmpresa()) {
    const configuracao = {
        ...configPadrao,
        ...config
    };

    document.documentElement.style.setProperty("--vermelho", configuracao.corPrincipal);
    document.documentElement.style.setProperty("--cor-principal", configuracao.corPrincipal);
    document.documentElement.style.setProperty("--preto-nav", configuracao.corMenu);
    document.documentElement.style.setProperty("--fonte-site", configuracao.fonte);
}

function salvarConfigEmpresa(config) {
    const configuracao = {
        ...configPadrao,
        ...config
    };

    localStorage.setItem(CHAVE_CONFIG_EMPRESA, JSON.stringify(configuracao));
    aplicarConfigEmpresa(configuracao);
    window.dispatchEvent(new Event("config_empresa_atualizada"));
}

export { CHAVE_CONFIG_EMPRESA, aplicarConfigEmpresa, configPadrao, lerConfigEmpresa, salvarConfigEmpresa };
