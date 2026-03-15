import { useMemo } from 'react'
import { always, ascend, assocPath, collectBy, descend, filter, find, head, identity, ifElse, last, length, map, maxBy, nth, nthArg, pipe, prop, propOr, reduce, sort, test, toPairs, when } from 'ramda'
import { formatForecastDate } from '@/app/utils/date'
import { buildForecastKey, extractDateSegment } from '@/app/utils/forecast'
import { emptyArray } from '@/app/utils/list'
import { filterObj } from '@/app/utils/object'
import { useForecastStore } from './forecast-store'

const sortByScore = sort(descend(pipe(last, prop('score'))))

export const buildForecastEntry = (selectedActivity, selectedDay, selectedDate, selectedTimeRange, geolocation) => pipe(
  toPairs,
  find(([key, entry]) => {
    const date = formatForecastDate(selectedDay, selectedDate, entry.timeZone)
    const forecastKey = buildForecastKey(selectedActivity, date, selectedTimeRange, geolocation)
    return key === forecastKey
  }),
)

/**
 * Returns the forecast entry matching the given geolocation and the selected
 * activity, day, date, and time range from the store.
 *
 * @param {string} geolocation - Coordinates string in "lat,lng" format.
 * @returns {[string, object]|undefined} Forecast key-entry pair, or undefined if not found.
 */
export function useForecastEntry(geolocation) {
  const { forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange } = useForecastStore()
  return useMemo(
    () => buildForecastEntry(selectedActivity, selectedDay, selectedDate, selectedTimeRange, geolocation)(forecast),
    [forecast, selectedActivity, selectedDay, selectedDate, selectedTimeRange, geolocation],
  )
}

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

const sortByDate = sort(ascend(pipe(head, extractDateSegment)))

/**
 * Builds a 7-day forecast summary by filtering forecast entries for the given activity
 * with all-day time range, grouping by date, picking the highest-scoring entry per date,
 * and marking the overall best day with `isBestDay: true`.
 *
 * @param {string} activity - Activity type (e.g. "sup", "kayaking").
 * @param {object} forecast - Forecast map keyed by "activity;date;timeRange;coordinates".
 * @returns {Array<[string, object]>} Forecast key-entry pairs sorted by date ascending.
 */
export const buildSevenDayForecastEntries = activity => pipe(
  // Filter keys matching activity;*;all-day;*
  filterObj(pipe(
    nthArg(1),
    test(new RegExp(`^${activity};[^;]*;all-day;`)),
  )),
  toPairs,
  // Group by date
  collectBy(pipe(nth(0), extractDateSegment)),
  // Keep only the highest-scoring entry per date
  map(reduce(maxBy(pipe(nth(1), propOr(-1, 'score'))), [])),
  // Sort by score descending
  sortByScore,
  // Mark the best day (first entry after sorting)
  when(length, assocPath([0, 1, 'isBestDay'], true)),
  // Sort by date ascending
  sortByDate,
)

/**
 * Returns 7-day forecast entries for the selected activity, with the best
 * location per date and the overall best day marked with `isBestDay: true`.
 *
 * @returns {Array<[string, object]>} Forecast key-entry pairs.
 */
export function useSevenDayForecastEntries() {
  const { forecast, selectedActivity } = useForecastStore()
  return useMemo(
    () => buildSevenDayForecastEntries(selectedActivity)(forecast),
    [forecast, selectedActivity],
  )
}
