import manifest from './manifest'

describe('manifest', () => {
  it('should return PWA manifest structure', () => {
    const result = manifest()
    expect(result.name).toBe('Better Weather For Life')
    expect(result.short_name).toBe('BetterWeatherFor')
    expect(result.description).toBe('Find the best places for outdoor activities based on weather, tide, and sea conditions.')
    expect(result.start_url).toBe('/home')
  })

  it('should have standalone display mode', () => {
    const result = manifest()
    expect(result.display).toBe('standalone')
    expect(result.background_color).toBe('#ffffff')
    expect(result.theme_color).toBe('#0ea5e9')
  })

  it('should have icons array', () => {
    const result = manifest()
    expect(Array.isArray(result.icons)).toBe(true)
    expect(result.icons[0]).toEqual({
      src: '/favicon.ico',
      sizes: 'any',
      type: 'image/x-icon',
    })
  })
})
