import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'
import pt from './locales/pt'
import en from './locales/en'
import es from './locales/es'
import fr from './locales/fr'
import it from './locales/it'
import ru from './locales/ru'

const i18n = new I18n({
  pt,
  en,
  es,
  fr,
  it,
  ru,
})

i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'pt'
i18n.enableFallback = true
i18n.defaultLocale = 'pt'

export default i18n
export function t(key: string, options?: Record<string, unknown>) {
  return i18n.t(key, options)
}
