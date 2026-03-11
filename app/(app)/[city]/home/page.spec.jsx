import { render, screen } from '@testing-library/react'
import CityHomePage, { generateMetadata } from './page'

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

jest.mock('@/app/(app)/components/time-window-picker', () => {
  return function MockTimeWindowPicker() {
    return <div data-testid="time-window-picker" />
  }
})

jest.mock('@/app/(app)/components/location-list', () => {
  return function MockLocationList() {
    return <div data-testid="location-list" />
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

describe('CityHomePage', () => {
  beforeEach(() => {
    capturedInitialState = undefined
    mockCookies.mockResolvedValue({ getAll: () => [] })
    mockGetForecastsByCity.mockResolvedValue(mockForecast)
  })

  it('should render ActivitySelector, TimeWindowPicker, and LocationList inside ForecastStoreProvider in correct order', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityHomePage({ params })
    render(Page)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const timeWindowPicker = screen.getByTestId('time-window-picker')
    const locationList = screen.getByTestId('location-list')

    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(timeWindowPicker)
    expect(provider).toContainElement(locationList)

    const children = [...provider.children]
    expect(children.indexOf(activitySelector)).toBeLessThan(children.indexOf(timeWindowPicker))
    expect(children.indexOf(timeWindowPicker)).toBeLessThan(children.indexOf(locationList))
  })

  it('should fetch forecasts by city slug and pass them as initialState', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityHomePage({ params })
    render(Page)

    expect(mockGetForecastsByCity).toHaveBeenCalledWith('auckland')
    expect(capturedInitialState).toEqual({ citySlug: 'auckland', forecast: mockForecast, isLoaded: true })
  })

  it('should pass an empty forecast map when the database returns no results', async () => {
    mockGetForecastsByCity.mockResolvedValue({})
    const params = Promise.resolve({ city: 'wellington' })
    const Page = await CityHomePage({ params })
    render(Page)

    expect(mockGetForecastsByCity).toHaveBeenCalledWith('wellington')
    expect(capturedInitialState).toEqual({ citySlug: 'wellington', forecast: {}, isLoaded: true  })
  })

  it('should include preference cookies in initialState', async () => {
    mockCookies.mockResolvedValue({ getAll: () => [{ name: 'selectedActivity', value: 'kayaking' }] })
    const params = Promise.resolve({ city: 'auckland' })
    const Page = await CityHomePage({ params })
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
    expect(result.title).toBe('New Plymouth - Best Outdoor Spots')
  })

  it('should return correct description', async () => {
    const params = Promise.resolve({ city: 'auckland' })
    const result = await generateMetadata({ params })
    expect(result.description).toBe('Find the best spots for SUP, kayaking, snorkeling, and cycling in Auckland based on current weather and sea conditions.')
  })

  it('should return openGraph metadata', async () => {
    const params = Promise.resolve({ city: 'wellington' })
    const result = await generateMetadata({ params })
    expect(result.openGraph.title).toBe('Wellington - Best Outdoor Spots')
    expect(result.openGraph.description).toBe('Find the best spots for SUP, kayaking, snorkeling, and cycling in Wellington based on current weather and sea conditions.')
  })
})
