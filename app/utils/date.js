import { addDays, format, startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { PICK_DATE, TODAY, TOMORROW } from '../(app)/constants.js'

/**
 * Return the current date, optionally adjusted to a specific timezone.
 *
 * @param {string} [timeZone] - IANA timezone (e.g. 'Pacific/Auckland').
 * @returns {Date}
 */
export function dateNow(timeZone) {
  return timeZone ? toZonedTime(new Date(), timeZone) : new Date()
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
 * Format a Date as an ISO date string (yyyy-MM-dd).
 *
 * @param {Date} date - The date to format.
 * @returns {string} ISO-formatted date string, e.g. "2026-02-10".
 */
export function formatISODate(date) {
  return format(date, 'yyyy-MM-dd')
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
  switch (selectedDay) {
  case TODAY:
    return formatISODate(startOfDay(dateNow(timeZone)))
  case TOMORROW:
    return formatISODate(addDays(startOfDay(dateNow(timeZone)), 1))
  case PICK_DATE:
    return formatISODate(selectedDate)
  }
}
