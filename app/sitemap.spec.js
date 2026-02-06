import { propEq } from 'ramda'
import sitemap from './sitemap'

describe('sitemap', () => {
  it('should have required fields for each entry', () => {
    const result = sitemap()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
    result.forEach((entry) => {
      expect(entry).toHaveProperty('url')
      expect(entry).toHaveProperty('lastModified')
      expect(entry.lastModified).toBeInstanceOf(Date)
      expect(entry).toHaveProperty('changeFrequency')
      expect(entry).toHaveProperty('priority')
    })
  })

  it('should have root URL with priority 1', () => {
    const result = sitemap()
    const rootEntry = result.find(propEq('https://betterweatherfor.life', 'url'))
    expect(rootEntry).toBeDefined()
    expect(rootEntry.priority).toBe(1)
    expect(rootEntry.changeFrequency).toBe('daily')
  })

  it('should include about and privacy pages', () => {
    const result = sitemap()
    const aboutEntry = result.find(propEq('https://betterweatherfor.life/about', 'url'))
    const privacyEntry = result.find(propEq('https://betterweatherfor.life/privacy', 'url'))
    expect(aboutEntry.changeFrequency).toBe('daily')
    expect(privacyEntry.changeFrequency).toBe('daily')
  })

  it('should include city routes', () => {
    const result = sitemap()
    const cityHomeEntry = result.find(propEq('https://betterweatherfor.life/auckland/home', 'url'))
    const cityForecastEntry = result.find(propEq('https://betterweatherfor.life/auckland/forecase', 'url'))
    expect(cityHomeEntry.changeFrequency).toBe('hourly')
    expect(cityForecastEntry.changeFrequency).toBe('hourly')
  })
})
