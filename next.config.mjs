import config from 'config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  env: {
    BUILD: config.get('build'),
    GOOGLE_MAPS_API_KEY: config.get('googleMaps.apiKey'),
    LOGGING_LEVEL: config.get('logging.level'),
  },
}

export default nextConfig
