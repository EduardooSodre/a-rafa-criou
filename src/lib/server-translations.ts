import { getMessages, DEFAULT_LOCALE, Locale } from './server-i18n'
import { cookies } from 'next/headers'

export function loadServerTranslations(locale?: string) {
  const messages = getMessages(locale)

  function t(key: string, fallback?: string) {
    // simple dot path resolution
    const parts = key.split('.')
    let cur: unknown = messages
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p]
      } else return fallback ?? key
    }
    return typeof cur === 'string' ? cur : fallback ?? key
  }

  return {
    t,
    locale: (locale as Locale) ?? DEFAULT_LOCALE,
    messages,
  }
}

export function loadServerTranslationsFromHeaders() {
  // cookies() may return a ReadonlyRequestCookies; use .get if available
  let cookieLocale: string | undefined
  try {
    // @ts-expect-error runtime API may vary by Next.js minor versions
    cookieLocale = cookies().get?.('NEXT_LOCALE')?.value
  } catch {
    cookieLocale = undefined
  }
  return loadServerTranslations(cookieLocale ?? DEFAULT_LOCALE)
}
