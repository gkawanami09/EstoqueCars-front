import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarConfigEmpresa } from './utils/configEmpresa.js'

aplicarConfigEmpresa()

createRoot(document.getElementById('root')).render(
  <StrictMode>


    <App API="http://10.92.3.146:5000"/>



  </StrictMode>,
)
