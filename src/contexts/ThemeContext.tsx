import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { useColorScheme as useNativeWindColorScheme, vars } from 'nativewind'
import * as SecureStore from 'expo-secure-store'

const THEME_KEY = 'theme_preference'

type ThemeContextType = {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
})

const lightVars = vars({
  '--color-bg': '#f7f6f3',
  '--color-surface': '#ffffff',
  '--color-surface-light': '#f0efec',
  '--color-elevated': '#e8e7e4',
  '--color-border': '#e5e4e1',
  '--color-border-light': '#d4d3d0',
  '--color-border-subtle': '#eeedeb',
  '--color-text': '#1a1a2e',
  '--color-text-secondary': '#6b7280',
  '--color-text-muted': '#9ca3af',
  '--color-text-inverse': '#ffffff',
})

const darkVars = vars({
  '--color-bg': '#0f0f23',
  '--color-surface': '#1a1a2e',
  '--color-surface-light': '#252540',
  '--color-elevated': '#2d2d4a',
  '--color-border': '#3d3d5c',
  '--color-border-light': '#3d3d5c',
  '--color-border-subtle': '#2a2a45',
  '--color-text': '#f0f0f5',
  '--color-text-secondary': '#a0a0b8',
  '--color-text-muted': '#6b6b85',
  '--color-text-inverse': '#1a1a2e',
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { setColorScheme } = useNativeWindColorScheme()

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((value) => {
      const dark = value === 'dark'
      setIsDark(dark)
      setColorScheme(dark ? 'dark' : 'light')
      setLoaded(true)
    })
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    setColorScheme(newDark ? 'dark' : 'light')
    SecureStore.setItemAsync(THEME_KEY, newDark ? 'dark' : 'light')
  }

  if (!loaded) return null

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <View style={[{ flex: 1 }, isDark ? darkVars : lightVars]}>
        {children}
      </View>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
