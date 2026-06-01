// Importa os hooks do React usados para efeitos e estados.
import { useEffect, useState } from "react";
// Importa o componente de input reutilizavel do projeto.
import Input from "../components/Input/Input.jsx";
// Importa as classes CSS module desta pagina.
import css from "./DashboardAdmConfiguracoes.module.css";

// Define os valores padrao do tema visual da plataforma.
const TEMA_PADRAO = {
    corPrimaria: "#EF4444",
    corSecundaria: "#171414",
    fonte: "Montserrat",
    logo: "/ImgNavBar/LogoNav.png"
};
// Define a taxa de juros mensal padrao.
const JUROS_PADRAO = 4;

// Monta o cabecalho de autorizacao para chamadas autenticadas.
function cabecalhoAutorizacao() {
    // Busca o token salvo no navegador.
    const token = localStorage.getItem("access_token");
    // Se houver token, retorna Authorization Bearer; senao, retorna undefined.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Monta a URL correta da logo para exibicao no navegador.
function montarUrlLogo(API, url) {
    // Se nao houver URL, retorna vazio.
    if (!url) {
        return "";
    }

    // Corrige URLs antigas que apontavam para um servidor generico.
    if (String(url).includes("seu-servidor.com/uploads/")) {
        return `${API}/uploads/${String(url).split("/uploads/")[1]}?v=${Date.now()}`;
    }

    // Se a URL vier como caminho absoluto do servidor, junta com a base da API.
    if (String(url).startsWith("/")) {
        return `${API}${url}?v=${Date.now()}`;
    }

    // Se for arquivo de uploads, adiciona versao para evitar cache.
    return String(url).includes("/uploads/") ? `${url}?v=${Date.now()}` : url;
}

// Remove tudo que nao for numero de um texto.
function somenteNumeros(valor) {
    return String(valor || "").replace(/\D/g, "");
}

// Formata um CNPJ no padrao 00.000.000/0000-00.
function formatarCnpj(valor) {
    // Mantem apenas numeros, limita em 14 digitos e aplica as mascaras.
    return somenteNumeros(valor)
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

// Aplica as cores e fonte escolhidas nas variaveis CSS globais.
function aplicarCores(corPrimaria, corSecundaria, fonte) {
    // Atualiza a cor principal do site.
    document.documentElement.style.setProperty("--cor-principal", corPrimaria || "#EF4444");
    // Atualiza a cor secundaria do site.
    document.documentElement.style.setProperty("--cor-secundaria", corSecundaria || "#171414");
    // Atualiza a cor usada na navegacao.
    document.documentElement.style.setProperty("--preto-nav", corSecundaria || "#171414");
    // Atualiza a fonte global do site.
    document.documentElement.style.setProperty("--fonte-site", fonte || "Montserrat");
}

// Salva a URL da logo atual no localStorage e avisa o restante do app.
function salvarLogoSite(url) {
    // Se nao houver URL, nao faz nada.
    if (!url) {
        return;
    }

    // Remove a flag de logo padrao.
    localStorage.removeItem("logo_padrao_ativo");
    // Salva a URL da logo personalizada.
    localStorage.setItem("logo_site_url", url);
    // Dispara um evento para componentes que escutam atualizacao de logo.
    window.dispatchEvent(new Event("logo-atualizada"));
}

// Salva a taxa de juros no localStorage e avisa o restante do app.
function salvarTaxaJurosSite(taxa) {
    // Normaliza a taxa antes de salvar.
    localStorage.setItem("taxa_juro_mensal", String(taxaJurosConfigurada(taxa)).replace(",", "."));
    // Dispara evento para telas que usam juros.
    window.dispatchEvent(new Event("juros-atualizado"));
}

// Salva a chave Pix da empresa no localStorage e avisa o app.
function salvarChavePixSite(chavePix) {
    // Salva a chave Pix como texto.
    localStorage.setItem("chave_pix_empresa", String(chavePix || ""));
    // Dispara evento para telas que usam Pix da empresa.
    window.dispatchEvent(new Event("pix-empresa-atualizado"));
}

// Converte um valor de taxa para numero.
function numeroDaTaxa(valor) {
    return Number(String(valor ?? "").replace(",", "."));
}

// Retorna uma taxa valida ou a taxa padrao.
function taxaJurosConfigurada(valor) {
    // Converte o valor informado para numero.
    const taxa = numeroDaTaxa(valor);
    // Usa a taxa informada se for positiva; senao, usa o padrao.
    return Number.isFinite(taxa) && taxa > 0 ? taxa : JUROS_PADRAO;
}

// Ativa a logo padrao no localStorage e avisa o restante do app.
function voltarLogoPadraoSite() {
    // Salva a flag que indica uso da logo padrao.
    localStorage.setItem("logo_padrao_ativo", "1");
    // Remove a URL da logo personalizada.
    localStorage.removeItem("logo_site_url");
    // Dispara evento de atualizacao da logo.
    window.dispatchEvent(new Event("logo-atualizada"));
}

// Componente principal da tela de configuracoes administrativas.
function DashboardAdmConfiguracoes({ API }) {
    // Guarda o arquivo de logo selecionado.
    const [logo, setLogo] = useState(null);
    // Indica se o usuario quer voltar para a logo padrao.
    const [usarLogoPadrao, setUsarLogoPadrao] = useState(false);
    // Guarda a URL usada no preview da logo.
    const [previewLogo, setPreviewLogo] = useState("");
    // Guarda a cor primaria escolhida.
    const [corPrimaria, setCorPrimaria] = useState(TEMA_PADRAO.corPrimaria);
    // Guarda a cor secundaria escolhida.
    const [corSecundaria, setCorSecundaria] = useState(TEMA_PADRAO.corSecundaria);
    // Guarda a fonte escolhida.
    const [fonte, setFonte] = useState(TEMA_PADRAO.fonte);
    // Guarda o nome da empresa.
    const [nomeEmpresa, setNomeEmpresa] = useState("");
    // Guarda o CNPJ formatado.
    const [cnpj, setCnpj] = useState("");
    // Guarda o email de contato.
    const [email, setEmail] = useState("");
    // Guarda o telefone da empresa.
    const [telefone, setTelefone] = useState("");
    // Guarda a chave Pix da empresa.
    const [chavePix, setChavePix] = useState("");
    // Guarda a taxa de juros mensal.
    const [taxaJuros, setTaxaJuros] = useState(String(JUROS_PADRAO));
    // Controla o carregamento inicial das configuracoes.
    const [carregando, setCarregando] = useState(true);
    // Controla o carregamento do botao de salvar.
    const [salvando, setSalvando] = useState(false);
    // Guarda mensagem de sucesso ou aviso.
    const [mensagem, setMensagem] = useState(null);
    // Guarda mensagem de erro.
    const [erro, setErro] = useState("");

    // Carrega as configuracoes salvas quando a pagina abre.
    useEffect(() => {
        // Funcao interna porque useEffect nao pode ser async diretamente.
        async function carregarConfiguracoes() {
            // Ativa o carregamento.
            setCarregando(true);
            // Limpa erro anterior.
            setErro("");

            // Tenta buscar as configuracoes na API.
            try {
                // Faz a chamada GET para configuracoes.
                const resposta = await fetch(`${API}/configuracoes`, {
                    method: "GET",
                    headers: cabecalhoAutorizacao(),
                    credentials: "include"
                });
                // Converte a resposta para JSON.
                const dados = await resposta.json();

                // Trata resposta de erro da API.
                if (!resposta.ok) {
                    setErro(dados.erro || "Erro ao carregar configurações.");
                    return;
                }

                // Monta a URL final da logo salva.
                const logoUrl = montarUrlLogo(API, dados.logo_url);
                // Verifica se o usuario marcou a logo padrao.
                const usandoPadrao = localStorage.getItem("logo_padrao_ativo") === "1";
                // Define o preview da logo conforme padrao ou logo salva.
                setPreviewLogo(usandoPadrao ? TEMA_PADRAO.logo : logoUrl);
                // Se nao esta usando padrao, propaga a logo salva para o app.
                if (!usandoPadrao) {
                    salvarLogoSite(logoUrl);
                }
                // Reseta a flag local de voltar para logo padrao.
                setUsarLogoPadrao(false);
                // Salva a cor primaria vinda da API ou o padrao.
                setCorPrimaria(dados.cor_primaria || TEMA_PADRAO.corPrimaria);
                // Salva a cor secundaria vinda da API ou o padrao.
                setCorSecundaria(dados.cor_secundaria || TEMA_PADRAO.corSecundaria);
                // Salva a fonte visual vinda da API ou o padrao.
                setFonte(dados.fonte_visual || TEMA_PADRAO.fonte);
                // Aplica as cores e fonte no site imediatamente.
                aplicarCores(dados.cor_primaria, dados.cor_secundaria, dados.fonte_visual);
                // Preenche o nome da empresa.
                setNomeEmpresa(dados.nome_empresa || "");
                // Preenche e formata o CNPJ.
                setCnpj(formatarCnpj(dados.cnpj || ""));
                // Preenche o email de contato.
                setEmail(dados.email_contato || "");
                // Preenche o telefone aceitando dois nomes de campo.
                setTelefone(dados.telefone_empresa || dados.telefone_contato || "");
                // Busca a chave Pix em varios campos possiveis.
                const chavePixConfigurada = dados.chave_pix || dados.chave_pix_empresa || dados.pix_chave || "";
                // Salva a chave Pix no estado.
                setChavePix(chavePixConfigurada);
                // Propaga a chave Pix para o localStorage.
                salvarChavePixSite(chavePixConfigurada);
                // Normaliza a taxa de juros vinda da API.
                const taxaConfigurada = taxaJurosConfigurada(dados.taxa_juro ?? dados.taxa_juros);
                // Salva a taxa no estado.
                setTaxaJuros(String(taxaConfigurada));
                // Propaga a taxa para o localStorage.
                salvarTaxaJurosSite(taxaConfigurada);
            } catch {
                // Mostra erro quando nao consegue conectar ao servidor.
                setErro("Erro de conexão com o servidor.");
            } finally {
                // Desliga o carregamento.
                setCarregando(false);
            }
        }

        // Executa o carregamento das configuracoes.
        carregarConfiguracoes();
    }, [API]);

    // Aplica cores e fonte sempre que o usuario altera algum valor visual.
    useEffect(() => {
        aplicarCores(corPrimaria, corSecundaria, fonte);
    }, [corPrimaria, corSecundaria, fonte]);

    // Atualiza a logo quando o usuario escolhe um arquivo.
    function alterarLogo(e) {
        // Pega o primeiro arquivo selecionado.
        const arquivo = e.target.files?.[0] || null;
        // Salva o arquivo no estado.
        setLogo(arquivo);
        // Desmarca a opcao de logo padrao.
        setUsarLogoPadrao(false);

        // Se existe arquivo, cria uma URL temporaria para preview.
        if (arquivo) {
            setPreviewLogo(URL.createObjectURL(arquivo));
        }
    }

    // Restaura os valores visuais e financeiros padrao.
    function voltarPadrao() {
        // Restaura cor primaria padrao.
        setCorPrimaria(TEMA_PADRAO.corPrimaria);
        // Restaura cor secundaria padrao.
        setCorSecundaria(TEMA_PADRAO.corSecundaria);
        // Restaura fonte padrao.
        setFonte(TEMA_PADRAO.fonte);
        // Restaura taxa de juros padrao.
        setTaxaJuros(String(JUROS_PADRAO));
        // Limpa chave Pix.
        setChavePix("");
        // Remove arquivo de logo selecionado.
        setLogo(null);
        // Marca que a logo padrao deve ser usada.
        setUsarLogoPadrao(true);
        // Mostra a logo padrao no preview.
        setPreviewLogo(TEMA_PADRAO.logo);
        // Atualiza o localStorage para usar logo padrao.
        voltarLogoPadraoSite();
        // Salva a taxa padrao para o app.
        salvarTaxaJurosSite(JUROS_PADRAO);
        // Limpa a chave Pix salva para o app.
        salvarChavePixSite("");
        // Aplica o tema padrao imediatamente.
        aplicarCores(TEMA_PADRAO.corPrimaria, TEMA_PADRAO.corSecundaria, TEMA_PADRAO.fonte);
        // Mostra aviso orientando a salvar.
        setMensagem({
            tipo: "sucesso",
            texto: "Padrão aplicado. Clique em Salvar para gravar."
        });
    }

    // Salva as configuracoes no backend.
    async function salvar(e) {
        // Impede o submit padrao do formulario.
        e.preventDefault();
        // Limpa erro anterior.
        setErro("");
        // Limpa mensagem anterior.
        setMensagem(null);
        // Ativa carregamento do salvar.
        setSalvando(true);

        // Cria FormData porque pode haver upload de arquivo.
        const formData = new FormData();
        // Adiciona o nome da empresa.
        formData.append("nome_empresa", nomeEmpresa);
        // Adiciona o CNPJ apenas com numeros.
        formData.append("cnpj", somenteNumeros(cnpj));
        // Adiciona o telefone da empresa apenas com numeros.
        formData.append("telefone_empresa", somenteNumeros(telefone));
        // Adiciona o telefone de contato tambem apenas com numeros.
        formData.append("telefone_contato", somenteNumeros(telefone));
        // Adiciona o email de contato.
        formData.append("email_contato", email);
        // Adiciona a chave Pix em campos alternativos aceitos pela API.
        formData.append("chave_pix", chavePix.trim());
        formData.append("chave_pix_empresa", chavePix.trim());
        formData.append("pix_chave", chavePix.trim());
        // Normaliza a taxa antes de salvar.
        const taxaParaSalvar = taxaJurosConfigurada(taxaJuros);
        // Adiciona a taxa em dois nomes possiveis de campo.
        formData.append("taxa_juro", String(taxaParaSalvar).replace(",", "."));
        formData.append("taxa_juros", String(taxaParaSalvar).replace(",", "."));
        // Adiciona a cor primaria.
        formData.append("cor_primaria", corPrimaria);
        // Adiciona a cor secundaria.
        formData.append("cor_secundaria", corSecundaria);
        // Adiciona a fonte visual.
        formData.append("fonte_visual", fonte);

        // Tenta salvar as configuracoes.
        try {
            // Se o usuario selecionou uma logo, adiciona o arquivo.
            if (logo) {
                formData.append("logo", logo);
            }

            // Envia a requisicao PUT para atualizar configuracoes.
            const resposta = await fetch(`${API}/configuracoes`, {
                method: "PUT",
                headers: cabecalhoAutorizacao(),
                credentials: "include",
                body: formData
            });
            // Converte a resposta para JSON.
            const dados = await resposta.json();

            // Trata erro retornado pela API.
            if (!resposta.ok) {
                setErro(dados.erro || "Erro ao salvar configurações.");
                return;
            }

            // Mostra mensagem de sucesso.
            setMensagem({
                tipo: "sucesso",
                texto: dados.mensagem || "Configurações atualizadas com sucesso!"
            });
            // Atualiza a taxa normalizada no estado.
            setTaxaJuros(String(taxaParaSalvar));
            // Aplica as cores e fonte salvas.
            aplicarCores(corPrimaria, corSecundaria, fonte);
            // Salva a taxa no localStorage para outras telas.
            salvarTaxaJurosSite(taxaParaSalvar);
            // Salva a chave Pix no localStorage para outras telas.
            salvarChavePixSite(chavePix.trim());

            // Atualiza a logo global se houve upload ou retorno ao padrao.
            if (logo || usarLogoPadrao) {
                // Monta a URL esperada da logo enviada.
                const logoAtualizada = `${API}/uploads/logo_empresa.png?v=${Date.now()}`;
                // Atualiza o preview com a logo enviada.
                setPreviewLogo(logoAtualizada);
                // Se o usuario escolheu padrao, volta para a logo padrao.
                if (usarLogoPadrao) {
                    voltarLogoPadraoSite();
                    setPreviewLogo(TEMA_PADRAO.logo);
                } else {
                    // Caso contrario, salva a logo enviada.
                    salvarLogoSite(logoAtualizada);
                }
            }

            // Limpa o arquivo selecionado apos salvar.
            setLogo(null);
            // Reseta a flag de logo padrao.
            setUsarLogoPadrao(false);
        } catch {
            // Mostra erro quando nao consegue conectar ao servidor.
            setErro("Erro de conexão com o servidor.");
        } finally {
            // Desliga o carregamento do salvar.
            setSalvando(false);
        }
    }

    // Renderiza a tela de configuracoes.
    return (
        // Container principal da pagina.
        <main className={css.container}>
            <h1 className={css.titulo}>Configurações da Plataforma</h1>

            {/* Mensagem de sucesso ou aviso. */}
            {mensagem && (
                <div className={css.mensagem}>
                    {mensagem.texto}
                </div>
            )}

            {/* Mensagem exibida enquanto as configuracoes carregam. */}
            {carregando && (
                <div className={css.mensagem}>
                    Carregando configurações...
                </div>
            )}

            {/* Formulario principal de configuracoes. */}
            <form className={css.formulario} onSubmit={salvar}>
                <div className={css.grid}>
                    {/* Coluna esquerda com logo, cores e fonte. */}
                    <div className={css.esquerda}>
                        <h2>Logo</h2>

                        {/* Preview da logo atual. */}
                        {previewLogo && (
                            <img src={previewLogo} className={css.logoPreview} alt="Logo da empresa" />
                        )}

                        {/* Campo de upload da logo. */}
                        <input type="file" accept="image/*" onChange={alterarLogo} />

                        <h2>Cores</h2>

                        {/* Inputs de cor primaria e secundaria. */}
                        <div className={css.duplo}>
                            <Input
                                label="Cor primária"
                                type="color"
                                value={corPrimaria}
                                onChange={(e) => setCorPrimaria(e.target.value)}
                            />

                            <Input
                                label="Cor secundária"
                                type="color"
                                value={corSecundaria}
                                onChange={(e) => setCorSecundaria(e.target.value)}
                            />
                        </div>

                        <h2>Fonte</h2>

                        {/* Select de fonte visual do site. */}
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

                    {/* Coluna direita com dados da empresa, Pix e juros. */}
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
                            onChange={(e) => setTelefone(e.target.value)}
                        />

                        <h2>Pix da Empresa</h2>

                        {/* Campo da chave Pix usada nas vendas. */}
                        <label className={css.campo}>
                            <span>Chave Pix</span>
                            <input
                                type="text"
                                value={chavePix}
                                onChange={(e) => setChavePix(e.target.value)}
                                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                            />
                        </label>

                        <h2>Juros da Empresa</h2>

                        {/* Campo da taxa mensal de juros. */}
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

                {/* Mensagem de erro do formulario. */}
                {erro && <p className={css.erro}>{erro}</p>}

                {/* Botoes de restaurar padrao e salvar. */}
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

// Exporta a pagina para ser usada nas rotas da aplicacao.
export default DashboardAdmConfiguracoes;
