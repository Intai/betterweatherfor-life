import { sql } from 'drizzle-orm'
import db from '../index.js'
import { locations } from '../schema/locations.js'

/**
 * Insert a location or update it when a row with the same latitude and
 * longitude already exists.
 *
 * @param {object} location
 * @param {string} location.name - Display name of the location.
 * @param {string} location.area - Area description (e.g. "Beach, North Shore").
 * @param {string} location.citySlug - Slug used to group locations by city.
 * @param {string} location.latitude - Latitude as a numeric string.
 * @param {string} location.longitude - Longitude as a numeric string.
 * @param {string} location.timeZone - IANA time zone identifier.
 * @param {string} location.source - Origin of the location data.
 * @returns {Promise<object>} The upserted location row.
 */
export async function upsertLocation({ name, area, citySlug, latitude, longitude, timeZone, source }) {
  const [row] = await db
    .insert(locations)
    .values({ name, area, citySlug, latitude, longitude, timeZone, source })
    .onConflictDoUpdate({
      target: [locations.latitude, locations.longitude],
      set: {
        name,
        area,
        citySlug,
        timeZone,
        source,
        updatedAt: sql`now()`,
      },
    })
    .returning()

  return row
}
