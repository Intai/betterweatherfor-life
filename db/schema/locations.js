import { index, numeric, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  area: text('area').notNull(),
  citySlug: text('city_slug').notNull(),
  latitude: numeric('latitude').notNull(),
  longitude: numeric('longitude').notNull(),
  timeZone: text('time_zone').notNull(),
  source: text('source').notNull().default('curated'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, table => [
  index('locations_city_slug_idx').on(table.citySlug),
  uniqueIndex('locations_lat_lng_idx').on(table.latitude, table.longitude),
])
