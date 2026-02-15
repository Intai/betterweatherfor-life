import { date, integer, jsonb, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { locations } from './locations.js'

export const forecasts = pgTable('forecasts', {
  id: serial('id').primaryKey(),
  locationId: integer('location_id').notNull().references(() => locations.id),
  activity: text('activity').notNull(),
  date: date('date').notNull(),
  timeRange: text('time_range').notNull(),
  score: integer('score').notNull(),
  condition: text('condition').notNull(),
  wind: jsonb('wind'),
  tide: jsonb('tide'),
  water: text('water'),
  temp: text('temp'),
  precipitation: jsonb('precipitation'),
  daylight: jsonb('daylight'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, table => [
  unique('forecasts_location_activity_date_time_range_unique')
    .on(table.locationId, table.activity, table.date, table.timeRange),
])
