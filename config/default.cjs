module.exports = {
  build: process.env.BUILD || '0.0.0',
  database: {
    url: process.env.DATABASE_URL || 'postgres://betterweather:betterweather@localhost:5432/betterweather',
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  logging: {
    level: process.env.LOGGING_LEVEL || 'debug',
  },
}
