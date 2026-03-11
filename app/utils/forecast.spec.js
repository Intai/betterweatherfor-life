import { buildForecastKey, buildLocationKey, extractCityLocations, extractLocationKey, findBestHour, splitLocationKey } from './forecast'

describe('buildLocationKey', () => {
  it('should return a "lat,lng" string', () => {
    expect(buildLocationKey(51.5, -0.1)).toBe('51.5,-0.1')
  })

  it('should preserve a coordinate of 0', () => {
    expect(buildLocationKey(0, 0)).toBe('0,0')
  })
})

describe('splitLocationKey', () => {
  it('should parse a standard "lat,lng" string into [lat, lng] numbers', () => {
    expect(splitLocationKey('51.5,-0.1')).toEqual([51.5, -0.1])
  })

  it('should handle negative coordinates', () => {
    expect(splitLocationKey('-36.8547,-174.8317')).toEqual([-36.8547, -174.8317])
  })

  it('should handle zero coordinates', () => {
    expect(splitLocationKey('0,0')).toEqual([0, 0])
  })
})

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

describe('findBestHour', () => {
  it('should return null for null input', () => {
    expect(findBestHour(null)).toBeNull()
  })

  it('should return undefined for undefined input', () => {
    expect(findBestHour(undefined)).toBeUndefined()
  })

  it('should return null for an empty array', () => {
    expect(findBestHour([])).toBeNull()
  })

  it('should return the hour with the highest score', () => {
    const hourly = [
      { time: '7am', score: 70 },
      { time: '8am', score: 92 },
      { time: '9am', score: 85 },
    ]
    expect(findBestHour(hourly)).toEqual({ time: '8am', score: 92 })
  })

  it('should return the last occurrence on tie', () => {
    const hourly = [
      { time: '7am', score: 80 },
      { time: '8am', score: 80 },
    ]
    expect(findBestHour(hourly)).toEqual({ time: '8am', score: 80 })
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
