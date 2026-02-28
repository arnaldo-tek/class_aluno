import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn as string | undefined

export function initSentry() {
  if (!SENTRY_DSN) return

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__,
    attachScreenshot: true,
    attachViewHierarchy: true,
  })
}

export function captureError(error: unknown, context?: Record<string, any>) {
  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context })
  } else {
    Sentry.captureMessage(String(error), { extra: context })
  }
}

export { Sentry }
