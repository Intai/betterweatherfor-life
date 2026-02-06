import LandingPage, { metadata } from './page'

describe('LandingPage', () => {
  it('should render null', () => {
    expect(LandingPage()).toBe(null)
  })
})

describe('metadata', () => {
  it('should have correct title and description', () => {
    expect(metadata.title).toBe('Find Your Perfect Outdoor Day')
    expect(metadata.description).toBe('Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions.')
  })

  it('should have openGraph metadata', () => {
    expect(metadata.openGraph.title).toBe('Find Your Perfect Outdoor Day')
    expect(metadata.openGraph.description).toBe('Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions.')
  })
})
