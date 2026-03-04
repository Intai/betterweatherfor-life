import { useMemo } from 'react'
import { always, ascend, descend, filter, identity, ifElse, last, pipe, prop, sort, toPairs } from 'ramda'
import { formatForecastDate } from '@/app/utils/date'
import { buildForecastKey } from '@/app/utils/forecast'
import { emptyArray } from '@/app/utils/list'
import { useForecastStore } from './forecast-store'

const sortByScore = sort(descend(pipe(last, prop('score'))))

export const buildForecastEntries = (selectedActivity, selectedDay, selectedDate, selectedTimeRange) => pipe(
  toPairs,
  filter(([key, entry]) => {
    const date = formatForecastDate(selectedDay, selectedDate, entry.timeZone)
    const prefix = buildForecastKey(selectedActivity, date, selectedTimeRange)
    return key.startsWith(prefix)
  }),
  sortByScore,
)

/**
 * Returns forecast entries matching the selected activity, day, date, and time range,
 * sorted by score in descending order.
 *
 * @returns {Array<[string, object]>} Forecast key-entry pairs.
 */
export function useForecastEntries() {
  const { forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange } = useForecastStore()
  return useMemo(
    () => buildForecastEntries(selectedActivity, selectedDay, selectedDate, selectedTimeRange)(forecast),
    [forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange],
  )
}

const sortByName = sort(ascend(pipe(last, prop('name'))))

export const buildScheduledLocationEntries = (selectedActivity, selectedDay, selectedDate, selectedTimeRange, forecastKeys) => ifElse(
  identity,
  pipe(
    toPairs,
    filter(([key, entry]) => {
      const date = formatForecastDate(selectedDay, selectedDate, entry.timeZone)
      const forecastKey = buildForecastKey(selectedActivity, date, selectedTimeRange, key)
      return !forecastKeys.includes(forecastKey)
    }),
    sortByName,
  ),
  always(emptyArray),
)

/**
 * Returns location entries that have no matching forecast entries for the current
 * activity, day, and time range, sorted by name ascending.
 *
 * @returns {Array<[string, object]>} Coordinate-key / location pairs.
 */
export function useScheduledLocationEntries() {
  const { locations, forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange } = useForecastStore()
  return useMemo(
    () => buildScheduledLocationEntries(selectedActivity, selectedDay, selectedDate, selectedTimeRange, Object.keys(forecast))(locations),
    [locations, forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange],
  )
}
