import { render, screen } from '@testing-library/react'
import LocationDetailPage, { generateMetadata } from './page'

const mockCookies = jest.fn()
jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

const mockGetForecastsByLocations = jest.fn()
jest.mock('@/db/queries/forecasts', () => ({
  getForecastsByLocations: (...args) => mockGetForecastsByLocations(...args),
}))

let capturedInitialState
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  ForecastStoreProvider: ({ children, initialState }) => {
    capturedInitialState = initialState
    return <div data-testid="forecast-store-provider">{children}</div>
  },
}))

jest.mock('@/app/(app)/components/location-detail', () => {
  return function MockLocationDetail({ geolocation }) {
    return <div data-testid="location-detail" data-geolocation={geolocation} />
  }
})

const mockForecast = {
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
}

describe('LocationDetailPage', () => {
  beforeEach(() => {
    capturedInitialState = undefined
    mockCookies.mockResolvedValue({ getAll: () => [] })
    mockGetForecastsByLocations.mockResolvedValue(mockForecast)
  })

  it('should render LocationDetail inside ForecastStoreProvider with correct props and initialState', async () => {
    const params = Promise.resolve({ name: 'mission-bay', geolocation: '-36.8547%2C174.8317' })
    const Page = await LocationDetailPage({ params })
    render(Page)

    const provider = screen.getByTestId('forecast-store-provider')
    const detail = screen.getByTestId('location-detail')
    expect(provider).toContainElement(detail)
    expect(detail).toHaveAttribute('data-geolocation', '-36.8547,174.8317')
    expect(mockGetForecastsByLocations).toHaveBeenCalledWith([[-36.8547, 174.8317]])
    expect(capturedInitialState).toEqual({ forecast: mockForecast, isLoaded: true })
  })

  it('should pass an empty forecast map when the database returns no results', async () => {
    mockGetForecastsByLocations.mockResolvedValue({})
    const params = Promise.resolve({ name: 'unknown-spot', geolocation: '0,0' })
    const Page = await LocationDetailPage({ params })
    render(Page)

    expect(mockGetForecastsByLocations).toHaveBeenCalledWith([[0, 0]])
    expect(capturedInitialState).toEqual({ forecast: {}, isLoaded: true })
  })

  it('should include preference cookies in initialState', async () => {
    mockCookies.mockResolvedValue({ getAll: () => [{ name: 'selectedActivity', value: 'kayaking' }] })
    const params = Promise.resolve({ name: 'mission-bay', geolocation: '-36.8547%2C174.8317' })
    const Page = await LocationDetailPage({ params })
    render(Page)

    expect(capturedInitialState).toEqual({
      selectedActivity: 'kayaking',
      forecast: mockForecast,
      isLoaded: true,
    })
  })
})

describe('generateMetadata', () => {
  it('should return correct title and description with deslugified name', async () => {
    const params = Promise.resolve({ name: 'mission-bay', geolocation: '-36.8547,174.8317' })
    const result = await generateMetadata({ params })

    expect(result.title).toBe('Mission Bay - Weather & Conditions')
    expect(result.description).toBe('View detailed weather, tide, and sea conditions for Mission Bay. Find the best time for SUP, kayaking, snorkeling, and cycling.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ name: 'long-bay-beach', geolocation: '-36.6969,174.7544' })
    const result = await generateMetadata({ params })

    expect(result.openGraph.title).toBe('Long Bay Beach - Weather & Conditions')
    expect(result.openGraph.description).toBe('View detailed weather, tide, and sea conditions for Long Bay Beach. Find the best time for SUP, kayaking, snorkeling, and cycling.')
  })
})
