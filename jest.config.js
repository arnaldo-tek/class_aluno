/** @type {import('jest').Config} */
const config = {
  // Preset jest-expo lida com a transformacao de RN + Expo automaticamente
  preset: 'jest-expo',

  // Extensoes de arquivo reconhecidas (ordem importa: TS primeiro)
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Transformacoes — babel-jest e usado implicitamente pelo jest-expo,
  // mas declaramos explicitamente para garantir suporte a TS/TSX e .js de node_modules
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: ['babel-preset-expo'],
      },
    ],
  },

  // Alias @/ aponta para src/, espelhando o tsconfig.json do projeto
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mapeia assets estaticos para stubs
    '\\.(png|jpg|jpeg|gif|svg|ttf|otf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // Arquivo de setup que roda antes de cada arquivo de teste
  setupFiles: ['<rootDir>/jest.setup.ts'],

  // Modules do node_modules que NAO devem ser ignorados na transformacao
  // (pacotes ESM que precisam ser transpilados pelo babel-jest)
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|' +
      'react-native|' +
      'react-native-url-polyfill|' +
      'expo|' +
      'expo-modules-core|' +
      'expo-secure-store|' +
      'expo-constants|' +
      '@expo|' +
      '@supabase|' +
      '@tanstack|' +
      'nativewind|' +
      'react-native-reanimated|' +
      'react-native-gesture-handler' +
    ')/)',
  ],

  // Cobertura de codigo
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/types/**',
    '!src/i18n/**',
  ],

  // Limiar de cobertura minima
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },

  testEnvironment: 'node',

  // Padrao de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],

  // Ignora dist e node_modules
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.expo/',
  ],

  // Exibe logs detalhados de erros
  verbose: true,

  // Timeout padrao por teste (ms)
  testTimeout: 10_000,
}

module.exports = config
