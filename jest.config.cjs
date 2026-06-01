module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|webp|svg|gltf|glb|wav|mp3|ogg)$': '<rootDir>/src/test/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.js'],
  collectCoverageFrom: [
    'src/components/Banner/banner3d/config.js',
    'src/components/Banner/banner3d/math.js',
    'src/components/Banner/banner3d/PerformanceGovernor.js',
    'src/components/Banner/banner3d/physics/driftPhysics.js',
    'src/components/Banner/Banner.jsx',
    'src/game/Utils.js',
    'src/game/config/gameConfig.js',
    'src/game/InputManager.js',
    'src/game/CarController.js',
    'src/game/CollisionManager.js',
    'src/game/ScoreManager.js',
    'src/game/UIManager.js',
    'src/game/WorldManager.js',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
}
