As an outdoor enthusiast, I want location forecasts to be stored in a database so that weather scores stay up to date and new locations can be added over time.

## Requirements

- Add PostgreSQL 18 service to Docker Compose with health check and persistent volume.
- Use Drizzle ORM with the postgres (porsager) driver for database access.
- Create a `locations` table for curated outdoor spots (id, name, area, city_slug, latitude, longitude, time_zone, source, created_at, updated_at).
- Create a `forecasts` table for scored weather data per location/activity/date/time_range, with JSONB columns for wind, tide, precipitation, and daylight.
- Unique constraint on (location_id, activity, date, time_range) in forecasts.
- Seed 3 curated Auckland locations: Mission Bay, Takapuna Beach, St Heliers Bay.
- Create an update-forecasts script that runs Claude CLI per location with interpolated coordinates to generate and insert forecast data.
- Replace hardcoded mock data in the city home page with a database query, transforming rows to match the existing store shape so downstream components require zero changes.
- Add Makefile commands: db-migrate, db-seed, db-forecast, db-studio.

## Schema

### `locations`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | text, not null | "Mission Bay" |
| area | text, not null | "Beach, Auckland Central" |
| city_slug | text, not null | URL slug: "auckland" |
| latitude | numeric, not null | -36.8547 |
| longitude | numeric, not null | 174.8317 |
| time_zone | text, not null | "Pacific/Auckland" |
| source | text, not null | "curated" or "geocoded" (default: "curated") |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

Index on `city_slug`.

### `forecasts`

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| location_id | integer FK | references locations.id |
| activity | text, not null | sup, kayaking, snorkelling, cycling |
| date | date, not null | forecast date |
| time_range | text, not null | all-day, morning, afternoon, evening |
| score | integer, not null | 0-100 |
| condition | text, not null | ideal, acceptable, marginal, unsuitable |
| wind | jsonb | `{ speed, direction, condition }` |
| tide | jsonb | `{ state, percentage, condition }` |
| water | text | Green, Orange, Red, Black |
| temp | text | "22°C" |
| precipitation | jsonb | `{ amount, score, condition }` |
| daylight | jsonb | `{ sunset, condition }` |
| summary | text | |
| created_at | timestamp | default now() |
| updated_at | timestamp | default now() |

Unique constraint on `(location_id, activity, date, time_range)`.

## File Structure

```
db/
  index.js              - Database connection (postgres driver)
  schema/
    locations.js        - Drizzle schema for locations table
    forecasts.js        - Drizzle schema for forecasts table
    index.js            - Re-export all schemas
  queries/
    forecasts.js        - Query functions (getForecastsByCity)
  seed.js               - Seed curated locations
  update-forecasts.js   - Update forecasts per location via Claude CLI
drizzle.config.js       - Drizzle Kit configuration
.env.example            - Template with DATABASE_URL
```

## Tasks

**Parallel tasks 1-8:**

1. Use backend-developer subagent to add PostgreSQL service to @docker-compose.yml. Image postgres:18-alpine, port 5432, named volume for data persistence, health check, web service depends_on with condition service_healthy. Add DATABASE_URL to web service environment.
2. Use backend-developer subagent to install drizzle-orm, postgres as dependencies and drizzle-kit as dev dependency.
3. Use backend-developer subagent to create database connection @db/index.js. Use postgres driver reading DATABASE_URL from environment, export drizzle instance.
4. Use backend-developer subagent to create Drizzle schema for locations table @db/schema/locations.js. Columns: id (serial PK), name, area, city_slug (indexed), latitude (numeric), longitude (numeric), time_zone, source (default 'curated'), created_at, updated_at.
5. Use backend-developer subagent to configure Drizzle Kit @drizzle.config.js. Point to schema files, configure migration output directory.
6. Use backend-developer subagent to create @.env.example with DATABASE_URL=postgres://betterweather:betterweather@localhost:5432/betterweather.
7. Use backend-developer subagent to add Makefile commands @Makefile. db-migrate (drizzle-kit push), db-seed (node db/seed.js), db-forecast (node db/update-forecasts.js), db-studio (drizzle-kit studio).
8. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/initial-database.feature.

**Sequential tasks 9-10 after task 4 completes:**

9. Use backend-developer subagent to create Drizzle schema for forecasts table @db/schema/forecasts.js. Columns: id (serial PK), location_id (FK to locations), activity, date, time_range, score, condition, wind (jsonb), tide (jsonb), water, temp, precipitation (jsonb), daylight (jsonb), summary, created_at, updated_at. Unique constraint on (location_id, activity, date, time_range).
10. Use backend-developer subagent to create schema re-export @db/schema/index.js.

**Parallel after tasks 3, 4 complete:**

11. Use backend-developer subagent to create seed script @db/seed.js. Upsert 3 curated Auckland locations: Mission Bay (-36.8547, 174.8317, Beach Auckland Central), Takapuna Beach (-36.7878, 174.7768, Beach North Shore), St Heliers Bay (-36.8508, 174.8593, Beach East Auckland). All with city_slug='auckland', time_zone='Pacific/Auckland', source='curated'.

**Sequential task 12 after tasks 3, 10 complete:**

12. Use backend-developer subagent to create query function getForecastsByCity(citySlug) @db/queries/forecasts.js. Join forecasts with locations, filter by city_slug, transform rows to existing store shape keyed by `activity;date;timeRange;lat,lng` using buildForecastKey from @app/utils/forecast.js.

**Parallel after task 12 completes:**

13. Use backend-developer subagent to create forecast update script @db/update-forecasts.js. Query all locations from DB, loop through each, build prompt string with coordinates interpolated based on @app/(app)/docs/ai-forecast-prompt.md, run Claude CLI with --output-format json, parse output and upsert into forecasts table.
14. Use backend-developer subagent to update @app/(app)/[city]/home/page.jsx. Import getForecastsByCity, fetch forecasts using city param as citySlug, pass as initialState to ForecastStoreProvider, remove hardcoded mock data.
