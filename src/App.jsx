import './App.css'
import { BrowserRouter } from 'react-router-dom'
import Header from './components/Header/Header'
import Banner from './components/Banner/Banner'

function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Banner />
      </BrowserRouter>
    </>
  )
}

export default App
