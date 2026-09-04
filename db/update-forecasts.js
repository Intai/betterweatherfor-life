import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from 'config'
import { subDays } from 'date-fns'
import { eq, lt, sql } from 'drizzle-orm'
import { either, pick, pipe, pluck, propSatisfies, replace } from 'ramda'
import { ACTIVITIES } from '../app/(app)/constants.js'
import { dateNow, formatISODate } from '../app/utils/date.js'
import { error, info } from '../app/utils/logger.js'
import { joinByComma, slugify } from '../app/utils/string.js'
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

const isForecastStale = ({ forecastUpdatedAt }) =>
  !forecastUpdatedAt || (dateNow() - new Date(forecastUpdatedAt)) > 24 * 60 * 60 * 1000

const shouldFetchForecast = either(
  isForecastStale,
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
    forecastUpdatedAt: sql`max(${forecasts.updatedAt})`.as('forecast_updated_at'),
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
--strict-mcp-config --print`, { input: prompt })
  // --strict-mcp-config --mcp-config ".mcp-playwright.json" --print`, { input: prompt })
  info(stdout.toString())
}

const runLangGraph = location => {
  info('Running LangGraph forecast')
  const stdout = execSync(
    `${config.get('forecast.python')} -m langraph.app.update_forecasts `
    + `--lat "${location.latitude}" `
    + `--lng "${location.longitude}" `
    + `--date "${formatISODate(dateNow(location.timeZone))}" `
    + `--timezone "${location.timeZone}" `
    + `--slug "${slugify(location.name)}"`,
    { cwd: resolve(currentDir, '..') },
  )
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

async function deletePastForecasts() {
  const cutoffDate = formatISODate(subDays(dateNow(), 2))
  const result = await db.delete(forecasts).where(lt(forecasts.date, cutoffDate))
  info(`Deleted ${result.count} past forecasts older than ${cutoffDate}`)
}

async function updateLocation(location, template) {
  const locationSlug = slugify(location.name)
  let count = 0

  if (config.get('forecast.engine') === 'langgraph') {
    runLangGraph(location)
  } else {
    const prompt = buildPrompt(location)(template)
    runClaude(prompt)
  }
  for (const activity of ACTIVITIES) {
    const filepath = resolve(currentDir, `../${locationSlug}-${activity}.json`)
    const forecastData = JSON.parse(readFileSync(filepath, 'utf-8'))
    count += await upsertForecasts(location, activity, forecastData)
  }
  return count
}

/**
 * Update forecasts for all locations by querying AI and upserting results.
 *
 * A location that throws is logged and skipped rather than ending the run: the
 * sources are regional, so one location can be permanently outside their coverage
 * and would otherwise block every other location from ever updating.
 *
 * @returns {Promise<{count: number, failed: string[]}>} Entries upserted, and the
 *   names of the locations that failed.
 */
export async function updateForecasts(filterSlug) {
  await deletePastForecasts()
  const template = readPromptTemplate()
  const failed = []
  let count = 0

  const allLocations = await queryLocations()
  const locationsToUpdate = filterSlug
    ? allLocations.filter(isLocationForSlug(filterSlug))
    // Limit to 2 locations per run to avoid LLM rate limits.
    : allLocations.filter(shouldFetchForecast).slice(0, 2)

  info(`Target locations: ${joinByComma(pluck('name', locationsToUpdate))}`)
  for (const location of locationsToUpdate) {
    info(`Processing: ${location.name}`)
    try {
      count += await updateLocation(location, template)
    } catch (err) {
      failed.push(location.name)
      error(`Failed: ${location.name}`, err.stdout?.toString() || err)
    }
  }
  return { count, failed }
}

updateForecasts(process.argv[2])
  .then(({ count, failed }) => {
    info(`Update complete. ${count} forecasts upserted.`)
    if (failed.length) error(`Failed locations: ${joinByComma(failed)}`)
    // A run where some locations updated is a partial success. Only a run that
    // upserted nothing despite a failure is worth failing the pod over — having
    // no stale location to update is not an error.
    process.exit(failed.length && !count ? 1 : 0)
  })
  .catch(err => {
    error('Update failed:', err.stdout?.toString() || err)
    process.exit(1)
  })
