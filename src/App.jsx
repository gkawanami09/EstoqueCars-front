import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header/Header";
import Cadastro from "./pages/Cadastro.jsx";
import Login from "./pages/Login";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import CodigoRecupera from "./pages/CodigoRecupera";
import Favoritos from "./pages/Favoritos";
import Erro404 from "./pages/Erro404";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Container from "./components/Container/Container";
import CarrosSedan from "./pages/CarrosSedan.jsx";
import CarrosEletricos from "./pages/CarrosEletricos.jsx";
import CarrosEsportivos from "./pages/CarrosEsportivos.jsx";
import CarrosCaminhonetes from "./pages/CarrosCaminhonetes.jsx";
import CarrosSUV from "./pages/CarrosSUV.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MinhaConta from "./pages/MinhaConta.jsx";
import DashboardAdm from "./pages/DashboardAdm.jsx";
import DashboardAdmVeiculos from "./pages/DashboardAdmVeiculos.jsx";
import DashboardAdmClientes from "./pages/DashboardAdmClientes.jsx";
import CadastroVeiculos from "./pages/CadastroVeiculos.jsx";
import CadastroServicos from "./pages/CadastroServicos.jsx";
import CadastroManutencao from "./pages/CadastroManutencao.jsx";

import Vendas from "./pages/Vendas.jsx";


import EdicaoServicos from "./pages/EdicaoServicos.jsx";
import DetalhesVeiculos from "./pages/DetalhesVeiculos.jsx";
import DashboardAdmMarcas from "./pages/DashboardAdmMarcas.jsx";
import CadastroCliente from "./pages/CadastroCliente.jsx";
import DashboardAdmConfiguracoes from "./pages/DashboardAdmConfiguracoes.jsx";
import DashboardADMFinanceiros from "./pages/DashboardADMFinanceiros.jsx";

import DasbhoardAdmVendas from "./pages/DasbhoardAdmVendas.jsx";

function App({ API }) {
  useEffect(() => {
    // Monta a URL da logo vinda do backend.
    function montarLogoUrl(logoUrl) {
      if (!logoUrl) return "";

      // Se o backend mandar "/uploads/logo.png", junta com a URL da API.
      if (logoUrl.startsWith("/")) return `${API}${logoUrl}`;

      // Se ainda estiver com o exemplo "seu-servidor.com", troca pela API real.
      if (logoUrl.includes("seu-servidor.com/uploads/")) {
        return `${API}/uploads/${logoUrl.split("/uploads/")[1]}`;
      }

      // Se ja vier uma URL completa correta, usa como veio.
      return logoUrl;
    }

    // Aplica cores, fonte e logo recebidas das configuracoes.
    function aplicarConfiguracoes(dados) {
      document.documentElement.style.setProperty("--cor-principal", dados.cor_primaria || "#EF4444");
      document.documentElement.style.setProperty("--cor-secundaria", dados.cor_secundaria || "#171414");
      document.documentElement.style.setProperty("--preto-nav", dados.cor_secundaria || "#171414");
      document.documentElement.style.setProperty("--fonte-site", dados.fonte_visual || "Montserrat");

      const logoUrl = montarLogoUrl(dados.logo_url);

      if (logoUrl) {
        localStorage.setItem("logo_site_url", logoUrl);
        window.dispatchEvent(new Event("logo-atualizada"));
      }
    }

    // Busca as configuracoes salvas no backend quando o app abre.
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

  return (
      <BrowserRouter>
        <Routes>

          <Route element={<Container API={API} />}>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<Cadastro API={API} />} />
            <Route path="/login" element={<Login API={API} />} />
            <Route path="/CarrosSedan" element={<CarrosSedan API={API} />} />
            <Route path="/CarrosEletricos" element={<CarrosEletricos API={API} />} />
            <Route path="/CarrosEsportivos" element={<CarrosEsportivos API={API} />} />
            <Route path="/CarrosCaminhonetes" element={<CarrosCaminhonetes API={API} />} />
            <Route path="/CarrosSUV" element={<CarrosSUV API={API} />} />
            <Route
                path="/confirmar-email"
                element={<ConfirmarEmail API={API} />}
            />
            <Route
                path="/CodigoRecupera"
                element={<CodigoRecupera API={API} />}
            />
            <Route path="*" element={<Erro404 />} />
          </Route>

          {/* grupo de rotas protegidas */}
          <Route element={<ProtectedRoute API={API} />}>
            <Route path="/dashboard" element={<Dashboard API={API} />} />
            <Route path="/Dashboard" element={<Dashboard API={API} />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/minhaConta" element={<MinhaConta API={API} />} />
            <Route path="/dashboardAdm" element={<DashboardAdm  API={API} />} />
            <Route path="/dashboardAdmVeiculos" element={<DashboardAdmVeiculos API={API} />} />
            <Route path="/dashboardAdmClientes" element={<DashboardAdmClientes API={API} />} />
            <Route path="/cadastroVeiculos" element={<CadastroVeiculos API={API}/>} />
            <Route path="/editarVeiculos/:id" element={<CadastroVeiculos API={API}/>} />
            <Route path="/detalhesVeiculos/:id" element={<DetalhesVeiculos API={API} />} />
            <Route path="/dashboardAdmMarcas" element={<DashboardAdmMarcas API={API} />} />
            <Route path="/dashboardAdmVendas" element={<DasbhoardAdmVendas />} />
            <Route path="/dashboardADMFinanceiros" element={<DashboardADMFinanceiros API={API} />} />
            <Route path="/venda" element={<Vendas API={API} />}/>
            
            
            <Route path="/CadastroServicos" element={<CadastroServicos API={API} />} />

            <Route path="/manutencoes" element={<CadastroManutencao API={API} />} />

            <Route path="/EdicaoServicos" element={<EdicaoServicos API={API} />} />
            <Route path="/CadastroCliente" element={<CadastroCliente API={API} />} />
            <Route path="/DashboardAdmConfiguracoes" element={<DashboardAdmConfiguracoes API={API} />} />
          </Route>

        </Routes>
      </BrowserRouter>
  );
}

export default App;
