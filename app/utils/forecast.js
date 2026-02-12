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
