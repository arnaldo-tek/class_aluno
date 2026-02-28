/**
 * __mocks__/supabase.ts
 *
 * Mock manual do cliente Supabase utilizado nos testes unitarios.
 * Ao chamar jest.mock('@/lib/supabase'), Jest substitui automaticamente
 * pelo mock mais proximo — mas prefira o mock inline nos testes para
 * maior controle por cenario.
 *
 * Este arquivo serve como referencia de estrutura do mock.
 */

export const mockSupabaseAuth = {
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: {
      subscription: { unsubscribe: jest.fn() },
    },
  })),
  signInWithPassword: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
}

export const mockSupabaseFrom = jest.fn(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
}))

export const supabase = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
}
