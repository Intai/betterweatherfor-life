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

  it('should purge then upsert three Auckland locations with forecasts and exit cleanly on success', async () => {
    // 6 for module-level seed() call (3 locations + 3 forecasts)
    // + 6 for explicit seed() call (3 locations + 3 forecasts)
    mockReturning
      .mockResolvedValueOnce([{ id: 1, name: 'Mission Bay' }])
      .mockResolvedValueOnce([{ id: 1, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 2, name: 'Takapuna Beach' }])
      .mockResolvedValueOnce([{ id: 2, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 3, name: 'St Heliers Bay' }])
      .mockResolvedValueOnce([{ id: 3, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 1, name: 'Mission Bay' }])
      .mockResolvedValueOnce([{ id: 1, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 2, name: 'Takapuna Beach' }])
      .mockResolvedValueOnce([{ id: 2, activity: 'sup' }])
      .mockResolvedValueOnce([{ id: 3, name: 'St Heliers Bay' }])
      .mockResolvedValueOnce([{ id: 3, activity: 'sup' }])

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
      ],
      forecasts: [
        { id: 1, activity: 'sup' },
        { id: 2, activity: 'sup' },
        { id: 3, activity: 'sup' },
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
