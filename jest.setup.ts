/**
 * jest.setup.ts
 * Executado antes de cada arquivo de teste.
 * Configura mocks globais necessarios para o ambiente React Native / Expo.
 */

// ---------------------------------------------------------------------------
// Mock: expo-constants
// Fornece o valor de expoConfig.extra que o src/lib/supabase.ts consome.
// ---------------------------------------------------------------------------
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'http://127.0.0.1:54321',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
}))

// ---------------------------------------------------------------------------
// Mock: expo-secure-store
// Evita chamadas nativas em ambiente de teste.
// ---------------------------------------------------------------------------
const secureStoreData: Record<string, string> = {}

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    secureStoreData[key] = value
    return Promise.resolve()
  }),
  deleteItemAsync: jest.fn((key: string) => {
    delete secureStoreData[key]
    return Promise.resolve()
  }),
}))

// ---------------------------------------------------------------------------
// Mock: react-native-url-polyfill
// Importado no topo de src/lib/supabase.ts — apenas registra sem fazer nada.
// ---------------------------------------------------------------------------
jest.mock('react-native-url-polyfill/dist/setup', () => ({}))

// ---------------------------------------------------------------------------
// Mock: @react-native-async-storage/async-storage
// ---------------------------------------------------------------------------
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

// ---------------------------------------------------------------------------
// Suprime warnings de console desnecessarios nos testes
// ---------------------------------------------------------------------------
const SUPPRESSED_WARNINGS = [
  'Warning: ReactDOM.render is no longer supported',
  'Warning: An update to',
]

const originalWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && SUPPRESSED_WARNINGS.some((w) => args[0].includes(w))) {
    return
  }
  originalWarn(...args)
}

// ---------------------------------------------------------------------------
// Limpa todos os mocks apos cada teste
// ---------------------------------------------------------------------------
afterEach(() => {
  jest.clearAllMocks()
})
