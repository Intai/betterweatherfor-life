import { find } from 'geo-tz'
import { POST } from './route'
import { upsertLocation } from '@/db/queries/locations'

jest.mock('geo-tz', () => ({
  find: jest.fn(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}))

jest.mock('@/db/queries/locations', () => ({
  upsertLocation: jest.fn(),
}))

describe('POST /api/locations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return validation error when fields are invalid', async () => {
    const request = { json: jest.fn().mockResolvedValue({ name: 'Test' }) }
    const result = await POST(request)

    expect(result.status).toBe(400)
    expect(await result.json()).toEqual({ error: expect.objectContaining({ fieldErrors: expect.any(Object) }) })
    expect(upsertLocation).not.toHaveBeenCalled()
  })

  it('should derive timezone, upsert location, and return the result', async () => {
    find.mockReturnValue(['Australia/Sydney'])
    upsertLocation.mockResolvedValue({
      id: 1,
      name: 'Bondi Beach',
      area: 'Eastern Suburbs',
      citySlug: 'sydney',
      latitude: -33.89,
      longitude: 151.27,
      timeZone: 'Australia/Sydney',
      source: 'geocoded',
    })

    const request = {
      json: jest.fn().mockResolvedValue({
        name: 'Bondi Beach',
        area: 'Eastern Suburbs',
        citySlug: 'sydney',
        latitude: -33.89,
        longitude: 151.27,
      }),
    }
    const result = await POST(request)

    expect(find).toHaveBeenCalledWith(-33.89, 151.27)
    expect(upsertLocation).toHaveBeenCalledWith({
      name: 'Bondi Beach',
      area: 'Eastern Suburbs',
      citySlug: 'sydney',
      latitude: -33.89,
      longitude: 151.27,
      timeZone: 'Australia/Sydney',
      source: 'geocoded',
    })
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({
      name: 'Bondi Beach',
      area: 'Eastern Suburbs',
      latitude: -33.89,
      longitude: 151.27,
      timeZone: 'Australia/Sydney',
    })
  })
})
