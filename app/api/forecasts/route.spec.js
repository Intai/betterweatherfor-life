import { GET } from './route'
import { getForecastsByLocations } from '@/db/queries/forecasts'

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}))

jest.mock('@/db/queries/forecasts', () => ({
  getForecastsByLocations: jest.fn(),
}))

describe('GET /api/forecasts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return validation error when locations param is missing', async () => {
    const request = { url: 'http://localhost/api/forecasts' }
    const result = await GET(request)

    expect(result.status).toBe(400)
    expect(await result.json()).toEqual({ error: expect.objectContaining({ fieldErrors: expect.any(Object) }) })
    expect(getForecastsByLocations).not.toHaveBeenCalled()
  })

  it('should parse locations, call getForecastsByLocations, and return the forecast map', async () => {
    const mockForecasts = { 'sup;2026-02-14;all-day;51.5,-0.1': { score: 85 } }
    getForecastsByLocations.mockResolvedValue(mockForecasts)

    const request = { url: 'http://localhost/api/forecasts?locations=51.5,-0.1;48.8,2.3' }
    const result = await GET(request)

    expect(getForecastsByLocations).toHaveBeenCalledWith([
      [51.5, -0.1],
      [48.8, 2.3],
    ])
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual(mockForecasts)
  })
})
