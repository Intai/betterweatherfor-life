import { sql } from 'drizzle-orm'
import { dateNow, formatISODate } from '../app/utils/date.js'
import { error, info } from '../app/utils/logger.js'
import { forecasts, locations } from './schema/index.js'
import db from './index.js'

const aucklandLocations = [{
  name: 'Mission Bay',
  area: 'Beach, Auckland Central',
  citySlug: 'auckland',
  latitude: '-36.8547',
  longitude: '174.8317',
  timeZone: 'Pacific/Auckland',
  source: 'curated',
  forecast: {
    activity: 'sup',
    timeRange: 'all-day',
    score: 85,
    condition: 'ideal',
    wind: { direction: 'NE', speed: '8km/h', gust: '12km/h', condition: 'ideal', summary: 'Light onshore breeze, excellent for paddling.' },
    tide: { state: 'Rising', percentage: 70, swell: '0.3m', condition: 'ideal', summary: 'Rising tide with gentle flow.' },
    water: { quality: 'Green', summary: 'No contamination risk detected.' },
    temp: { air: '22°C', feelsLike: '24°C', water: '20°C', condition: 'ideal', summary: 'Comfortable conditions.' },
    summary: 'Light onshore breeze, excellent for paddling this morning.',
    uv: { index: 4, condition: 'ideal' },
    humidity: null,
    visibility: null,
    analysis: 'Good conditions.',
    hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
  },
}, {
  name: 'Takapuna Beach',
  area: 'Beach, North Shore',
  citySlug: 'auckland',
  latitude: '-36.7878',
  longitude: '174.7768',
  timeZone: 'Pacific/Auckland',
  source: 'curated',
  forecast: {
    activity: 'sup',
    timeRange: 'all-day',
    score: 62,
    condition: 'acceptable',
    wind: { direction: 'SW', speed: '12km/h', gust: '18km/h', condition: 'acceptable', summary: 'Offshore wind component - take care near outer areas.' },
    tide: { state: 'Rising', percentage: 50, swell: '0.5m', condition: 'acceptable', summary: 'Moderate tidal flow.' },
    water: { quality: 'Green', summary: 'No contamination risk detected.' },
    temp: { air: '21°C', feelsLike: '19°C', water: '19°C', condition: 'ideal', summary: 'Comfortable conditions.' },
    summary: 'Offshore wind component - take care near outer areas.',
    uv: { index: 6, condition: 'acceptable' },
    humidity: null,
    visibility: null,
    analysis: 'Moderate wind.',
    hourly: [{ time: '08:00', score: 60, condition: 'acceptable' }],
  },
}, {
  name: 'St Heliers Bay',
  area: 'Beach, East Auckland',
  citySlug: 'auckland',
  latitude: '-36.8508',
  longitude: '174.8593',
  timeZone: 'Pacific/Auckland',
  source: 'curated',
  forecast: {
    activity: 'sup',
    timeRange: 'all-day',
    score: 58,
    condition: 'marginal',
    wind: { direction: 'SW', speed: '15km/h', gust: '22km/h', condition: 'marginal', summary: 'Moderate winds may create choppy conditions.' },
    tide: { state: 'Falling', percentage: 30, swell: '0.8m', condition: 'marginal', summary: 'Outgoing tide with moderate flow.' },
    water: { quality: 'Orange', summary: 'Elevated contamination risk. Exercise caution.' },
    temp: { air: '15°C', feelsLike: '13°C', water: '18°C', condition: 'acceptable', summary: 'Cool conditions, wetsuit recommended.' },
    summary: 'Moderate winds and outgoing tide may create choppy conditions.',
    uv: { index: 8, condition: 'marginal' },
    humidity: null,
    visibility: null,
    analysis: 'Choppy conditions likely.',
    hourly: [{ time: '10:00', score: 45, condition: 'marginal' }],
  },
}]

async function purge() {
  await db.delete(forecasts)
  await db.delete(locations)
  info('Purged all forecasts and locations')
}

export async function seed() {
  await purge()
  const locationResults = []
  const forecastResults = []

  for (const { forecast, ...location } of aucklandLocations) {
    const [locationResult] = await db
      .insert(locations)
      .values(location)
      .onConflictDoUpdate({
        target: [locations.latitude, locations.longitude],
        set: {
          name: location.name,
          area: location.area,
          timeZone: location.timeZone,
          source: location.source,
          updatedAt: sql`now()`,
        },
      })
      .returning()

    locationResults.push(locationResult)
    info(`Upserted: ${locationResult.name}`)

    const forecastValues = {
      locationId: locationResult.id,
      date: formatISODate(dateNow(location.timeZone)),
      ...forecast,
    }
    const [forecastResult] = await db
      .insert(forecasts)
      .values(forecastValues)
      .onConflictDoUpdate({
        target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
        set: {
          score: forecastValues.score,
          condition: forecastValues.condition,
          wind: forecastValues.wind,
          tide: forecastValues.tide,
          water: forecastValues.water,
          temp: forecastValues.temp,
          precipitation: forecastValues.precipitation,
          daylight: forecastValues.daylight,
          uv: forecastValues.uv,
          humidity: forecastValues.humidity,
          visibility: forecastValues.visibility,
          summary: forecastValues.summary,
          analysis: forecastValues.analysis,
          hourly: forecastValues.hourly,
          updatedAt: sql`now()`,
        },
      })
      .returning()

    forecastResults.push(forecastResult)
    info(`Upserted forecast for: ${locationResult.name}`)
  }

  return { locations: locationResults, forecasts: forecastResults }
}

seed()
  .then(() => {
    info('Seed completed successfully')
    process.exit(0)
  })
  .catch(err => {
    error('Seed failed:', err)
    process.exit(1)
  })
