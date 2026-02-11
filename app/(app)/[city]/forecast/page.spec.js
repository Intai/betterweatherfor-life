import CityForecastPage, { generateMetadata } from './page'

describe('CityForecastPage', () => {
  it('should render null', () => {
    expect(CityForecastPage()).toBe(null)
  })
})

describe('generateMetadata', () => {
  it('should return correct title with deslugified city name', async () => {
    const params = Promise.resolve({ city: 'new-plymouth' })
    const result = await generateMetadata({ params })
    expect(result.title).toBe('New Plymouth 7-Day Forecast')
  })

  it('should return correct description', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const result = await generateMetadata({ params })
    expect(result.description).toBe('7-day weather, tide, and sea conditions forecast for outdoor activities in Auckland.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ city: 'wellington' })
    const result = await generateMetadata({ params })
    expect(result.openGraph.title).toBe('Wellington 7-Day Forecast')
    expect(result.openGraph.description).toBe('7-day weather, tide, and sea conditions forecast for outdoor activities in Wellington.')
  })
})
