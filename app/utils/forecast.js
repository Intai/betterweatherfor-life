import { assoc, map, pick, pipe, reduce, split, toPairs } from 'ramda'
import { joinBySemicolon } from '@/app/utils/string'

/**
 * Build a semicolon-delimited key that uniquely identifies a forecast query.
 *
 * @param {string} activity - Activity type (e.g. "sup", "kayaking").
 * @param {string} date - Date string for the forecast.
 * @param {string} timeRange - Time range within the day.
 * @param {string} [coordinates] - Location coordinates.
 * @returns {string} Forecast key in the form "activity;date;timeRange;coordinates".
 */
export const buildForecastKey = (activity, date, timeRange, coordinates) => joinBySemicolon([activity, date, timeRange, coordinates])

/**
 * Extract the location key from a semicolon-delimited forecast key.
 *
 * @param {string} forecastKey - Forecast key built by `buildForecastKey`.
 * @returns {string} The location coordinates segment.
 */
export const extractLocationKey = forecastKey => forecastKey.split(';').pop()

export const splitLocationKey = pipe(split(','), map(Number))

const pickLocationFields = pick(['name', 'area', 'timeZone'])

/**
 * Extract unique locations from a forecast map.
 * Deduplicates by coordinate key and parses lat/lng back to numbers.
 *
 * @param {object} forecast - Forecast map keyed by "activity;date;timeRange;lat,lng".
 * @returns {object} Locations keyed by "lat,lng".
 */
export const extractCityLocations = pipe(
  toPairs,
  reduce((acc, [key, value]) => {
    const locationKey = extractLocationKey(key)
    const [latitude, longitude] = splitLocationKey(locationKey)
    return assoc(locationKey, { ...pickLocationFields(value), latitude, longitude }, acc)
  }, {}),
)
