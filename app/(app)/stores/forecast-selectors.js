import { useMemo } from 'react'
import { descend, filter, last, pipe, prop, sort, toPairs } from 'ramda'
import { formatForecastDate } from '@/app/utils/date'
import { buildForecastKey } from '@/app/utils/forecast'
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
