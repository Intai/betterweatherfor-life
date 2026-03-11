const mockWhere = jest.fn()
const mockInnerJoin = jest.fn(() => ({ where: mockWhere }))
const mockFrom = jest.fn(() => ({ innerJoin: mockInnerJoin }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

jest.mock('@/db', () => ({
  __esModule: true,
  default: { select: mockSelect },
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args) => ({ op: 'and', args })),
  eq: jest.fn((a, b) => ({ op: 'eq', a, b })),
  or: jest.fn((...args) => ({ op: 'or', args })),
}))

const { and, eq, or } = require('drizzle-orm')
const { forecasts } = require('@/db/schema/forecasts')
const { locations } = require('@/db/schema/locations')
const { getForecastsByCity, getForecastsByLocations } = require('./forecasts')

describe('getForecastsByCity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should join forecasts with locations, filter by citySlug, and return the store-shaped map', async () => {
    const rows = [{
      forecasts: {
        activity: 'sup',
        date: '2026-02-14',
        timeRange: 'all-day',
        score: 85,
        condition: 'ideal',
        wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
        tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
        water: 'Green',
        temp: '22\u00B0C',
        precipitation: null,
        daylight: null,
        summary: 'Light onshore breeze.',
        uv: { index: 4, condition: 'ideal' },
        humidity: null,
        visibility: null,
        analysis: 'Good conditions.',
        hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
      },
      locations: {
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        latitude: '-36.8547',
        longitude: '174.8317',
        timeZone: 'Pacific/Auckland',
      },
    }, {
      forecasts: {
        activity: 'kayaking',
        date: '2026-02-15',
        timeRange: 'morning',
        score: 62,
        condition: 'acceptable',
        wind: { speed: '12km/h', direction: 'SW', condition: 'acceptable' },
        tide: { state: 'Rising', percentage: 50, condition: 'acceptable' },
        water: 'Green',
        temp: '21\u00B0C',
        precipitation: { chance: 10 },
        daylight: { sunrise: '06:30', sunset: '20:15' },
        summary: 'Offshore wind component.',
        uv: { index: 6, condition: 'acceptable' },
        humidity: null,
        visibility: null,
        analysis: 'Moderate wind.',
        hourly: [{ time: '08:00', score: 60, condition: 'acceptable' }],
      },
      locations: {
        name: 'Takapuna Beach',
        area: 'Beach, North Shore',
        latitude: '-36.7878',
        longitude: '174.7768',
        timeZone: 'Pacific/Auckland',
      },
    }]

    mockWhere.mockResolvedValue(rows)

    const result = await getForecastsByCity('auckland')

    expect(mockSelect).toHaveBeenCalledWith()
    expect(mockFrom).toHaveBeenCalledWith(forecasts)
    expect(mockInnerJoin).toHaveBeenCalledWith(locations, eq(forecasts.locationId, locations.id))
    expect(mockWhere).toHaveBeenCalledWith(eq(locations.citySlug, 'auckland'))
    expect(result).toEqual({
      'sup;2026-02-14;all-day;-36.8547,174.8317': {
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        latitude: '-36.8547',
        longitude: '174.8317',
        timeZone: 'Pacific/Auckland',
        score: 85,
        condition: 'ideal',
        wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
        tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
        water: 'Green',
        temp: '22\u00B0C',
        precipitation: null,
        daylight: null,
        summary: 'Light onshore breeze.',
        uv: { index: 4, condition: 'ideal' },
        humidity: null,
        visibility: null,
        analysis: 'Good conditions.',
        hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
      },
      'kayaking;2026-02-15;morning;-36.7878,174.7768': {
        name: 'Takapuna Beach',
        area: 'Beach, North Shore',
        latitude: '-36.7878',
        longitude: '174.7768',
        timeZone: 'Pacific/Auckland',
        score: 62,
        condition: 'acceptable',
        wind: { speed: '12km/h', direction: 'SW', condition: 'acceptable' },
        tide: { state: 'Rising', percentage: 50, condition: 'acceptable' },
        water: 'Green',
        temp: '21\u00B0C',
        precipitation: { chance: 10 },
        daylight: { sunrise: '06:30', sunset: '20:15' },
        summary: 'Offshore wind component.',
        uv: { index: 6, condition: 'acceptable' },
        humidity: null,
        visibility: null,
        analysis: 'Moderate wind.',
        hourly: [{ time: '08:00', score: 60, condition: 'acceptable' }],
      },
    })
  })

  it('should return an empty object when no forecasts match the city', async () => {
    mockWhere.mockResolvedValue([])
    const result = await getForecastsByCity('wellington')
    expect(mockWhere).toHaveBeenCalledWith(eq(locations.citySlug, 'wellington'))
    expect(result).toEqual({})
  })
})

describe('getForecastsByLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return an empty object when latLngPairs is empty', async () => {
    const result = await getForecastsByLocations([])
    expect(mockSelect).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('should return an empty object when latLngPairs is undefined', async () => {
    const result = await getForecastsByLocations(undefined)
    expect(mockSelect).not.toHaveBeenCalled()
    expect(result).toEqual({})
  })

  it('should join forecasts with locations, filter by lat/lng pairs, and return the store-shaped map', async () => {
    const rows = [{
      forecasts: {
        activity: 'sup',
        date: '2026-02-14',
        timeRange: 'all-day',
        score: 85,
        condition: 'ideal',
        wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
        tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
        water: 'Green',
        temp: '22\u00B0C',
        precipitation: null,
        daylight: null,
        summary: 'Light onshore breeze.',
        uv: { index: 4, condition: 'ideal' },
        humidity: null,
        visibility: null,
        analysis: 'Good conditions.',
        hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
      },
      locations: {
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        latitude: '-36.8547',
        longitude: '174.8317',
        timeZone: 'Pacific/Auckland',
      },
    }]

    mockWhere.mockResolvedValue(rows)

    const result = await getForecastsByLocations([
      ['-36.8547', '174.8317'],
      ['-36.7878', '174.7768'],
    ])

    expect(mockSelect).toHaveBeenCalledWith()
    expect(mockFrom).toHaveBeenCalledWith(forecasts)
    expect(mockInnerJoin).toHaveBeenCalledWith(locations, eq(forecasts.locationId, locations.id))
    expect(mockWhere).toHaveBeenCalledWith(or(
      and(eq(locations.latitude, '-36.8547'), eq(locations.longitude, '174.8317')),
      and(eq(locations.latitude, '-36.7878'), eq(locations.longitude, '174.7768')),
    ))
    expect(result).toEqual({
      'sup;2026-02-14;all-day;-36.8547,174.8317': {
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        latitude: '-36.8547',
        longitude: '174.8317',
        timeZone: 'Pacific/Auckland',
        score: 85,
        condition: 'ideal',
        wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
        tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
        water: 'Green',
        temp: '22\u00B0C',
        precipitation: null,
        daylight: null,
        summary: 'Light onshore breeze.',
        uv: { index: 4, condition: 'ideal' },
        humidity: null,
        visibility: null,
        analysis: 'Good conditions.',
        hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
      },
    })
  })
})
