/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand
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

        // Surfaces (light premium)
        dark: {
          bg: '#f7f6f3',
          surface: '#ffffff',
          surfaceLight: '#f0efec',
          elevated: '#e8e7e4',
        },

        // Borders
        darkBorder: {
          DEFAULT: '#e5e4e1',
          light: '#d4d3d0',
          subtle: '#eeedeb',
        },

        // Text
        darkText: {
          DEFAULT: '#1a1a2e',
          secondary: '#6b7280',
          muted: '#9ca3af',
          inverse: '#ffffff',
        },

        // Semantic
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
