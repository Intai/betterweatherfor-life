'use client'

import { createContext, useContext } from 'react'

const LocaleContext = createContext(undefined)

/**
 * Provides a locale string to descendant components via React context.
 *
 * @param {object} props
 * @param {string} props.locale - BCP 47 locale string from the server.
 * @param {React.ReactNode} props.children
 */
export default function LocaleProvider({ locale, children }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * Returns the locale string from the nearest LocaleProvider.
 * Falls back to `navigator.language` when no provider is present.
 *
 * @returns {string} BCP 47 locale string.
 */
export function useLocale() {
  const locale = useContext(LocaleContext)
  return locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en')
}
