import config from 'config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/index.js',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.get('database.url'),
  },
})
