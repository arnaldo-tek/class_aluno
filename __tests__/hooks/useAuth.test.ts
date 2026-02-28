/**
 * Testes unitarios para src/hooks/useAuth.ts
 *
 * O hook useAuth observa a sessao Supabase via getSession() e
 * onAuthStateChange(), expondo { user, session, isLoading }.
 *
 * Estrategia de mock:
 *   - Mocka o modulo @/lib/supabase completo
 *   - Controla o retorno de cada metodo por cenario de teste
 *   - Usa renderHook do @testing-library/react-hooks (incluido pelo jest-expo)
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import type { Session, User } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Setup do mock do Supabase ANTES de importar o hook
// ---------------------------------------------------------------------------
const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockSignInWithPassword = jest.fn()
const mockSignOut = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
  },
}))

// Importa DEPOIS do mock
import { useAuth } from '@/hooks/useAuth'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const MOCK_USER: Partial<User> = {
  id: 'user-uuid-001',
  email: 'aluno@superclasse.com.br',
  role: 'authenticated',
}

const MOCK_SESSION: Partial<Session> = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: MOCK_USER as User,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function setupAuthStateChange(session: Session | null = null) {
  // onAuthStateChange deve retornar { data: { subscription } }
  mockOnAuthStateChange.mockImplementation((callback: Function) => {
    // Chama o callback imediatamente para simular o evento SIGNED_IN/SIGNED_OUT
    callback('INITIAL_SESSION', session)
    return {
      data: {
        subscription: { unsubscribe: jest.fn() },
      },
    }
  })
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  it('inicia com isLoading=true e sem usuario', () => {
    // getSession retorna uma Promise que nao resolve imediatamente
    mockGetSession.mockReturnValue(new Promise(() => {}))
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  // -------------------------------------------------------------------------
  it('expoe o usuario quando a sessao e valida', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION as Session },
    })
    setupAuthStateChange(MOCK_SESSION as Session)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toEqual(MOCK_USER)
    expect(result.current.session).toEqual(MOCK_SESSION)
  })

  // -------------------------------------------------------------------------
  it('retorna user=null quando nao ha sessao ativa', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    })
    setupAuthStateChange(null)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
  })

  // -------------------------------------------------------------------------
  it('atualiza o estado quando onAuthStateChange dispara SIGNED_IN', async () => {
    // Sessao inicial vazia
    mockGetSession.mockResolvedValue({ data: { session: null } })

    let authCallback: Function | null = null
    mockOnAuthStateChange.mockImplementation((callback: Function) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Simula login bem-sucedido
    act(() => {
      authCallback!('SIGNED_IN', MOCK_SESSION as Session)
    })

    await waitFor(() => {
      expect(result.current.user).toEqual(MOCK_USER)
      expect(result.current.session).toEqual(MOCK_SESSION)
    })
  })

  // -------------------------------------------------------------------------
  it('limpa o estado quando onAuthStateChange dispara SIGNED_OUT', async () => {
    // Inicia com sessao ativa
    mockGetSession.mockResolvedValue({ data: { session: MOCK_SESSION as Session } })

    let authCallback: Function | null = null
    mockOnAuthStateChange.mockImplementation((callback: Function) => {
      callback('INITIAL_SESSION', MOCK_SESSION as Session)
      authCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.user).toEqual(MOCK_USER))

    // Simula logout
    act(() => {
      authCallback!('SIGNED_OUT', null)
    })

    await waitFor(() => {
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  it('cancela a subscription ao desmontar o hook', () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })

    const mockUnsubscribe = jest.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { unmount } = renderHook(() => useAuth())
    unmount()

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Testes das funcoes utilitarias de auth (src/lib/auth.ts)
// ---------------------------------------------------------------------------
describe('lib/auth — signIn e signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('signIn chama supabase.auth.signInWithPassword com as credenciais corretas', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: MOCK_USER, session: MOCK_SESSION },
      error: null,
    })

    const { signIn } = await import('@/lib/auth')
    const result = await signIn('aluno@superclasse.com.br', 'senha123')

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'aluno@superclasse.com.br',
      password: 'senha123',
    })
    expect(result.user).toEqual(MOCK_USER)
  })

  it('signIn lanca erro quando as credenciais sao invalidas', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const { signIn } = await import('@/lib/auth')

    await expect(
      signIn('errado@teste.com', 'senhaerrada'),
    ).rejects.toMatchObject({ message: 'Invalid login credentials' })
  })

  it('signOut chama supabase.auth.signOut e nao lanca erro', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { signOut } = await import('@/lib/auth')
    await expect(signOut()).resolves.toBeUndefined()

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('signOut lanca erro quando o Supabase retorna erro', async () => {
    mockSignOut.mockResolvedValue({
      error: { message: 'Network error' },
    })

    const { signOut } = await import('@/lib/auth')
    await expect(signOut()).rejects.toMatchObject({ message: 'Network error' })
  })
})
