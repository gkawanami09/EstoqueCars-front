import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Header from './components/Header/Header'
import Cadastro from "./pages/Cadastro"
import Login from "./pages/Login"
import ConfirmarEmail from "./pages/ConfirmarEmail"
import Footer from './components/Footer/Footer'

function App({ API }) {
  return (
      <BrowserRouter>
        <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<Cadastro API={API}/>} />
            <Route path="/login" element={<Login API={API}/>} />
            <Route path="/confirmar-email" element={<ConfirmarEmail API={API} />} />

            {/* <Route path="*" element={<Erro404 />} /> */}
          </Routes>
        <Footer />
      </BrowserRouter>
  )
}

export default App
