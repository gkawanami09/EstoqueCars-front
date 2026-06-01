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

  test('renderiza conteudo principal e jogo no lugar da cena 3D antiga', () => {
    renderBanner()

    expect(screen.getByText(/Maior Garagem/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver carros/i })).toBeInTheDocument()
    expect(screen.getByTestId('drift-game-banner')).toBeInTheDocument()
    expect(mockDriftGameBanner).toHaveBeenCalled()
  })

  test('reinicia o jogo ao clicar no botao de reinicio', () => {
    renderBanner()
    const callsBefore = mockDriftGameBanner.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: /Reiniciar jogo de drift/i }))
    const callsAfter = mockDriftGameBanner.mock.calls.length

    expect(callsAfter).toBeGreaterThan(callsBefore)
  })

  test('exibe fallback quando o jogo retorna erro', () => {
    renderBanner()
    fireEvent.click(screen.getByTestId('drift-game-banner'))
    expect(screen.getByText(/Drift Game indisponivel/i)).toBeInTheDocument()
  })
})
