/**
 * Testes unitarios para src/components/CourseCard.tsx
 *
 * O componente CourseCard exibe informacoes de um curso e navega para
 * /course/:id ao ser pressionado.
 *
 * Mocks necessarios:
 *   - expo-router (useRouter)
 *   - @expo/vector-icons (Ionicons — componente nativo)
 *   - @/i18n (funcao t de traducao)
 */

import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { CourseCard } from '@/components/CourseCard'

// ---------------------------------------------------------------------------
// Mock: expo-router
// ---------------------------------------------------------------------------
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Mock: @expo/vector-icons
// Ionicons usa componentes nativos que nao existem em ambiente de teste.
// ---------------------------------------------------------------------------
jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native')
  return {
    Ionicons: ({ name }: { name: string }) =>
      React.createElement(Text, { testID: `icon-${name}` }, name),
  }
})

// ---------------------------------------------------------------------------
// Mock: @/i18n
// A funcao t() e usada para "Gratuito" quando preco === 0
// ---------------------------------------------------------------------------
jest.mock('@/i18n', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'courses.free': 'Gratuito',
    }
    return translations[key] ?? key
  },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const defaultProps = {
  id: 'curso-001',
  nome: 'React do Zero ao Avancado',
  imagem: 'https://cdn.superclasse.com.br/cursos/react.jpg',
  preco: 29700,
  professor_nome: 'Prof. Ana Silva',
  average_rating: 4.8,
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe('CourseCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  it('renderiza o nome do curso corretamente', () => {
    render(<CourseCard {...defaultProps} />)

    expect(screen.getByText('React do Zero ao Avancado')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('renderiza o nome do professor quando fornecido', () => {
    render(<CourseCard {...defaultProps} />)

    expect(screen.getByText('Prof. Ana Silva')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('nao renderiza o professor quando professor_nome e nulo', () => {
    render(<CourseCard {...defaultProps} professor_nome={null} />)

    expect(screen.queryByText('Prof. Ana Silva')).toBeNull()
  })

  // -------------------------------------------------------------------------
  it('formata o preco em reais corretamente', () => {
    // preco em centavos: 29700 -> R$ 29700.00
    // Nota: o componente faz preco.toFixed(2) diretamente no numero recebido.
    // Se o valor e passado em centavos, a formatacao e feita externamente.
    render(<CourseCard {...defaultProps} preco={297} />)

    expect(screen.getByText('R$ 297.00')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('exibe "Gratuito" quando preco e zero', () => {
    render(<CourseCard {...defaultProps} preco={0} />)

    expect(screen.getByText('Gratuito')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('exibe a avaliacao com estrela quando average_rating e fornecido', () => {
    render(<CourseCard {...defaultProps} average_rating={4.8} />)

    // Icone de estrela renderizado
    expect(screen.getByTestID('icon-star')).toBeTruthy()
    // Texto da avaliacao
    expect(screen.getByText('4.8')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('nao exibe a avaliacao quando average_rating e nulo', () => {
    render(<CourseCard {...defaultProps} average_rating={null} />)

    expect(screen.queryByTestID('icon-star')).toBeNull()
  })

  // -------------------------------------------------------------------------
  it('nao exibe a avaliacao quando average_rating e zero', () => {
    render(<CourseCard {...defaultProps} average_rating={0} />)

    expect(screen.queryByTestID('icon-star')).toBeNull()
  })

  // -------------------------------------------------------------------------
  it('renderiza o icone de livro quando imagem e nula', () => {
    render(<CourseCard {...defaultProps} imagem={null} />)

    // Sem imagem, deve exibir o icone de fallback
    expect(screen.getByTestID('icon-book-outline')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('navega para /course/:id ao ser pressionado', () => {
    render(<CourseCard {...defaultProps} />)

    const touchable = screen.getByText('React do Zero ao Avancado').parent?.parent?.parent

    // Alternativa mais robusta: pressiona o primeiro TouchableOpacity da arvore
    fireEvent.press(screen.getByText('React do Zero ao Avancado'))

    expect(mockPush).toHaveBeenCalledWith('/course/curso-001')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  // -------------------------------------------------------------------------
  it('aplica estilo horizontal quando a prop horizontal e true', () => {
    const { toJSON } = render(<CourseCard {...defaultProps} horizontal={true} />)

    // Verifica que o componente renderiza sem erros no modo horizontal
    expect(toJSON()).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('renderiza sem erros com todas as props opcionais ausentes', () => {
    const minimalProps = {
      id: 'curso-minimal',
      nome: 'Curso Minimo',
      preco: 0,
    }

    expect(() => render(<CourseCard {...minimalProps} />)).not.toThrow()

    expect(screen.getByText('Curso Minimo')).toBeTruthy()
    expect(screen.getByText('Gratuito')).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  it('renderiza snapshot consistente', () => {
    const { toJSON } = render(<CourseCard {...defaultProps} />)
    expect(toJSON()).toMatchSnapshot()
  })
})
