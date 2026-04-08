import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./components/Header/Header";
import Cadastro from "./pages/Cadastro";
import Login from "./pages/Login";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import CodigoRecupera from "./pages/CodigoRecupera";
import Dashboard from "./pages/Dashboard";
import Favoritos from "./pages/Favoritos";
import MinhaConta from "./pages/MinhaConta";
import Erro404 from "./pages/Erro404";
import Footer from "./components/Footer/Footer";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import Container from "./components/Container/Container";

function App({ API }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Container API={API} />}>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro" element={<Cadastro API={API} />} />
          <Route path="/login" element={<Login API={API} />} />
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
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/minha-conta" element={<MinhaConta />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
