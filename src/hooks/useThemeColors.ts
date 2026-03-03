import { useTheme } from '@/contexts/ThemeContext'

const lightColors = {
  // Text
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',

  // Surfaces
  bg: '#f7f6f3',
  surface: '#ffffff',
  surfaceLight: '#f0efec',
  elevated: '#e8e7e4',

  // Borders
  border: '#e5e4e1',
  borderLight: '#d4d3d0',
  borderSubtle: '#eeedeb',

  // Tab bar
  tabBarBg: '#ffffff',
  tabBarShadow: '#000',
} as const

const darkColors = {
  // Text
  text: '#f0f0f5',
  textSecondary: '#a0a0b8',
  textMuted: '#6b6b85',
  textInverse: '#1a1a2e',

  // Surfaces
  bg: '#0f0f23',
  surface: '#1a1a2e',
  surfaceLight: '#252540',
  elevated: '#2d2d4a',

  // Borders
  border: '#3d3d5c',
  borderLight: '#3d3d5c',
  borderSubtle: '#2a2a45',

  // Tab bar
  tabBarBg: '#1a1a2e',
  tabBarShadow: '#000',
} as const

export function useThemeColors() {
  const { isDark } = useTheme()
  return isDark ? darkColors : lightColors
}
