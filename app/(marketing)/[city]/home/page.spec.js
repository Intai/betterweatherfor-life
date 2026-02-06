import CityHomePage, { generateMetadata } from './page'

describe('CityHomePage', () => {
  it('should render null', () => {
    expect(CityHomePage()).toBe(null)
  })
})

describe('generateMetadata', () => {
  it('should return correct title with deslugified city name', async () => {
    const params = Promise.resolve({ city: 'new-plymouth' })
    const result = await generateMetadata({ params })
    expect(result.title).toBe('New Plymouth - Best Outdoor Spots')
  })

  it('should return correct description', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const result = await generateMetadata({ params })
    expect(result.description).toBe('Find the best spots for SUP, kayaking, snorkeling, and cycling in Auckland based on current weather and sea conditions.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ city: 'wellington' })
    const result = await generateMetadata({ params })
    expect(result.openGraph.title).toBe('Wellington - Best Outdoor Spots')
    expect(result.openGraph.description).toBe('Find the best spots for SUP, kayaking, snorkeling, and cycling in Wellington based on current weather and sea conditions.')
  })
})
