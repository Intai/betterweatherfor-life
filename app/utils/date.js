import { tz, TZDate } from '@date-fns/tz'
import { addDays, format, isToday, startOfDay } from 'date-fns'
import { PICK_DATE, TODAY, TOMORROW } from '../(app)/constants.js'

/**
 * Return the current date, optionally adjusted to a specific timezone.
 *
 * @param {string} [timeZone] - IANA timezone (e.g. 'Pacific/Auckland').
 * @returns {Date}
 */
export function dateNow(timeZone) {
  return timeZone ? TZDate.tz(timeZone) : new Date()
}

/**
 * Check whether a date is today, optionally in a specific timezone.
 *
 * @param {Date} date - The date to check.
 * @param {string} [timeZone] - IANA timezone (e.g. 'Pacific/Auckland').
 * @returns {boolean}
 */
export function dateIsToday(date, timeZone) {
  return timeZone
    ? isToday(date, { in: tz(timeZone) })
    : isToday(date)
}

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

/**
 * Format a date as a short weekday name.
 * e.g. "Sat", "Mon"
 *
 * @param {Date} date - The date to format.
 * @param {string} [locale] - BCP 47 locale string. Defaults to the browser locale.
 * @returns {string} Locale-formatted short weekday name.
 */
export function formatShortWeekday(date, locale) {
  return date.toLocaleDateString(locale, { weekday: 'short' })
}

/**
 * Format a date as a short weekday+day+month string in locale-aware order.
 * e.g. 'en-NZ' → "Sat 11 Feb", 'en-US' → "Sat, Feb 11"
 *
 * @param {Date} date - The date to format.
 * @param {string} [locale] - BCP 47 locale string. Defaults to the browser locale.
 * @returns {string} Locale-formatted short date with weekday.
 */
export function formatShortDateWithWeekday(date, locale) {
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
}

/**
 * Format a Date as an ISO date string (yyyy-MM-dd).
 *
 * @param {Date} date - The date to format.
 * @returns {string} ISO-formatted date string, e.g. "2026-02-10".
 */
export function formatISODate(date) {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Resolve a forecast day selection to a Date object.
 *
 * @param {string} selectedDay - One of 'today', 'tomorrow', or 'pick-date'.
 * @param {Date} [selectedDate] - The user-picked date (required when selectedDay is 'pick-date').
 * @param {string} [timeZone] - IANA timezone for resolving "today"/"tomorrow" (e.g. 'Pacific/Auckland').
 * @returns {Date} The resolved date.
 */
export function parseForecastDate(selectedDay, selectedDate, timeZone) {
  switch (selectedDay) {
  case TODAY:
    return startOfDay(dateNow(timeZone))
  case TOMORROW:
    return addDays(startOfDay(dateNow(timeZone)), 1)
  case PICK_DATE:
    return selectedDate
  }
}

/**
 * Resolve a forecast day selection to an ISO date string.
 *
 * @param {string} selectedDay - One of 'today', 'tomorrow', or 'pick-date'.
 * @param {Date} [selectedDate] - The user-picked date (required when selectedDay is 'pick-date').
 * @param {string} [timeZone] - IANA timezone for resolving "today"/"tomorrow" (e.g. 'Pacific/Auckland').
 * @returns {string} ISO-formatted date string (yyyy-MM-dd).
 */
export function formatForecastDate(selectedDay, selectedDate, timeZone) {
  return formatISODate(parseForecastDate(selectedDay, selectedDate, timeZone))
}
