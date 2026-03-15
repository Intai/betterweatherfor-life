import { render, screen } from '@testing-library/react'
import CityForecastPage, { generateMetadata } from './page'

const mockCookies = jest.fn()
jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

const mockGetForecastsByCity = jest.fn()
jest.mock('@/db/queries/forecasts', () => ({
  getForecastsByCity: (...args) => mockGetForecastsByCity(...args),
}))

let capturedInitialState
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  ForecastStoreProvider: ({ children, initialState }) => {
    capturedInitialState = initialState
    return <div data-testid="forecast-store-provider">{children}</div>
  },
}))

jest.mock('@/app/(app)/components/activity-selector', () => {
  return function MockActivitySelector() {
    return <div data-testid="activity-selector" />
  }
})

jest.mock('@/app/(app)/components/forecast-day-list', () => {
  return function MockForecastDayList() {
    return <div data-testid="forecast-day-list" />
  }
})

describe('CityForecastPage', () => {
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

  beforeEach(() => {
    capturedInitialState = undefined
    mockCookies.mockResolvedValue({ getAll: () => [] })
    mockGetForecastsByCity.mockResolvedValue(mockForecast)
  })

  it('should render ActivitySelector and ForecastDayList inside ForecastStoreProvider', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityForecastPage({ params })
    render(Page)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const forecastDayList = screen.getByTestId('forecast-day-list')
    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(forecastDayList)
  })

  it('should fetch forecasts by city slug and pass them as initialState', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityForecastPage({ params })
    render(Page)

    expect(mockGetForecastsByCity).toHaveBeenCalledWith('auckland')
    expect(capturedInitialState).toEqual({ citySlug: 'auckland', forecast: mockForecast, isLoaded: true })
  })

  it('should pass an empty forecast map when the database returns no results', async () => {
    mockGetForecastsByCity.mockResolvedValue({})
    const params = Promise.resolve({ city: 'wellington' })
    const Page = await CityForecastPage({ params })
    render(Page)

    expect(mockGetForecastsByCity).toHaveBeenCalledWith('wellington')
    expect(capturedInitialState).toEqual({ citySlug: 'wellington', forecast: {}, isLoaded: true })
  })

  it('should include preference cookies in initialState', async () => {
    mockCookies.mockResolvedValue({ getAll: () => [{ name: 'selectedActivity', value: 'kayaking' }] })
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityForecastPage({ params })
    render(Page)

    expect(capturedInitialState).toEqual({
      selectedActivity: 'kayaking',
      citySlug: 'auckland',
      forecast: mockForecast,
      isLoaded: true,
    })
  })
})

describe('generateMetadata', () => {
  it('should return correct title with deslugified city name', async () => {
    const params = Promise.resolve({ city: 'new-plymouth' })
    const result = await generateMetadata({ params })
    expect(result.title).toBe('New Plymouth 7-Day Forecast')
  })

  it('should return correct description', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const result = await generateMetadata({ params })
    expect(result.description).toBe('7-day weather, tide, and sea conditions forecast for outdoor activities in Auckland.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ city: 'wellington' })
    const result = await generateMetadata({ params })
    expect(result.openGraph.title).toBe('Wellington 7-Day Forecast')
    expect(result.openGraph.description).toBe('7-day weather, tide, and sea conditions forecast for outdoor activities in Wellington.')
  })
})
