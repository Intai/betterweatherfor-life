import config from 'config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  env: {
    BUILD: config.get('build'),
    LOGGING_LEVEL: config.get('logging.level'),
  },
}

export default nextConfig
