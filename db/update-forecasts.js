import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { eq, sql } from 'drizzle-orm'
import { complement, either, pick, pipe, prop, propSatisfies, replace } from 'ramda'
import { ACTIVITIES } from '../app/(app)/constants.js'
import { dateNow, formatISODate } from '../app/utils/date.js'
import { error, info } from '../app/utils/logger.js'
import { slugify } from '../app/utils/string.js'
import { forecasts } from './schema/forecasts.js'
import { locations } from './schema/locations.js'
import db from './index.js'

const isLocationForSlug = filterSlug => ({ name }) => slugify(name) === filterSlug

const isNearMidnight = timeZone => {
  const now = dateNow(timeZone)
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return (hours === 23 && minutes >= 30) || (hours === 0 && minutes < 30)
}

const shouldFetchForecast = either(
  complement(prop('forecastId')),
  propSatisfies(isNearMidnight, 'timeZone'),
)

const currentDir = dirname(fileURLToPath(import.meta.url))
const promptTemplatePath = resolve(currentDir, '../app/(app)/docs/ai-forecast-prompt.md')

const queryLocations = () => (
  db.select({
    id: locations.id,
    name: locations.name,
    area: locations.area,
    citySlug: locations.citySlug,
    latitude: locations.latitude,
    longitude: locations.longitude,
    timeZone: locations.timeZone,
    source: locations.source,
    forecastId: sql`min(${forecasts.id})`.as('forecast_id'),
  })
    .from(locations)
    .leftJoin(forecasts, eq(locations.id, forecasts.locationId))
    .groupBy(locations.id)
)

const readPromptTemplate = () => readFileSync(promptTemplatePath, 'utf-8')

const buildPrompt = location => pipe(
  replace(/-36\.97484844433063/g, location.latitude),
  replace(/174\.62043566419308/g, location.longitude),
  replace(/2026-02-13/g, formatISODate(dateNow(location.timeZone))),
  replace('forecast-{activity}.json', `${slugify(location.name)}-{activity}.json`),
)

const runClaude = prompt => {
  info('Running Claude prompt')
  const stdout = execSync(`claude --dangerously-skip-permissions \
--strict-mcp-config --mcp-config ".mcp-playwright.json" --print`, { input: prompt })
  info(stdout.toString())
}

const pickForecast = pick([
  'activity',
  'date',
  'timeRange',
  'score',
  'condition',
  'wind',
  'tide',
  'water',
  'temp',
  'precipitation',
  'daylight',
  'uv',
  'humidity',
  'visibility',
  'summary',
  'analysis',
  'hourly',
])

async function upsertForecast(locationId, forecastValue) {
  const values = {
    locationId,
    ...pickForecast(forecastValue),
  }
  const [result] = await db
    .insert(forecasts)
    .values(values)
    .onConflictDoUpdate({
      target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
      set: {
        score: values.score,
        condition: values.condition,
        wind: values.wind,
        tide: values.tide,
        water: values.water,
        temp: values.temp,
        precipitation: values.precipitation,
        daylight: values.daylight,
        uv: values.uv,
        humidity: values.humidity,
        visibility: values.visibility,
        summary: values.summary,
        analysis: values.analysis,
        hourly: values.hourly,
        updatedAt: sql`now()`,
      },
    })
    .returning()

  return result
}

async function upsertForecasts(location, activity, forecastData) {
  const forecastEntries = Object.entries(forecastData)
  let count = 0

  for (const [key, forecastValue] of forecastEntries) {
    if (forecastValue?.score) {
      const [activity, date, timeRange] = key.split(';')
      await upsertForecast(location.id, { activity, date, timeRange, ...forecastValue })
      count++
    }
  }
  info(`Upserted ${count} forecasts for ${location.name} (${activity})`)
  return count
}

/**
 * Update forecasts for all locations by querying AI and upserting results.
 *
 * @returns {Promise<number>} Total number of forecast entries upserted.
 */
export async function updateForecasts(filterSlug) {
  const template = readPromptTemplate()
  let count = 0

  const allLocations = await queryLocations()
  const locationsToUpdate = filterSlug
    ? allLocations.filter(isLocationForSlug(filterSlug))
    : allLocations.filter(shouldFetchForecast)

  for (const location of locationsToUpdate) {
    info(`Processing: ${location.name}`)
    const locationSlug = slugify(location.name)
    const prompt = buildPrompt(location)(template)
    runClaude(prompt)

    for (const activity of ACTIVITIES) {
      const filepath = resolve(currentDir, `../${locationSlug}-${activity}.json`)
      const forecastData = JSON.parse(readFileSync(filepath, 'utf-8'))
      count += await upsertForecasts(location, activity, forecastData)
    }
  }
  return count
}

updateForecasts(process.argv[2])
  .then(total => {
    info(`Update complete. ${total} forecasts upserted.`)
    process.exit(0)
  })
  .catch(err => {
    error('Update failed:', err.stdout?.toString() || err)
    process.exit(1)
  })
