import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Banner from './Banner'

const mockDriftGameBanner = jest.fn()

jest.mock('./DriftGameBanner', () => ({
  __esModule: true,
  default: (props) => {
    mockDriftGameBanner(props)
    return (
      <button
        type="button"
        data-testid="drift-game-banner"
        onClick={() => props.onError(new Error('erro-forcado-jogo-banner'))}
      >
        mock-game-banner
      </button>
    )
  },
}))

function renderBanner() {
  return render(
    <MemoryRouter>
      <Banner
        span1="Maior Garagem"
        titulo="de Carros Usados do"
        span2="Senai"
        subtitulo="Subtitulo teste"
        buttonTo="/CarrosSedan"
        buttonNome="ver carros"
      />
    </MemoryRouter>,
  )
}

describe('Banner', () => {
  let consoleErrorSpy

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockDriftGameBanner.mockClear()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  test('renderiza conteudo principal e mostra a foto antes de iniciar o jogo', () => {
    renderBanner()

    expect(screen.getByText(/Maior Garagem/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver carros/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /^Banner$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /jogo/i })).not.toBeInTheDocument()
    expect(mockDriftGameBanner).not.toHaveBeenCalled()
  })

  test('carrega o jogo ao clicar na foto do banner', () => {
    renderBanner()

    fireEvent.click(screen.getByRole('button', { name: /Ativar banner interativo/i }))

    expect(screen.getByTestId('drift-game-banner')).toBeInTheDocument()
    expect(mockDriftGameBanner).toHaveBeenCalled()
  })

  test('volta para a foto quando o jogo retorna erro', () => {
    renderBanner()
    fireEvent.click(screen.getByRole('button', { name: /Ativar banner interativo/i }))
    fireEvent.click(screen.getByTestId('drift-game-banner'))

    expect(screen.getByRole('img', { name: /^Banner$/i })).toBeInTheDocument()
    expect(screen.queryByText(/Drift Game indisponivel/i)).not.toBeInTheDocument()
  })
})
