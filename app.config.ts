import type { ExpoConfig, ConfigContext } from 'expo/config'

/**
 * app.config.ts — Configuracao dinamica do Expo para class_aluno.
 *
 * As variaveis de ambiente sao injetadas via:
 *   - EAS Build: declaradas em eas.json > build > <profile> > env
 *   - Local: .env / .env.local (carregado pelo Expo CLI automaticamente)
 *   - CI: definidas como segredos no GitHub Actions
 *
 * Acesso em runtime:
 *   import Constants from 'expo-constants'
 *   const { supabaseUrl, supabaseAnonKey } = Constants.expoConfig?.extra ?? {}
 *
 * Ou, para variaveis publicas (Expo SDK 49+):
 *   process.env.EXPO_PUBLIC_SUPABASE_URL
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const env = process.env.EXPO_PUBLIC_ENV ?? 'development'
  const isDev = env === 'development'
  const isPreview = env === 'preview'
  const isProd = env === 'production'

  // Seleciona o bundle identifier / package com base no ambiente
  const iosBundleId = isProd
    ? 'com.superclasse.aluno'
    : isPreview
    ? 'com.superclasse.aluno.preview'
    : 'com.superclasse.aluno.dev'

  const androidPackage = isProd
    ? 'com.superclasse.aluno'
    : isPreview
    ? 'com.superclasse.aluno.preview'
    : 'com.superclasse.aluno.dev'

  return {
    ...config,

    name: isProd ? 'Superclasse' : isPreview ? 'Superclasse (Preview)' : 'Superclasse (Dev)',
    slug: 'superclasse-aluno',
    version: '1.0.0',
    orientation: 'portrait',

    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    scheme: isProd ? 'superclasse' : `superclasse-${env}`,

    ios: {
      bundleIdentifier: iosBundleId,
      supportsTablet: false,
      infoPlist: {
        NSCameraUsageDescription: 'Necessario para upload de foto de perfil.',
        NSPhotoLibraryUsageDescription: 'Necessario para selecionar imagem do dispositivo.',
        NSMicrophoneUsageDescription: 'Necessario para gravacao de audio nas aulas.',
      },
    },

    android: {
      package: androidPackage,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'RECORD_AUDIO',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
      // googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
          ios: {
            deploymentTarget: '16.0',
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
    },

    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID ?? '100d208a-f02e-46d5-95bd-0999e523ada2'}`,
      fallbackToCacheTimeout: 0,
      enabled: isProd || isPreview,
    },

    runtimeVersion: {
      policy: 'appVersion',
    },

    extra: {
      // Variaveis acessiveis via Constants.expoConfig.extra em runtime
      supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL ??
        process.env.EXPO_PUBLIC_SUPABASE_URL_DEV ??
        'http://127.0.0.1:54321',

      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV ??
        '',

      env,
      isDev,
      isPreview,
      isProd,

      // EAS Project ID — necessario para OTA updates
      eas: {
        projectId: process.env.EAS_PROJECT_ID ?? '100d208a-f02e-46d5-95bd-0999e523ada2',
      },
    },
  }
}
