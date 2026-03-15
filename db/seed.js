import { addDays } from 'date-fns'
import { sql } from 'drizzle-orm'
import { clamp } from 'ramda'
import { dateNow, formatISODate } from '../app/utils/date.js'
import { error, info } from '../app/utils/logger.js'
import { forecasts, locations } from './schema/index.js'
import db from './index.js'

/**
 * Map a numeric score to its condition label.
 * @param {number} score
 * @returns {string}
 */
function scoreToCondition(score) {
  if (score >= 80) return 'ideal'
  if (score >= 60) return 'acceptable'
  if (score >= 40) return 'marginal'
  return 'unsuitable'
}

/**
 * Clamp a value between 0 and 100.
 * @param {number} n
 * @returns {number}
 */
const clampScore = clamp(0, 100)

/**
 * Per-day score offsets applied to the Day 1 template.
 * Day 0 (today) uses the template as-is. Day 3 is the best day (+10),
 * Day 5 is the worst / unsuitable day (-45).
 */
const DAY_OFFSETS = [0, -8, -15, 10, -5, -45, -20]

/**
 * Per-day hourly rotation: shifts the peak hour position so
 * findBestWindow returns different windows each day.
 */
const HOURLY_SHIFTS = [0, 2, -1, 3, 1, -2, -3]

/**
 * Generate a 7-day forecast array from a single-day template.
 * @param {object} template - The Day 1 forecast object.
 * @param {Date} today - The base date (today in the location timezone).
 * @returns {object[]} Seven forecast objects with varied scores and hourly data.
 */
function generate7DayForecasts(template, today) {
  return DAY_OFFSETS.map((offset, dayIndex) => {
    const date = formatISODate(addDays(today, dayIndex))
    const rawScore = clampScore(template.score + offset)
    const condition = scoreToCondition(rawScore)

    const shift = HOURLY_SHIFTS[dayIndex]
    const hourly = template.hourly.map((slot, i) => {
      // Shift the curve so the peak moves to a different hour each day
      const srcIndex = ((i - shift) % template.hourly.length + template.hourly.length) % template.hourly.length
      const hourScore = clampScore(template.hourly[srcIndex].score + offset)
      return { time: slot.time, score: hourScore, condition: scoreToCondition(hourScore) }
    })

    return { ...template, date, score: rawScore, condition, hourly }
  })
}

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
    tide: { state: 'Rising', percentage: 70, nextHigh: '10:30', nextLow: '16:45', swell: '0.3m', condition: 'ideal', summary: 'Rising tide with gentle flow.' },
    water: { quality: 'Green', condition: 'ideal', summary: 'No contamination risk detected.' },
    temp: { air: '22°C', feelsLike: '24°C', water: '20°C', condition: 'ideal', summary: 'Comfortable conditions.' },
    summary: 'Light onshore breeze, excellent for paddling this morning.',
    uv: { index: 4, condition: 'ideal', summary: 'Moderate UV. Sun protection recommended for extended sessions.' },
    humidity: null,
    visibility: null,
    analysis: 'Flat water and light winds make Mission Bay one of the best spots for SUP today. The gentle northeast breeze will help keep you cool without creating chop.\n\nTide is rising through the morning, providing a gentle push toward shore. Water quality is excellent with no contamination alerts in effect.',
    daylight: { sunset: '19:42', condition: 'ideal', summary: 'Sunset at 7:42 PM. Plenty of daylight for a full session.' },
    hourly: [
      { time: '06:00', score: 72, condition: 'acceptable' },
      { time: '07:00', score: 78, condition: 'acceptable' },
      { time: '08:00', score: 85, condition: 'ideal' },
      { time: '09:00', score: 90, condition: 'ideal' },
      { time: '10:00', score: 88, condition: 'ideal' },
      { time: '11:00', score: 84, condition: 'ideal' },
      { time: '12:00', score: 76, condition: 'acceptable' },
      { time: '13:00', score: 70, condition: 'acceptable' },
      { time: '14:00', score: 65, condition: 'acceptable' },
    ],
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
    tide: { state: 'Rising', percentage: 50, nextHigh: '11:00', nextLow: '17:15', swell: '0.5m', condition: 'acceptable', summary: 'Moderate tidal flow.' },
    water: { quality: 'Green', condition: 'ideal', summary: 'No contamination risk detected.' },
    temp: { air: '21°C', feelsLike: '19°C', water: '19°C', condition: 'ideal', summary: 'Comfortable conditions.' },
    summary: 'Offshore wind component - take care near outer areas.',
    uv: { index: 6, condition: 'acceptable', summary: 'High UV. Sunscreen and protective clothing advised.' },
    humidity: null,
    visibility: null,
    analysis: 'Moderate wind.',
    hourly: [
      { time: '06:00', score: 50, condition: 'marginal' },
      { time: '07:00', score: 56, condition: 'acceptable' },
      { time: '08:00', score: 65, condition: 'acceptable' },
      { time: '09:00', score: 62, condition: 'acceptable' },
      { time: '10:00', score: 58, condition: 'marginal' },
      { time: '11:00', score: 54, condition: 'marginal' },
      { time: '12:00', score: 48, condition: 'marginal' },
      { time: '13:00', score: 44, condition: 'marginal' },
      { time: '14:00', score: 40, condition: 'marginal' },
    ],
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
    tide: { state: 'Falling', percentage: 30, nextHigh: '22:30', nextLow: '16:00', swell: '0.8m', condition: 'marginal', summary: 'Outgoing tide with moderate flow.' },
    water: { quality: 'Orange', condition: 'marginal', summary: 'Elevated contamination risk. Exercise caution.' },
    temp: { air: '15°C', feelsLike: '13°C', water: '18°C', condition: 'acceptable', summary: 'Cool conditions, wetsuit recommended.' },
    summary: 'Moderate winds and outgoing tide may create choppy conditions.',
    uv: { index: 8, condition: 'marginal', summary: 'Very high UV. Limit prolonged exposure and reapply sunscreen frequently.' },
    humidity: null,
    visibility: null,
    analysis: 'Choppy conditions are expected throughout the day due to moderate southwest winds and outgoing tide. The combination of wind against tide will create uncomfortable surface chop.\n\nWater quality is also a concern with elevated contamination risk following recent rainfall. Consider an alternative location if conditions do not improve by mid-morning.',
    precipitation: { chance: 60, condition: 'marginal', summary: 'Scattered showers likely through the morning.' },
    hourly: [
      { time: '06:00', score: 48, condition: 'marginal' },
      { time: '07:00', score: 45, condition: 'marginal' },
      { time: '08:00', score: 42, condition: 'marginal' },
      { time: '09:00', score: 38, condition: 'unsuitable' },
      { time: '10:00', score: 35, condition: 'unsuitable' },
      { time: '11:00', score: 32, condition: 'unsuitable' },
      { time: '12:00', score: 30, condition: 'unsuitable' },
      { time: '13:00', score: 28, condition: 'unsuitable' },
      { time: '14:00', score: 25, condition: 'unsuitable' },
    ],
  },
}, {
  name: 'Goat Island',
  area: 'Marine Reserve, Leigh',
  citySlug: 'auckland',
  latitude: '-36.2675',
  longitude: '174.7936',
  timeZone: 'Pacific/Auckland',
  source: 'curated',
  forecast: {
    activity: 'snorkelling',
    timeRange: 'all-day',
    score: 68,
    condition: 'acceptable',
    visibility: { estimate: '6m', condition: 'acceptable', summary: 'Light swell slightly reduces clarity. Expect 5-8m visibility.' },
    water: { quality: 'Green', condition: 'ideal', summary: 'No contamination risk. Safe for full immersion.' },
    tide: { state: 'Rising', percentage: 55, nextHigh: '11:15', nextLow: '17:30', swell: '0.4m', condition: 'ideal', summary: 'Incoming tide bringing cleaner water over the reef.' },
    wind: { direction: 'NE', speed: '10km/h', gust: '14km/h', condition: 'acceptable', summary: 'Light breeze creating minor surface chop.' },
    temp: { air: '23°C', feelsLike: '22°C', water: '21°C', condition: 'ideal', summary: 'Warm water, comfortable without a thick wetsuit.' },
    uv: { index: 5, condition: 'ideal', summary: 'Moderate UV. Standard sun protection recommended.' },
    humidity: null,
    precipitation: { amount: '0mm', chance: '10%', condition: 'ideal', summary: 'Dry conditions expected.' },
    daylight: { sunset: '19:38', condition: 'ideal', summary: 'Sunset at 7:38 PM. Good daylight window for snorkelling.' },
    summary: 'Light 10km/h breeze with acceptable underwater visibility around 6m.',
    analysis: 'Goat Island Marine Reserve offers good snorkelling conditions today with acceptable visibility around 6m.\n\nThe incoming tide is ideal for snorkelling, pushing cleaner water over the reef and improving conditions through the morning.\n\nBest window is 9am-11am as the tide rises toward high, bringing the best visibility and calmest conditions over the reef.',
    hourly: [
      { time: '06:00', score: 58, condition: 'marginal' },
      { time: '07:00', score: 62, condition: 'acceptable' },
      { time: '08:00', score: 66, condition: 'acceptable' },
      { time: '09:00', score: 70, condition: 'acceptable' },
      { time: '10:00', score: 72, condition: 'acceptable' },
      { time: '11:00', score: 68, condition: 'acceptable' },
      { time: '12:00', score: 65, condition: 'acceptable' },
      { time: '13:00', score: 60, condition: 'acceptable' },
    ],
  },
}, {
  name: 'Piha Beach',
  area: 'Auckland 0772, New Zealand',
  citySlug: 'auckland',
  latitude: '-36.9553',
  longitude: '174.4681',
  timeZone: 'Pacific/Auckland',
  source: 'curated',
  forecast: {
    activity: 'cycling',
    timeRange: 'all-day',
    score: 25,
    condition: 'unsuitable',
    wind: { direction: 'SW', speed: '42km/h', gust: '58km/h', condition: 'unsuitable', summary: '42km/h gusting to 58km/h SW headwind makes riding dangerous on exposed coastal roads.' },
    precipitation: { amount: '4.2mm', chance: '95%', condition: 'unsuitable', summary: 'Heavy rain throughout the day with 95% chance of precipitation. Road spray and reduced braking significantly increase risk.' },
    tide: null,
    water: null,
    temp: { air: '14°C', feelsLike: '8°C', condition: 'marginal', summary: 'Cool 14°C feels like 8°C due to wind chill and rain. Hypothermia risk on longer rides.' },
    daylight: { civilTwilightEnd: '20:45', condition: 'ideal', summary: 'Rideable light until 8:45 PM. Long evening window available.' },
    uv: { index: 2, condition: 'ideal', summary: 'Low UV due to heavy cloud cover.' },
    humidity: { percentage: '94%', condition: 'unsuitable', summary: '94% humidity severely impairs sweat evaporation during sustained effort, increasing heat stress and fatigue.' },
    visibility: null,
    summary: '42km/h SW headwind with heavy rain and 94% humidity make cycling dangerous and extremely uncomfortable.',
    analysis: 'Piha Beach is completely unsuitable for cycling today due to a convergence of severe weather factors.\n\nThe dominant issue is the 42km/h sustained southwest wind gusting to 58km/h. This far exceeds the 35km/h threshold for safe cycling, particularly on the exposed coastal roads around Piha where there is no shelter from the prevailing westerly winds. Riders would struggle to maintain control, especially on descents and around corners.\n\nHeavy rainfall of 4.2mm per hour compounds the danger significantly. Wet road surfaces reduce tyre grip and braking performance, while road spray from passing vehicles severely limits visibility. The combination of strong crosswinds and wet roads creates a high risk of accidents.\n\nHumidity at 94% means the body cannot effectively cool itself through sweat evaporation. Even at a moderate air temperature of 14°C, the wind chill brings the feels-like temperature down to 8°C, creating an uncomfortable contradiction where the body overheats internally while the skin is chilled by wind and rain. This increases the risk of both heat stress and hypothermia on longer rides.',
    hourly: [
      { time: '06:00', score: 30, condition: 'unsuitable' },
      { time: '07:00', score: 28, condition: 'unsuitable' },
      { time: '08:00', score: 25, condition: 'unsuitable' },
      { time: '09:00', score: 22, condition: 'unsuitable' },
      { time: '10:00', score: 20, condition: 'unsuitable' },
      { time: '11:00', score: 18, condition: 'unsuitable' },
      { time: '12:00', score: 18, condition: 'unsuitable' },
      { time: '13:00', score: 20, condition: 'unsuitable' },
      { time: '14:00', score: 22, condition: 'unsuitable' },
      { time: '15:00', score: 25, condition: 'unsuitable' },
      { time: '16:00', score: 28, condition: 'unsuitable' },
      { time: '17:00', score: 32, condition: 'unsuitable' },
      { time: '18:00', score: 35, condition: 'unsuitable' },
      { time: '19:00', score: 38, condition: 'marginal' },
      { time: '20:00', score: 35, condition: 'unsuitable' },
      { time: '21:00', score: 30, condition: 'unsuitable' },
    ],
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

    const today = dateNow(location.timeZone)
    const dailyForecasts = generate7DayForecasts(forecast, today)

    for (const dayForecast of dailyForecasts) {
      const forecastValues = {
        locationId: locationResult.id,
        ...dayForecast,
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
    }
    info(`Upserted 7-day forecast for: ${locationResult.name}`)
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
