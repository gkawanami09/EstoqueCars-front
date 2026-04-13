import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header/Header";
import Cadastro from "./pages/Cadastro";
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

function App({ API }) {
  return (
      <BrowserRouter>
        <Routes>

          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/MinhaConta" element={<MinhaConta />} />

          <Route element={<Container API={API} />}>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<Cadastro API={API} />} />
            <Route path="/login" element={<Login API={API} />} />
            <Route path="/CarrosSedan" element={<CarrosSedan />} />
            <Route path="/CarrosEletricos" element={<CarrosEletricos />} />
            <Route path="/CarrosEsportivos" element={<CarrosEsportivos />} />
            <Route path="/CarrosCaminhonetes" element={<CarrosCaminhonetes />} />
            <Route path="/CarrosSUV" element={<CarrosSUV />} />
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
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/minha-conta" element={<MinhaConta />} />
          </Route>

        </Routes>
      </BrowserRouter>
  );
}

export default App;