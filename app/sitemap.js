/**
 * Dynamic sitemap generation for marketing routes.
 * Returns sitemap entries for all pre-defined cities and locations.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap() {
  return [{
    url: 'https://betterweatherfor.life',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  }, {
    url: 'https://betterweatherfor.life/about',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }, {
    url: 'https://betterweatherfor.life/privacy',
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }, {
    url: 'https://betterweatherfor.life/auckland/home',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }, {
    url: 'https://betterweatherfor.life/auckland/forecase',
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }]
}
