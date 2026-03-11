const mockReturning = jest.fn()
const mockOnConflictDoUpdate = jest.fn(() => ({ returning: mockReturning }))
const mockValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }))
const mockInsert = jest.fn(() => ({ values: mockValues }))
const mockDelete = jest.fn(() => Promise.resolve())

jest.mock('@/db', () => ({
  __esModule: true,
  default: { insert: mockInsert, delete: mockDelete },
}))

jest.mock('drizzle-orm', () => ({
  sql: jest.fn(strings => strings.join('')),
}))

jest.mock('@/app/utils/date', () => ({
  dateNow: jest.fn(() => new Date('2026-02-15T00:00:00')),
  formatISODate: jest.fn(() => '2026-02-15'),
}))

jest.mock('@/app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

describe('db/seed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should purge then upsert five Auckland locations with forecasts and exit cleanly on success', async () => {
    // 10 for module-level seed() call (5 locations + 5 forecasts)
    // + 10 for explicit seed() call (5 locations + 5 forecasts)
    mockReturning
      .mockResolvedValueOnce([{ id: 1, name: 'Mission Bay' }])
      .mockResolvedValueOnce([{ id: 1, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 2, name: 'Takapuna Beach' }])
      .mockResolvedValueOnce([{ id: 2, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 3, name: 'St Heliers Bay' }])
      .mockResolvedValueOnce([{ id: 3, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 4, name: 'Goat Island' }])
      .mockResolvedValueOnce([{ id: 4, activity: 'snorkelling' }])
      .mockResolvedValueOnce([{ id: 5, name: 'Piha Beach' }])
      .mockResolvedValueOnce([{ id: 5, activity: 'cycling' }])
      .mockResolvedValueOnce([{ id: 1, name: 'Mission Bay' }])
      .mockResolvedValueOnce([{ id: 1, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 2, name: 'Takapuna Beach' }])
      .mockResolvedValueOnce([{ id: 2, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 3, name: 'St Heliers Bay' }])
      .mockResolvedValueOnce([{ id: 3, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 4, name: 'Goat Island' }])
      .mockResolvedValueOnce([{ id: 4, activity: 'snorkelling' }])
      .mockResolvedValueOnce([{ id: 5, name: 'Piha Beach' }])
      .mockResolvedValueOnce([{ id: 5, activity: 'cycling' }])

    const { seed } = require('./seed')
    const { locations } = require('@/db/schema/locations')
    const { forecasts } = require('@/db/schema/forecasts')
    // Wait for the module-level seed() promise to settle
    await new Promise(resolve => setTimeout(resolve, 0))

    const results = await seed()

    expect(results).toEqual({
      locations: [
        { id: 1, name: 'Mission Bay' },
        { id: 2, name: 'Takapuna Beach' },
        { id: 3, name: 'St Heliers Bay' },
        { id: 4, name: 'Goat Island' },
        { id: 5, name: 'Piha Beach' },
      ],
      forecasts: [
        { id: 1, activity: 'sup' },
        { id: 2, activity: 'sup' },
        { id: 3, activity: 'sup' },
        { id: 4, activity: 'snorkelling' },
        { id: 5, activity: 'cycling' },
      ],
    })
    expect(mockInsert).toHaveBeenCalledWith(locations)
    expect(mockInsert).toHaveBeenCalledWith(forecasts)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        citySlug: 'auckland',
        latitude: '-36.8547',
        longitude: '174.8317',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Takapuna Beach',
        area: 'Beach, North Shore',
        citySlug: 'auckland',
        latitude: '-36.7878',
        longitude: '174.7768',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'St Heliers Bay',
        area: 'Beach, East Auckland',
        citySlug: 'auckland',
        latitude: '-36.8508',
        longitude: '174.8593',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        date: '2026-02-15',
        activity: 'sup',
        timeRange: 'all-day',
        score: 85,
        condition: 'ideal',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 2,
        date: '2026-02-15',
        activity: 'sup',
        timeRange: 'all-day',
        score: 62,
        condition: 'acceptable',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 3,
        date: '2026-02-15',
        activity: 'sup',
        timeRange: 'all-day',
        score: 58,
        condition: 'marginal',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Goat Island',
        area: 'Marine Reserve, Leigh',
        citySlug: 'auckland',
        latitude: '-36.2675',
        longitude: '174.7936',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 4,
        date: '2026-02-15',
        activity: 'snorkelling',
        timeRange: 'all-day',
        score: 68,
        condition: 'acceptable',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Piha Beach',
        area: 'Beach, West Auckland',
        citySlug: 'auckland',
        latitude: '-36.9553',
        longitude: '174.4681',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      })
    )
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 5,
        date: '2026-02-15',
        activity: 'cycling',
        timeRange: 'all-day',
        score: 25,
        condition: 'unsuitable',
      })
    )
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: [locations.latitude, locations.longitude],
      set: expect.objectContaining({
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
      }),
    })
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
      set: expect.objectContaining({
        score: 85,
        condition: 'ideal',
        uv: { index: 4, condition: 'ideal', summary: 'Moderate UV. Sun protection recommended for extended sessions.' },
        humidity: null,
        visibility: null,
        analysis: expect.stringContaining('Flat water and light winds'),
        daylight: { sunset: '19:42', condition: 'ideal', summary: 'Sunset at 7:42 PM. Plenty of daylight for a full session.' },
        hourly: expect.arrayContaining([
          expect.objectContaining({ time: '06:00', score: 72, condition: 'acceptable' }),
          expect.objectContaining({ time: '09:00', score: 90, condition: 'ideal' }),
          expect.objectContaining({ time: '14:00', score: 65, condition: 'acceptable' }),
        ]),
      }),
    })
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
      set: expect.objectContaining({
        score: 68,
        condition: 'acceptable',
        visibility: { estimate: '6m', condition: 'acceptable', summary: 'Light swell slightly reduces clarity. Expect 5-8m visibility.' },
        tide: expect.objectContaining({ nextHigh: '11:15', nextLow: '17:30' }),
        humidity: null,
        daylight: { sunset: '19:38', condition: 'ideal', summary: 'Sunset at 7:38 PM. Good daylight window for snorkelling.' },
        analysis: expect.stringContaining('Goat Island Marine Reserve'),
      }),
    })
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
      set: expect.objectContaining({
        score: 25,
        condition: 'unsuitable',
        wind: expect.objectContaining({ speed: '42km/h', gust: '58km/h', condition: 'unsuitable' }),
        precipitation: expect.objectContaining({ amount: '4.2mm', chance: '95%', condition: 'unsuitable' }),
        tide: null,
        water: null,
        humidity: expect.objectContaining({ percentage: '94%', condition: 'unsuitable' }),
        daylight: expect.objectContaining({ civilTwilightEnd: '20:45', condition: 'ideal' }),
        visibility: null,
        analysis: expect.stringContaining('Piha Beach is completely unsuitable'),
      }),
    })
    expect(mockDelete).toHaveBeenCalledWith(forecasts)
    expect(mockDelete).toHaveBeenCalledWith(locations)
    const deleteForecastsOrder = mockDelete.mock.invocationCallOrder[
      mockDelete.mock.calls.findIndex(call => call[0] === forecasts)
    ]
    const deleteLocationsOrder = mockDelete.mock.invocationCallOrder[
      mockDelete.mock.calls.findIndex(call => call[0] === locations)
    ]
    const firstInsertOrder = mockInsert.mock.invocationCallOrder[0]
    expect(deleteForecastsOrder).toBeLessThan(deleteLocationsOrder)
    expect(deleteLocationsOrder).toBeLessThan(firstInsertOrder)
    expect(mockExit).toHaveBeenCalledWith(0)
  })

  it('should exit with code 1 when seed fails', async () => {
    mockDelete.mockRejectedValueOnce(new Error('DB error'))
    require('./seed')
    // Wait for the top-level promise chain to reject and handle
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockExit).toHaveBeenCalledWith(1)
  })
})
