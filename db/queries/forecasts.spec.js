const mockWhere = jest.fn()
const mockInnerJoin = jest.fn(() => ({ where: mockWhere }))
const mockFrom = jest.fn(() => ({ innerJoin: mockInnerJoin }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

jest.mock('@/db', () => ({
  __esModule: true,
  default: { select: mockSelect },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((a, b) => ({ op: 'eq', a, b })),
}))

const { eq } = require('drizzle-orm')
const { forecasts } = require('@/db/schema/forecasts')
const { locations } = require('@/db/schema/locations')
const { getForecastsByCity } = require('./forecasts')

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
      },
      'kayaking;2026-02-15;morning;-36.7878,174.7768': {
        name: 'Takapuna Beach',
        area: 'Beach, North Shore',
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
