import config from 'config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(config.get('database.url'))
const db = drizzle({ client })

export default db
