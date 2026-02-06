/**
 * Robots.txt configuration.
 * Allows crawling of marketing/city routes but blocks app routes.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://betterweatherfor.life'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/home', '/forecast', '/location/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
