import { useEffect } from "react";

function ConfiguracoesSite({ API }) {
  useEffect(() => {
    function montarLogoUrl(logoUrl) {
      if (!logoUrl) return "";

      if (logoUrl.startsWith("/")) return `${API}${logoUrl}?v=${Date.now()}`;

      if (logoUrl.includes("seu-servidor.com/uploads/")) {
        return `${API}/uploads/${logoUrl.split("/uploads/")[1]}?v=${Date.now()}`;
      }

      return logoUrl.includes("/uploads/") ? `${logoUrl}?v=${Date.now()}` : logoUrl;
    }

    function aplicarConfiguracoes(dados) {
      document.documentElement.style.setProperty("--cor-principal", dados.cor_primaria || "#EF4444");
      document.documentElement.style.setProperty("--cor-secundaria", dados.cor_secundaria || "#171414");
      document.documentElement.style.setProperty("--preto-nav", dados.cor_secundaria || "#171414");
      document.documentElement.style.setProperty("--fonte-site", dados.fonte_visual || "Montserrat");

      const logoUrl = montarLogoUrl(dados.logo_url);
      const taxaJuro = dados.taxa_juro ?? dados.taxa_juros;

      if (taxaJuro !== undefined && taxaJuro !== null) {
        localStorage.setItem("taxa_juro_mensal", String(taxaJuro));
        window.dispatchEvent(new Event("juros-atualizado"));
      }

      if (logoUrl && localStorage.getItem("logo_padrao_ativo") !== "1") {
        localStorage.setItem("logo_site_url", logoUrl);
        window.dispatchEvent(new Event("logo-atualizada"));
      }
    }

    async function carregarConfiguracoes() {
      try {
        const token = localStorage.getItem("access_token");
        const resposta = await fetch(`${API}/configuracoes`, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include"
        });

        if (!resposta.ok) {
          return;
        }

        const dados = await resposta.json();
        aplicarConfiguracoes(dados);
      } catch {
        // Mantem as cores padrao do index.css se a API nao responder.
      }
    }

    carregarConfiguracoes();
  }, [API]);

  return null;
}

export default ConfiguracoesSite;
