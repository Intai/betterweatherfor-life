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
    wind: { direction: 'NE', speed: '8km/h', condition: 'ideal' },
    tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
    water: 'Green',
    temp: '22°C',
    summary: 'Light onshore breeze, excellent for paddling this morning.',
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
    wind: { direction: 'SW', speed: '12km/h', condition: 'acceptable' },
    tide: { state: 'Rising', percentage: 50, condition: 'acceptable' },
    water: 'Green',
    temp: '21°C',
    summary: 'Offshore wind component - take care near outer areas.',
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
    wind: { direction: 'SW', speed: '15km/h', condition: 'marginal' },
    tide: { state: 'Falling', percentage: 30, condition: 'marginal' },
    water: 'Orange',
    temp: '15°C',
    summary: 'Moderate winds and outgoing tide may create choppy conditions.',
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
