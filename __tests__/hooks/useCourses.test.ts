/**
 * Testes unitarios para src/hooks/useCourses.ts
 *
 * Hooks testados:
 *   - useFeaturedCourses
 *   - useCourses (com filtros)
 *   - useCourseDetail
 *
 * Estrategia:
 *   - Mock do Supabase via jest.mock
 *   - Wrap com QueryClientProvider para satisfazer o TanStack Query
 *   - renderHook + waitFor para aguardar resolucao assincrona
 */

import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ---------------------------------------------------------------------------
// Setup do mock do Supabase
// ---------------------------------------------------------------------------
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockIlike = jest.fn()
const mockOrder = jest.fn()
const mockLimit = jest.fn()
const mockRange = jest.fn()
const mockSingle = jest.fn()

// Encadeia os metodos (fluent interface do Supabase)
function buildQueryChain() {
  const chain: Record<string, jest.Mock> = {}
  chain.select = jest.fn(() => chain)
  chain.eq = jest.fn(() => chain)
  chain.ilike = jest.fn(() => chain)
  chain.order = jest.fn(() => chain)
  chain.limit = jest.fn(() => chain)
  chain.range = jest.fn(() => chain)
  chain.single = mockSingle
  return chain
}

const mockFromChain = buildQueryChain()
const mockFrom = jest.fn(() => mockFromChain)

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}))

import {
  useFeaturedCourses,
  useCourses,
  useCourseDetail,
} from '@/hooks/useCourses'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const MOCK_COURSES = [
  {
    id: 'curso-001',
    nome: 'React do Zero ao Avancado',
    imagem: 'https://cdn.superclasse.com.br/cursos/react.jpg',
    preco: 29700, // centavos
    average_rating: 4.8,
    professor: { nome_professor: 'Prof. Ana Silva' },
  },
  {
    id: 'curso-002',
    nome: 'Flutter Completo',
    imagem: 'https://cdn.superclasse.com.br/cursos/flutter.jpg',
    preco: 19700,
    average_rating: 4.6,
    professor: { nome_professor: 'Prof. Carlos Mota' },
  },
]

const MOCK_COURSE_DETAIL = {
  id: 'curso-001',
  nome: 'React do Zero ao Avancado',
  descricao: 'Aprenda React de forma pratica.',
  preco: 29700,
  is_publicado: true,
  is_encerrado: false,
  average_rating: 4.8,
  professor: {
    id: 'prof-001',
    nome_professor: 'Prof. Ana Silva',
    foto_perfil: null,
    average_rating: 4.9,
    descricao: 'Engenheira de software com 10 anos de experiencia.',
    user_id: 'user-prof-001',
  },
  categoria: { nome: 'Programacao' },
}

// ---------------------------------------------------------------------------
// Wrapper com QueryClientProvider
// ---------------------------------------------------------------------------
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,        // Desabilita retries para testes mais rapidos
        gcTime: 0,           // Limpa cache imediatamente apos cada teste
        staleTime: 0,
      },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)

  return { Wrapper, queryClient }
}

// ---------------------------------------------------------------------------
// Testes: useFeaturedCourses
// ---------------------------------------------------------------------------
describe('useFeaturedCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reconstroi o chain apos clearAllMocks
    mockFromChain.select = jest.fn(() => mockFromChain)
    mockFromChain.eq = jest.fn(() => mockFromChain)
    mockFromChain.order = jest.fn(() => mockFromChain)
    mockFromChain.limit = jest.fn(() => mockFromChain)
  })

  it('retorna a lista de cursos em destaque com sucesso', async () => {
    mockFromChain.limit = jest.fn().mockResolvedValue({
      data: MOCK_COURSES,
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFeaturedCourses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].nome).toBe('React do Zero ao Avancado')
    // Verifica o mapeamento do professor_nome
    expect(result.current.data![0].professor_nome).toBe('Prof. Ana Silva')
  })

  it('retorna array vazio quando nao ha cursos em destaque', async () => {
    mockFromChain.limit = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFeaturedCourses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([])
  })

  it('expoe o erro quando o Supabase retorna error', async () => {
    mockFromChain.limit = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Erro ao buscar cursos em destaque' },
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useFeaturedCourses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Testes: useCourses
// ---------------------------------------------------------------------------
describe('useCourses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFromChain.select = jest.fn(() => mockFromChain)
    mockFromChain.eq = jest.fn(() => mockFromChain)
    mockFromChain.ilike = jest.fn(() => mockFromChain)
    mockFromChain.order = jest.fn(() => mockFromChain)
    mockFromChain.range = jest.fn().mockResolvedValue({
      data: MOCK_COURSES,
      error: null,
      count: 2,
    })
  })

  it('retorna lista de cursos e metadados de paginacao', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.courses).toHaveLength(2)
    expect(result.current.data!.total).toBe(2)
    expect(result.current.data!.hasMore).toBe(false)
  })

  it('aplica filtro de busca quando search e fornecido', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useCourses({ search: 'React' }), { wrapper: Wrapper })

    await waitFor(() => {
      // Verifica que ilike foi chamado com o termo de busca
      expect(mockFromChain.ilike).toHaveBeenCalledWith('nome', '%React%')
    })
  })

  it('aplica filtro de categoria quando categoriaId e fornecido', async () => {
    const { Wrapper } = createWrapper()
    renderHook(() => useCourses({ categoriaId: 'cat-001' }), { wrapper: Wrapper })

    await waitFor(() => {
      expect(mockFromChain.eq).toHaveBeenCalledWith('categoria_id', 'cat-001')
    })
  })

  it('hasMore e true quando total supera a pagina atual', async () => {
    // Simula 50 cursos no total, mas retorna apenas 20 (page 1)
    mockFromChain.range = jest.fn().mockResolvedValue({
      data: MOCK_COURSES,
      error: null,
      count: 50,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourses({ page: 1 }), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.hasMore).toBe(true)
    expect(result.current.data!.total).toBe(50)
  })

  it('expoe erro quando a consulta falha', async () => {
    mockFromChain.range = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Connection timeout' },
      count: null,
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourses(), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ---------------------------------------------------------------------------
// Testes: useCourseDetail
// ---------------------------------------------------------------------------
describe('useCourseDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFromChain.select = jest.fn(() => mockFromChain)
    mockFromChain.eq = jest.fn(() => mockFromChain)
    mockSingle.mockResolvedValue({
      data: MOCK_COURSE_DETAIL,
      error: null,
    })
  })

  it('retorna o detalhe completo do curso', async () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourseDetail('curso-001'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.id).toBe('curso-001')
    expect(result.current.data!.nome).toBe('React do Zero ao Avancado')
    expect(result.current.data!.professor.nome_professor).toBe('Prof. Ana Silva')
    expect(result.current.data!.categoria.nome).toBe('Programacao')
  })

  it('nao executa a query quando courseId e vazio', () => {
    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourseDetail(''), { wrapper: Wrapper })

    // enabled: !!courseId — com string vazia, a query nao deve ser chamada
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.isLoading).toBe(false)
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('expoe erro quando o curso nao existe', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'No rows returned', code: 'PGRST116' },
    })

    const { Wrapper } = createWrapper()
    const { result } = renderHook(() => useCourseDetail('curso-inexistente'), { wrapper: Wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})
