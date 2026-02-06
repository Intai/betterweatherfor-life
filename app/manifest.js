/**
 * PWA Web App Manifest for app installability.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest() {
  return {
    name: 'Better Weather For Life',
    short_name: 'BetterWeatherFor',
    description: 'Find the best places for outdoor activities based on weather, tide, and sea conditions.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    icons: [{
      src: '/favicon.ico',
      sizes: 'any',
      type: 'image/x-icon',
    }],
  }
}
