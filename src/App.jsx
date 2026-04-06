import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Header from './components/Header/Header'
import Cadastro from "./pages/Cadastro"
import Login from "./pages/Login"
import ConfirmarEmail from "./pages/ConfirmarEmail"
import CodigoRecupera from "./pages/CodigoRecupera"
import Dashboard from "./pages/Dashboard"
import Erro404 from "./pages/Erro404"
import Footer from './components/Footer/Footer'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'

function App({ API }) {
  return (
      <BrowserRouter>
        <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<Cadastro API={API}/>} />
            <Route path="/login" element={<Login API={API}/>} />
            <Route path="/confirmar-email" element={<ConfirmarEmail API={API} />} />
            <Route path="/CodigoRecupera" element={<CodigoRecupera API={API} />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard API={API} />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Erro404 />} />
          </Routes>
        <Footer />
      </BrowserRouter>
  )
}

export default App
