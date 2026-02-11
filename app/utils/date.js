/**
 * Format a date as a short day+month string in locale-aware order.
 * e.g. 'en-NZ' → "10 Feb", 'en-US' → "Feb 10"
 *
 * @param {Date} date - The date to format.
 * @param {string} [locale] - BCP 47 locale string. Defaults to the browser locale.
 * @returns {string} Locale-formatted short date.
 */
export function formatShortDate(date, locale) {
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}
