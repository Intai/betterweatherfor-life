import { buildForecastKey, extractCityLocations, extractLocationKey } from './forecast'

describe('buildForecastKey', () => {
  it('should return a full forecast key when coordinates are provided', () => {
    expect(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
      .toBe('sup;2026-02-11;all-day;-36.8547,174.8317')
  })

  it('should return a prefix when coordinates are omitted', () => {
    expect(buildForecastKey('sup', '2026-02-11', 'all-day'))
      .toBe('sup;2026-02-11;all-day')
  })
})

describe('extractLocationKey', () => {
  it('should extract the location key from a forecast key', () => {
    expect(extractLocationKey('sup;2026-02-11;all-day;-36.8547,174.8317'))
      .toBe('-36.8547,174.8317')
  })
})

describe('extractCityLocations', () => {
  it('should extract unique locations from a forecast map', () => {
    const forecast = {
      'sup;2026-03-01;all-day;-36.8,174.8': { name: 'A', area: 'Coast', timeZone: 'Pacific/Auckland', score: 80, wind: 5, tide: 1 },
      'kayaking;2026-03-01;all-day;-36.8,174.8': { name: 'A', area: 'Coast', timeZone: 'Pacific/Auckland', score: 70 },
      'sup;2026-03-01;all-day;-37.0,175.0': { name: 'B', area: 'Bay', timeZone: 'Pacific/Auckland', score: 60 },
    }
    expect(extractCityLocations(forecast)).toEqual({
      '-36.8,174.8': { name: 'A', area: 'Coast', timeZone: 'Pacific/Auckland', latitude: -36.8, longitude: 174.8 },
      '-37.0,175.0': { name: 'B', area: 'Bay', timeZone: 'Pacific/Auckland', latitude: -37, longitude: 175 },
    })
  })

  it('should return an empty object for an empty forecast', () => {
    expect(extractCityLocations({})).toEqual({})
  })
})
