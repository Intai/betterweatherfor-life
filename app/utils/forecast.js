import { apply, applySpec, assoc, concat, identical, identity, lensIndex, lte, map, maxBy, over, path, pick, pipe, propOr, propSatisfies, reduce, split, splitWhen, takeLastWhile, takeWhile, toPairs, when } from 'ramda'
import { joinBySemicolon } from '@/app/utils/string'

/**
 * Find the hourly slot with the highest score.
 * Returns null for falsy or empty input. On ties, returns the first occurrence.
 * @param {object[]|null|undefined} hourly - Array of hourly forecast objects with a `score` property.
 * @returns {object|null} The hour object with the highest score, or null.
 */
export const findBestHour = when(identity, reduce(maxBy(propOr(-1, 'score')), null))

const findBestWindowWithinThreshold = (bestHour, isWithinThreshold) => pipe(
  // Split the hourly array into [before, [bestHour, ...after]] at the peak hour.
  splitWhen(identical(bestHour)),
  // Keep only the trailing contiguous hours within the score threshold from "before".
  over(lensIndex(0), takeLastWhile(isWithinThreshold)),
  // Keep only the leading contiguous hours within the score threshold from "[bestHour, ...after]".
  over(lensIndex(1), takeWhile(isWithinThreshold)),
  // Merge the two segments back into a single contiguous window.
  apply(concat),
  // Extract start and end times from the first and last elements.
  applySpec({
    start: path([0, 'time']),
    end: path([-1, 'time']),
  }),
)

/**
 * Find the best contiguous time window from hourly forecast data.
 * Uses a peak cluster algorithm: finds the best hour, then extends outward
 * while scores stay within ~20 points of the peak score.
 * @param {object[]|null|undefined} hourly - Array of hourly forecast objects with `time` and `score` properties.
 * @returns {{ start: string, end: string }|null|undefined} The best time window, or null if no acceptable hours.
 */
export const findBestWindow = hourly => {
  const bestHour = findBestHour(hourly)
  return bestHour && findBestWindowWithinThreshold(
    bestHour,
    propSatisfies(lte(bestHour.score - 20), 'score')
  )(hourly)
}

/**
 * Build a storage key from coordinates.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} A "lat,lng" coordinate string.
 */
export const buildLocationKey = (latitude, longitude) => `${latitude},${longitude}`

/**
 * Split a location key into its numeric coordinates.
 * @param {string} locationKey - A "lat,lng" coordinate string.
 * @returns {number[]} A tuple of [latitude, longitude].
 */
export const splitLocationKey = pipe(split(','), map(Number))

/**
 * Build a semicolon-delimited key that uniquely identifies a forecast query.
 * @param {string} activity - Activity type (e.g. "sup", "kayaking").
 * @param {string} date - Date string for the forecast.
 * @param {string} timeRange - Time range within the day.
 * @param {string} [coordinates] - Location coordinates.
 * @returns {string} Forecast key in the form "activity;date;timeRange;coordinates".
 */
export const buildForecastKey = (activity, date, timeRange, coordinates) => joinBySemicolon([activity, date, timeRange, coordinates])

/**
 * Extract the location key from a semicolon-delimited forecast key.
 * @param {string} forecastKey - Forecast key built by `buildForecastKey`.
 * @returns {string} The location coordinates segment.
 */
export const extractLocationKey = forecastKey => forecastKey.split(';').pop()

/**
 * Extract the date segment from a semicolon-delimited forecast key.
 * @param {string} forecastKey - Forecast key built by `buildForecastKey`.
 * @returns {string} The date segment.
 */
export const extractDateSegment = forecastKey => forecastKey.split(';')[1]

const pickLocationFields = pick(['name', 'area', 'timeZone'])

/**
 * Extract unique locations from a forecast map.
 * Deduplicates by coordinate key and parses lat/lng back to numbers.
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
