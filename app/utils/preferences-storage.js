import { format } from 'date-fns'
import { constructN, evolve, is, pick, pipe, prop, when } from 'ramda'
import {
  ACTIVITIES, DAYS, PICK_DATE, PREFERENCE_KEYS, SELECTED_ACTIVITY,
  SELECTED_DATE, SELECTED_DAY, SELECTED_TIME_RANGE, TIME_RANGES, TODAY,
} from '@/app/(app)/constants'
import { indexByToValue } from '@/app/utils/list'

const getCookie = name => {
  if (typeof document !== 'undefined') {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
    return match ? decodeURIComponent(match.split('=')[1]) : undefined
  }
}

const setCookie = (name, value) => {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
  }
}

export const parsePreferences = pipe(
  indexByToValue(prop('name'), prop('value')),
  pick(PREFERENCE_KEYS),
  evolve({
    [SELECTED_DATE]: when(is(String), constructN(1, Date)),
  }),
)

/**
 * Retrieve persisted user preferences from cookies.
 * Validates values against known constants and drops invalid entries.
 * Converts selectedDate from ISO string back to Date.
 * Resets selectedDay to TODAY if PICK_DATE but selectedDate is missing/invalid.
 * @returns {Object} Valid preference overrides (may be empty).
 */
export const getPreferences = () => {
  const result = {}

  const activity = getCookie(SELECTED_ACTIVITY)
  if (ACTIVITIES.includes(activity)) {
    result[SELECTED_ACTIVITY] = activity
  }
  const day = getCookie(SELECTED_DAY)
  if (DAYS.includes(day)) {
    result[SELECTED_DAY] = day
  }
  const dateStr = getCookie(SELECTED_DATE)
  if (typeof dateStr === 'string') {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      result[SELECTED_DATE] = date
    }
  }
  const timeRange = getCookie(SELECTED_TIME_RANGE)
  if (TIME_RANGES.includes(timeRange)) {
    result[SELECTED_TIME_RANGE] = timeRange
  }
  if (result[SELECTED_DAY] === PICK_DATE && !result[SELECTED_DATE]) {
    result[SELECTED_DAY] = TODAY
  }

  return result
}

/**
 * Persist a single preference as a cookie.
 * Converts Date values to ISO strings for selectedDate.
 * @param {string} key - One of the known preference keys.
 * @param {*} value - The value to store.
 */
export const setPreference = (key, value) => {
  if (PREFERENCE_KEYS.includes(key)) {
    const strValue = key === SELECTED_DATE && value instanceof Date
      ? format(value, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS')
      : value
    setCookie(key, strValue)
  }
}
