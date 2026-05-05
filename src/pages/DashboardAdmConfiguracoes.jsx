// Importa o CSS modular da tela de configurações.
import css from "./DashboardAdmConfiguracoes.module.css";

// Importa o componente de input reutilizável do projeto.
import Input from "../components/Input/Input.jsx";

// Importa hooks do React para estado e efeitos colaterais.
import { useEffect, useState } from "react";

// Importa hook personalizado para scroll automático até mensagens.
import useScrollMensagem from "../hooks/useScrollMensagem";

// Função que monta o header de autorização com token JWT.
function cabecalhoAutorizacao() {
    // Pega o token salvo no localStorage.
    const token = localStorage.getItem("access_token");

    // Se existir token, retorna no formato Bearer, senão retorna undefined.
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// Função que monta headers para requisições JSON autenticadas.
function headersJsonAutenticado() {
    return {
        // Define o tipo de conteúdo como JSON.
        "Content-Type": "application/json",

        // Espalha o header de autorização (se existir).
        ...(cabecalhoAutorizacao() || {})
    };
}

// Componente principal da tela de configurações.
function DashboardAdmConfiguracoes({ API }) {

    // Estado que guarda o arquivo da logo.
    const [logo, setLogo] = useState(null);

    // Estado que guarda a URL de preview da logo.
    const [previewLogo, setPreviewLogo] = useState("");

    // Estado da cor primária do sistema.
    const [corPrimaria, setCorPrimaria] = useState("#000000");

    // Estado da cor secundária do sistema.
    const [corSecundaria, setCorSecundaria] = useState("#ffffff");

    // Estado da fonte escolhida.
    const [fonte, setFonte] = useState("Arial");

    // Estado do nome da empresa.
    const [nomeEmpresa, setNomeEmpresa] = useState("");

    // Estado do CNPJ da empresa.
    const [cnpj, setCnpj] = useState("");

    // Estado do email de contato.
    const [email, setEmail] = useState("");

    // Estado do telefone de contato.
    const [telefone, setTelefone] = useState("");

    // Estado da mensagem de sucesso/erro.
    const [mensagem, setMensagem] = useState(null);

    // Estado de erro simples.
    const [erro, setErro] = useState("");

    // Referência para rolar até a mensagem automaticamente.
    const mensagemRef = useScrollMensagem(mensagem);

    // Referência para rolar até o erro automaticamente.
    const erroRef = useScrollMensagem(erro);

    // useEffect executa ao carregar a tela.
    useEffect(() => {

        // Função que busca as configurações da API.
        async function carregar() {

            // Faz requisição GET para buscar configurações.
            const res = await fetch(`${API}/configuracoes`, {
                headers: cabecalhoAutorizacao(),
                credentials: "include"
            });

            // Converte resposta para JSON.
            const dados = await res.json();

            // Preenche os estados com os dados da API.
            setPreviewLogo(dados.logo);
            setCorPrimaria(dados.corPrimaria);
            setCorSecundaria(dados.corSecundaria);
            setFonte(dados.fonte);
            setNomeEmpresa(dados.nomeEmpresa);
            setCnpj(dados.cnpj);
            setEmail(dados.email);
            setTelefone(dados.telefone);
        }

        // Executa a função.
        carregar();

    }, [API]); // Executa sempre que a API mudar.

    // Função chamada ao alterar a logo.
    function alterarLogo(e) {

        // Pega o arquivo selecionado.
        const file = e.target.files[0];

        // Salva o arquivo no estado.
        setLogo(file);

        // Se existir arquivo, cria preview local.
        if (file) {
            setPreviewLogo(URL.createObjectURL(file));
        }
    }

    // Função que salva as configurações.
    async function salvar(e) {

        // Impede o reload da página.
        e.preventDefault();

        // Limpa erro anterior.
        setErro("");

        // Limpa mensagem anterior.
        setMensagem(null);

        // Cria objeto FormData para enviar arquivos + dados.
        const formData = new FormData();

        // Adiciona todos os campos no FormData.
        formData.append("logo", logo);
        formData.append("corPrimaria", corPrimaria);
        formData.append("corSecundaria", corSecundaria);
        formData.append("fonte", fonte);
        formData.append("nomeEmpresa", nomeEmpresa);
        formData.append("cnpj", cnpj);
        formData.append("email", email);
        formData.append("telefone", telefone);

        // Envia requisição PUT para salvar configurações.
        const res = await fetch(`${API}/configuracoes`, {
            method: "PUT",
            headers: cabecalhoAutorizacao(), // NÃO usa JSON aqui
            credentials: "include",
            body: formData
        });

        // Converte resposta para JSON.
        const resposta = await res.json();

        // Se der erro, mostra mensagem e interrompe.
        if (!res.ok) {
            setErro(resposta.erro || "Erro ao salvar");
            return;
        }

        // Se sucesso, mostra mensagem positiva.
        setMensagem({
            tipo: "sucesso",
            texto: "Configurações salvas com sucesso!"
        });
    }

    // Renderização da tela.
    return (

        // Container principal.
        <main className={css.container}>

            {/* Título da página */}
            <h1 className={css.titulo}>Configurações da Plataforma</h1>

            {/* Exibe mensagem se existir */}
            {mensagem && (
                <div ref={mensagemRef} className={css.mensagem}>
                    {mensagem.texto}
                </div>
            )}

            {/* Formulário principal */}
            <form className={css.formulario} onSubmit={salvar}>

                {/* Grid principal */}
                <div className={css.grid}>

                    {/* LADO ESQUERDO */}
                    <div className={css.esquerda}>

                        <h2>Logo</h2>

                        {/* Preview da logo */}
                        {previewLogo && (
                            <img src={previewLogo} className={css.logoPreview} />
                        )}

                        {/* Input de upload */}
                        <input type="file" onChange={alterarLogo} />

                        <h2>Cores</h2>

                        {/* Inputs de cores */}
                        <div className={css.duplo}>
                            <Input
                                label="Cor Primária"
                                type="color"
                                value={corPrimaria}
                                onChange={(e) => setCorPrimaria(e.target.value)}
                            />
                            <Input
                                label="Cor Secundária"
                                type="color"
                                value={corSecundaria}
                                onChange={(e) => setCorSecundaria(e.target.value)}
                            />
                        </div>

                        <h2>Fonte</h2>

                        {/* Select de fonte */}
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

                    {/* LADO DIREITO */}
                    <div className={css.direita}>

                        <h2>Dados da Empresa</h2>

                        {/* Nome da empresa */}
                        <Input
                            label="Nome"
                            value={nomeEmpresa}
                            onChange={(e) => setNomeEmpresa(e.target.value)}
                        />

                        {/* CNPJ */}
                        <Input
                            label="CNPJ"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                        />

                        <h2>Contato</h2>

                        {/* Email */}
                        <Input
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        {/* Telefone */}
                        <Input
                            label="Telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                        />

                    </div>

                </div>

                {/* Exibe erro */}
                {erro && <p ref={erroRef} className={css.erro}>{erro}</p>}

                {/* Botões */}
                <div className={css.botoes}>
                    <button className={css.salvar}>Salvar</button>
                </div>

            </form>
        </main>
    );
}

// Exporta o componente para uso nas rotas.
export default DashboardAdmConfiguracoes;