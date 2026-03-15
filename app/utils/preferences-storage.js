import { format } from 'date-fns'
import { constructN, evolve, is, pick, pipe, prop, when } from 'ramda'
import {
  ACTIVITIES, DAYS, PICK_DATE, PREFERENCE_KEYS, SELECTED_DATE,
  TIME_RANGES, TODAY,
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

  const activity = getCookie('selectedActivity')
  if (ACTIVITIES.includes(activity)) {
    result.selectedActivity = activity
  }
  const day = getCookie('selectedDay')
  if (DAYS.includes(day)) {
    result.selectedDay = day
  }
  const dateStr = getCookie('selectedDate')
  if (typeof dateStr === 'string') {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      result.selectedDate = date
    }
  }
  const timeRange = getCookie('selectedTimeRange')
  if (TIME_RANGES.includes(timeRange)) {
    result.selectedTimeRange = timeRange
  }
  if (result.selectedDay === PICK_DATE && !result.selectedDate) {
    result.selectedDay = TODAY
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
