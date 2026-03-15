import { headers } from 'next/headers'

/**
 * Parse the Accept-Language header to get locale and lang.
 * @returns {Promise<{ locale: string, lang: string }>}
 */
export async function getAcceptLanguage() {
  const headersList = await headers()
  const acceptLanguage = headersList.get('accept-language') || ''
  const locale = acceptLanguage.split(',')[0]?.trim() || 'en'
  const lang = locale.split('-')[0]
  return { locale, lang }
}
