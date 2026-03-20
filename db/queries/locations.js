import { and, eq, ne, sql } from 'drizzle-orm'
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
      where: ne(locations.source, 'curated'),
    })
    .returning()

  if (row) return row

  // When a curated row already exists at the same lat/lng, the WHERE clause
  // on onConflictDoUpdate prevents the update and RETURNING yields nothing.
  // Fall back to selecting the existing curated row so callers always get a result.
  const [existing] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.latitude, latitude), eq(locations.longitude, longitude)))

  return existing
}

/**
 * Get distinct city slugs from curated locations, sorted alphabetically.
 *
 * @returns {Promise<string[]>} Array of city_slug strings.
 */
export async function getCitySlugs() {
  const rows = await db
    .selectDistinct({ citySlug: locations.citySlug })
    .from(locations)
    .where(eq(locations.source, 'curated'))
    .orderBy(locations.citySlug)

  return rows.map(row => row.citySlug)
}
