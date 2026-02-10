import config from 'config'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  env: {
    BUILD: config.get('build'),
  },
}

export default nextConfig
