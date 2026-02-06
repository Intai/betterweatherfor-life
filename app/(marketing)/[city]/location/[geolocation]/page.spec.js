import LocationDetailPage, { generateMetadata } from './page'

describe('LocationDetailPage', () => {
  it('should render null', () => {
    expect(LocationDetailPage()).toBe(null)
  })
})

describe('generateMetadata', () => {
  it('should return correct title with city and geolocation', async () => {
    const params = Promise.resolve({ city: 'new-plymouth', geolocation: '-39.0556,174.0752' })
    const result = await generateMetadata({ params })
    expect(result.title).toBe('New Plymouth -39.0556,174.0752')
  })

  it('should return correct description', async () => {
    const params = Promise.resolve({ city: 'auckland', geolocation: '-36.8485,174.7633' })
    const result = await generateMetadata({ params })
    expect(result.description).toBe('Current weather, tide, and sea conditions for outdoor activities in Auckland.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ city: 'wellington', geolocation: '-41.2865,174.7762' })
    const result = await generateMetadata({ params })
    expect(result.openGraph.title).toBe('Wellington -41.2865,174.7762')
    expect(result.openGraph.description).toBe('Current weather, tide, and sea conditions for outdoor activities in Wellington.')
  })
})
