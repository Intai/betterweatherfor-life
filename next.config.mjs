import config from 'config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BUILD: config.get('build'),
  },
}

export default nextConfig
