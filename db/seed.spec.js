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
  formatISODate: jest.fn(date => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }),
}))

jest.mock('@/app/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}))

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

describe('db/seed', () => {
  const locationsCount = 6
  const daysPerLocation = 7
  const forecastsPerSeed = locationsCount * daysPerLocation

  function setupMockReturning() {
    const locationNames = ['Mission Bay', 'Takapuna Beach', 'St Heliers Bay', 'Goat Island', 'Piha Beach', 'Bondi Beach']
    const activities = ['sup', 'sup', 'sup', 'snorkelling', 'cycling', 'kayaking']

    for (let i = 0; i < locationNames.length; i++) {
      // Location insert
      mockReturning.mockResolvedValueOnce([{ id: i + 1, name: locationNames[i] }])
      // 7 forecast inserts per location
      for (let d = 0; d < daysPerLocation; d++) {
        mockReturning.mockResolvedValueOnce([{ id: i * daysPerLocation + d + 1, activity: activities[i] }])
      }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('should purge then upsert all locations with 7-day forecasts and exit cleanly on success', async () => {
    // Two rounds: module-level seed() + explicit seed()
    setupMockReturning()
    setupMockReturning()

    const { seed } = require('./seed')
    const { locations } = require('@/db/schema/locations')
    const { forecasts } = require('@/db/schema/forecasts')
    // Wait for the module-level seed() promise to settle
    await new Promise(resolve => setTimeout(resolve, 0))

    const results = await seed()

    expect(results.locations).toHaveLength(locationsCount)
    expect(results.locations).toEqual([
      { id: 1, name: 'Mission Bay' },
      { id: 2, name: 'Takapuna Beach' },
      { id: 3, name: 'St Heliers Bay' },
      { id: 4, name: 'Goat Island' },
      { id: 5, name: 'Piha Beach' },
      { id: 6, name: 'Bondi Beach' },
    ])
    expect(results.forecasts).toHaveLength(forecastsPerSeed)

    // Verify location inserts
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

    // Verify Day 1 (today) forecast for Mission Bay uses template values
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

    // Verify Day 4 (best day, +10 offset) for Mission Bay
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        date: '2026-02-18',
        activity: 'sup',
        score: 95,
        condition: 'ideal',
      })
    )

    // Verify Day 6 (worst day, -45 offset) for Mission Bay creates unsuitable
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        date: '2026-02-20',
        activity: 'sup',
        score: 40,
        condition: 'marginal',
      })
    )

    // Verify 7 different dates for Mission Bay (Day 1 through Day 7)
    for (let d = 0; d < daysPerLocation; d++) {
      const expectedDate = `2026-02-${String(15 + d).padStart(2, '0')}`
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          locationId: 1,
          date: expectedDate,
          activity: 'sup',
        })
      )
    }

    // Verify Takapuna Day 6 (-45 offset from 62) is unsuitable
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 2,
        date: '2026-02-20',
        activity: 'sup',
        score: 17,
        condition: 'unsuitable',
      })
    )

    // Verify Day 1 for Goat Island snorkelling
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

    // Verify Day 1 for Piha cycling
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

    // Verify hourly data varies: Day 4 Mission Bay hourly should have shifted scores
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        locationId: 1,
        date: '2026-02-18',
        hourly: expect.arrayContaining([
          expect.objectContaining({ condition: 'ideal' }),
        ]),
      })
    )

    // Verify purge order: forecasts before locations, both before inserts
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
