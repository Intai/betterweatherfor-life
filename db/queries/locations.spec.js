const mockReturning = jest.fn()
const mockOnConflictDoUpdate = jest.fn(() => ({ returning: mockReturning }))
const mockValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }))
const mockInsert = jest.fn(() => ({ values: mockValues }))

jest.mock('@/db', () => ({
  __esModule: true,
  default: { insert: mockInsert },
}))

jest.mock('drizzle-orm', () => ({
  sql: jest.fn(strings => strings.join('')),
}))

const { sql } = require('drizzle-orm')
const { locations } = require('@/db/schema/locations')
const { upsertLocation } = require('./locations')

describe('upsertLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should insert a location with onConflictDoUpdate on lat/lng and return the upserted row', async () => {
    const input = {
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      citySlug: 'auckland',
      latitude: '-36.8547',
      longitude: '174.8317',
      timeZone: 'Pacific/Auckland',
      source: 'curated',
    }
    const upsertedRow = { id: 1, ...input }
    mockReturning.mockResolvedValue([upsertedRow])

    const result = await upsertLocation(input)

    expect(result).toEqual(upsertedRow)
    expect(mockInsert).toHaveBeenCalledWith(locations)
    expect(mockValues).toHaveBeenCalledWith({
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      citySlug: 'auckland',
      latitude: '-36.8547',
      longitude: '174.8317',
      timeZone: 'Pacific/Auckland',
      source: 'curated',
    })
    expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
      target: [locations.latitude, locations.longitude],
      set: {
        name: 'Mission Bay',
        area: 'Beach, Auckland Central',
        citySlug: 'auckland',
        timeZone: 'Pacific/Auckland',
        source: 'curated',
        updatedAt: sql`now()`,
      },
    })
    expect(mockReturning).toHaveBeenCalledWith()
  })
})
