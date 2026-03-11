import { and, eq, or } from 'drizzle-orm'
import { buildForecastKey, buildLocationKey } from '../../app/utils/forecast.js'
import { indexByToValue } from '../../app/utils/list.js'
import db from '../index.js'
import { forecasts } from '../schema/forecasts.js'
import { locations } from '../schema/locations.js'

const getForecastKey = ({ locations, forecasts }) => {
  const coordinates = buildLocationKey(locations.latitude, locations.longitude)
  return buildForecastKey(forecasts.activity, forecasts.date, forecasts.timeRange, coordinates)
}

const getForecastValue = ({ locations, forecasts }) => ({
  name: locations.name,
  area: locations.area,
  latitude: locations.latitude,
  longitude: locations.longitude,
  timeZone: locations.timeZone,
  score: forecasts.score,
  condition: forecasts.condition,
  wind: forecasts.wind,
  tide: forecasts.tide,
  water: forecasts.water,
  temp: forecasts.temp,
  precipitation: forecasts.precipitation,
  daylight: forecasts.daylight,
  uv: forecasts.uv,
  humidity: forecasts.humidity,
  visibility: forecasts.visibility,
  summary: forecasts.summary,
  analysis: forecasts.analysis,
  hourly: forecasts.hourly,
})

const indexByForecastKey = indexByToValue(getForecastKey, getForecastValue)

/**
 * Query all forecasts for a city and return them in the store shape
 * keyed by "activity;date;timeRange;lat,lng".
 *
 * @param {string} citySlug - The city slug to filter locations by.
 * @returns {Promise<object>} Forecast map keyed by forecast key.
 */
export async function getForecastsByCity(citySlug) {
  return indexByForecastKey(
    await db
      .select()
      .from(forecasts)
      .innerJoin(locations, eq(forecasts.locationId, locations.id))
      .where(eq(locations.citySlug, citySlug))
  )
}

/**
 * Query all forecasts for a set of latitude/longitude pairs and return them
 * in the store shape keyed by "activity;date;timeRange;lat,lng".
 *
 * @param {Array<[string, string]>} latLngPairs - Array of [latitude, longitude] pairs.
 * @returns {Promise<object>} Forecast map keyed by forecast key.
 */
export async function getForecastsByLocations(latLngPairs) {
  if (!latLngPairs || latLngPairs.length === 0) {
    return {}
  }

  return indexByForecastKey(
    await db
      .select()
      .from(forecasts)
      .innerJoin(locations, eq(forecasts.locationId, locations.id))
      .where(or(
        ...latLngPairs.map(([lat, lng]) =>
          and(eq(locations.latitude, lat), eq(locations.longitude, lng))
        )
      ))
  )
}
