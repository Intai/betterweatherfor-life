import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { pick, pipe, replace } from 'ramda'
import { dateNow, formatISODate } from '../app/utils/date.js'
import { error, info } from '../app/utils/logger.js'
import { slugify } from '../app/utils/string.js'
import { forecasts } from './schema/forecasts.js'
import { locations } from './schema/locations.js'
import db from './index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const promptTemplatePath = resolve(currentDir, '../app/(app)/docs/ai-forecast-prompt.md')

const queryLocations = async locationSlug => {
  const all = await db.select().from(locations)
  if (!locationSlug) return all
  return all.filter(({ name }) => slugify(name) === locationSlug)
}

const readPromptTemplate = () => readFileSync(promptTemplatePath, 'utf-8')

const buildPrompt = (location, filename) => pipe(
  replace(/-36\.97484844433063/g, location.latitude),
  replace(/174\.62043566419308/g, location.longitude),
  replace(/2026-02-13/g, formatISODate(dateNow(location.timeZone))),
  replace('forecast.json', filename),
)

const runClaude = (filename, prompt) => {
  info('Running Claude prompt')
  const stdout = execSync(`claude --dangerously-skip-permissions --model "sonnet" \
--strict-mcp-config --mcp-config ".mcp-playwright.json" --output-format "text" --print`, { input: prompt })
  info(stdout.toString())
  return JSON.parse(readFileSync(resolve(currentDir, `../${filename}`), 'utf-8'))
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
  'summary',
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
        summary: values.summary,
        updatedAt: sql`now()`,
      },
    })
    .returning()

  return result
}

async function upsertForecasts(location, forecastData) {
  const forecastValues = Object.values(forecastData)
  const count = forecastValues.length

  for (const forecastValue of forecastValues) {
    await upsertForecast(location.id, forecastValue)
  }
  info(`Upserted ${count} forecasts for ${location.name}`)
  return count
}

/**
 * Update forecasts for all locations by querying AI and upserting results.
 *
 * @returns {Promise<number>} Total number of forecast entries upserted.
 */
export async function updateForecasts(locationSlug) {
  const template = readPromptTemplate()
  let count = 0

  for (const location of await queryLocations(locationSlug)) {
    info(`Processing: ${location.name}`)
    const filename = `${slugify(location.name)}.json`
    const prompt = buildPrompt(location, filename)(template)
    const forecastData = runClaude(filename, prompt)
    count += await upsertForecasts(location, forecastData)
  }
  return count
}

updateForecasts(process.argv[2])
  .then(total => {
    info(`Update complete. ${total} forecasts upserted.`)
    process.exit(0)
  })
  .catch(err => {
    error('Update failed:', err)
    process.exit(1)
  })
