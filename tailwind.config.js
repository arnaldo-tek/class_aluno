/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand (fixed - don't change with theme)
        primary: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1e40af',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        accent: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#b45309',
          muted: '#fef3c7',
        },

        // Surfaces (CSS variables for theme switching)
        dark: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          surfaceLight: 'var(--color-surface-light)',
          elevated: 'var(--color-elevated)',
        },

        // Borders
        darkBorder: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          subtle: 'var(--color-border-subtle)',
        },

        // Text
        darkText: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },

        // Semantic (fixed)
        success: {
          DEFAULT: '#059669',
          dark: '#ecfdf5',
        },
        error: {
          DEFAULT: '#dc2626',
          dark: '#fef2f2',
        },
        warning: {
          DEFAULT: '#d97706',
          dark: '#fffbeb',
        },
      },
    },
  },
  plugins: [],
}
