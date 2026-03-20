const mockReturning = jest.fn()
const mockOnConflictDoUpdate = jest.fn(() => ({ returning: mockReturning }))
const mockValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }))
const mockInsert = jest.fn(() => ({ values: mockValues }))

const mockOrderBy = jest.fn()
const mockDistinctWhere = jest.fn(() => ({ orderBy: mockOrderBy }))
const mockSelectDistinctFrom = jest.fn(() => ({ where: mockDistinctWhere }))
const mockSelectDistinct = jest.fn(() => ({ from: mockSelectDistinctFrom }))

const mockSelectWhere = jest.fn()
const mockSelectFrom = jest.fn(() => ({ where: mockSelectWhere }))
const mockSelect = jest.fn(() => ({ from: mockSelectFrom }))

jest.mock('@/db', () => ({
  __esModule: true,
  default: {
    insert: mockInsert,
    select: mockSelect,
    selectDistinct: mockSelectDistinct,
  },
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn((...args) => ({ and: args })),
  eq: jest.fn((col, val) => ({ col, val })),
  ne: jest.fn((col, val) => ({ col, val })),
  sql: jest.fn(strings => strings.join('')),
}))

const { and, eq, ne, sql } = require('drizzle-orm')
const { locations } = require('@/db/schema/locations')
const { upsertLocation, getCitySlugs } = require('./locations')

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
      where: ne(locations.source, 'curated'),
    })
    expect(mockReturning).toHaveBeenCalledWith()
  })

  it('should return the existing row when a curated location blocks the update', async () => {
    const input = {
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      citySlug: 'auckland',
      latitude: '-36.8547',
      longitude: '174.8317',
      timeZone: 'Pacific/Auckland',
      source: 'geocoded',
    }
    const existingRow = { id: 1, ...input, source: 'curated' }
    mockReturning.mockResolvedValue([])
    mockSelectWhere.mockResolvedValue([existingRow])

    const result = await upsertLocation(input)

    expect(result).toEqual(existingRow)
    expect(mockSelect).toHaveBeenCalledWith()
    expect(mockSelectFrom).toHaveBeenCalledWith(locations)
    expect(mockSelectWhere).toHaveBeenCalledWith(
      and(eq(locations.latitude, '-36.8547'), eq(locations.longitude, '174.8317')),
    )
  })
})

describe('getCitySlugs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return a sorted flat array of distinct city slugs from curated locations', async () => {
    mockOrderBy.mockResolvedValue([
      { citySlug: 'auckland' },
      { citySlug: 'wellington' },
    ])

    const result = await getCitySlugs()

    expect(result).toEqual(['auckland', 'wellington'])
    expect(mockSelectDistinct).toHaveBeenCalledWith({ citySlug: locations.citySlug })
    expect(mockSelectDistinctFrom).toHaveBeenCalledWith(locations)
    expect(mockDistinctWhere).toHaveBeenCalledWith(eq(locations.source, 'curated'))
    expect(mockOrderBy).toHaveBeenCalledWith(locations.citySlug)
  })

  it('should return an empty array when no curated locations exist', async () => {
    mockOrderBy.mockResolvedValue([])
    const result = await getCitySlugs()
    expect(result).toEqual([])
  })
})
