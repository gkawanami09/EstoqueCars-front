import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Cadastro from "./pages/Cadastro.jsx";
import Login from "./pages/Login";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import CodigoRecupera from "./pages/CodigoRecupera";
import Erro404 from "./pages/Erro404";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Container from "./components/Container/Container";
import CarrosSedan from "./pages/CarrosSedan.jsx";
import CarrosEletricos from "./pages/CarrosEletricos.jsx";
import CarrosEsportivos from "./pages/CarrosEsportivos.jsx";
import CarrosCaminhonetes from "./pages/CarrosCaminhonetes.jsx";
import CarrosSUV from "./pages/CarrosSUV.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MinhaConta from "./pages/MinhaConta.jsx";
import MinhasCompras from "./pages/MinhasCompras.jsx";
import Favoritos from "./pages/Favoritos.jsx";
import DashboardAdm from "./pages/DashboardAdm.jsx";
import DashboardAdmVeiculos from "./pages/DashboardAdmVeiculos.jsx";
import DashboardAdmClientes from "./pages/DashboardAdmClientes.jsx";
import CadastroVeiculos from "./pages/CadastroVeiculos.jsx";
import CadastroServicos from "./pages/CadastroServicos.jsx";
import CadastroManutencao from "./pages/CadastroManutencao.jsx";
import DashboardAdmEstoque from "./pages/DasbhoardAdmEstoque.jsx";

import Vendas from "./pages/Vendas.jsx";


import EdicaoServicos from "./pages/EdicaoServicos.jsx";
import DetalhesVeiculos from "./pages/DetalhesVeiculos.jsx";
import DashboardAdmMarcas from "./pages/DashboardAdmMarcas.jsx";
import CadastroCliente from "./pages/CadastroCliente.jsx";
import DashboardAdmConfiguracoes from "./pages/DashboardAdmConfiguracoes.jsx";
import DashboardADMFinanceiros from "./pages/DashboardADMFinanceiros.jsx";
import DriftGame from "./pages/DriftGame.jsx";

import DasbhoardAdmVendas from "./pages/DasbhoardAdmVendas.jsx";
import ConfiguracoesSite from "./components/ConfiguracoesSite/ConfiguracoesSite.jsx";

function App({ API }) {
  return (
      <BrowserRouter>
        <ConfiguracoesSite API={API} />
        <Routes>
          <Route path="/detalhesVeiculos/:id" element={<DetalhesVeiculos API={API} />} />
          <Route path="/drift-game" element={<DriftGame />} />

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
            <Route path="/minhaConta" element={<MinhaConta API={API} />} />
            <Route path="/favoritos" element={<Favoritos API={API} />} />
            <Route path="/minhasCompras" element={<MinhasCompras API={API} />} />
            <Route path="/minhas-compras" element={<MinhasCompras API={API} />} />
            <Route path="/dashboardAdm" element={<DashboardAdm  API={API} />} />
            <Route path="/dashboardAdmVeiculos" element={<DashboardAdmVeiculos API={API} />} />
            <Route path="/dashboardAdmClientes" element={<DashboardAdmClientes API={API} />} />
            <Route path="/cadastroVeiculos" element={<CadastroVeiculos API={API}/>} />
            <Route path="/editarVeiculos/:id" element={<CadastroVeiculos API={API}/>} />
            <Route path="/dashboardAdmMarcas" element={<DashboardAdmMarcas API={API} />} />
            <Route path="/dashboardAdmEstoque" element={<DashboardAdmEstoque API={API} />} />
            <Route path="/dashboardAdmVendas" element={<DasbhoardAdmVendas API={API} />} />
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
