# Drift Open World 3D - Three.js

Jogo 3D de corrida em mundo aberto com drift, desenvolvido em JavaScript ES Modules e Three.js.

## Visão Geral

O jogo roda em `/drift-game` e inclui:

- carro esportivo controlado por `W`, `A`, `S`, `D`
- drift ao segurar `Espaço`
- obstáculos procedurais com colisão sólida
- HUD em HTML/CSS puro (sem canvas extra)
- pontuação por duração e qualidade do drift
- melhor pontuação persistida em `localStorage`
- feedback visual e sonoro para drift e colisão

## Stack

- JavaScript ES2022
- Three.js `0.152.2`
- Vite
- Jest + jsdom
- ESLint + Prettier
- Docker + Nginx

## Controles

- `W`: acelerar
- `S`: ré/freio
- `A`: virar à esquerda
- `D`: virar à direita
- `Espaço`: drift

## Regras de Drift

- drift só pontua com:
  - `Espaço` pressionado
  - ângulo de deslizamento acima de `30°` (configurável)
  - velocidade mínima de drift configurada
- colisão:
  - cancela drift atual
  - aplica penalidade de pontos
  - aciona feedback visual e som

## Arquitetura de Módulos

`src/game/`

- `main.js`: bootstrap, loop principal, câmera, integração dos módulos
- `CarController.js`: física básica, movimento, steering, drift
- `WorldManager.js`: criação do mundo e obstáculos procedurais
- `CollisionManager.js`: detecção e resposta de colisões
- `ScoreManager.js`: tempo de drift, score e best score
- `InputManager.js`: captura/normalização de teclado
- `UIManager.js`: telas e HUD
- `AudioManager.js`: efeitos sonoros
- `Utils.js`: utilidades matemáticas e helpers
- `config/gameConfig.js`: configuração e parsing de env

## Estrutura de Pastas

```text
src/
  game/
    config/
    styles/
    tests/
  pages/
    DriftGame.jsx
public/
  assets/
    drift-game/
      models/
      sounds/
      textures/
scripts/
  generate-drift-game-assets.mjs
```

## Instalação

```bash
npm install
cp .env.example .env
```

## Execução local

```bash
npm run dev
```

Acesse:

- App: `http://localhost:5173`
- Jogo: `http://localhost:5173/drift-game`

## Build

```bash
npm run build
npm run preview
```

## Testes

```bash
npm run test
npm run test:coverage
```

Cobertura alvo: mínimo de 90% para módulos críticos.

## Lint e Formatação

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:write
```

## Geração de Assets

```bash
npm run generate:assets
```

Esse comando gera:

- modelo 3D básico (`sports-car.gltf`)
- textura de asfalto (`asphalt.svg`)
- sons (`engine-loop.wav`, `drift-loop.wav`, `collision.wav`)

## Variáveis de Ambiente

Veja `.env.example`. Principais:

- `VITE_DRIFT_WORLD_SIZE`
- `VITE_DRIFT_OBSTACLE_COUNT`
- `VITE_DRIFT_MIN_ANGLE_DEG`
- `VITE_DRIFT_MIN_SPEED`
- `VITE_DRIFT_MAX_SPEED`
- `VITE_DRIFT_ACCELERATION`
- `VITE_DRIFT_TRACTION_GRIP`
- `VITE_DRIFT_DRIFT_GRIP`
- `VITE_DRIFT_DEBUG`

## Deploy com Docker

```bash
docker build -t drift-game-web .
docker run --rm -p 8080:80 drift-game-web
```

Abrir `http://localhost:8080/drift-game`.

## CI/CD

Workflow em `.github/workflows/ci.yml`:

1. instala dependências
2. roda lint
3. roda testes com cobertura
4. gera build
5. valida build Docker

## Decisões Técnicas

- Física simplificada de drift para manter jogabilidade e performance web.
- HUD fora do canvas para facilitar manutenção e acessibilidade.
- Obstáculos procedurais com validação de sobreposição para distribuição estável.
- Persistência local de melhor score sem backend.
