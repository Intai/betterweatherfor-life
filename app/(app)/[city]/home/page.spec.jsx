import { render, screen } from '@testing-library/react'
import CityHomePage, { generateMetadata } from './page'

jest.mock('@/app/utils/date', () => ({
  formatForecastDate: () => '2026-02-12',
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

describe('CityHomePage', () => {
  beforeEach(() => {
    capturedInitialState = undefined
  })

  it('should render ActivitySelector, TimeWindowPicker, and LocationList inside ForecastStoreProvider in correct order', () => {
    render(<CityHomePage />)

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

  it('should pass initialState with 3 forecast entries to ForecastStoreProvider', () => {
    render(<CityHomePage />)

    expect(capturedInitialState).toBeDefined()
    expect(Object.keys(capturedInitialState.forecast)).toHaveLength(3)
    expect(capturedInitialState.forecast).toHaveProperty(['sup;2026-02-12;all-day;-36.8547,174.8317'])
    expect(capturedInitialState.forecast).toHaveProperty(['sup;2026-02-12;all-day;-36.7878,174.7768'])
    expect(capturedInitialState.forecast).toHaveProperty(['sup;2026-02-12;all-day;-36.8508,174.8593'])
  })

  it('should return correct title and description from generateMetadata', async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ city: 'new-plymouth' }) })

    expect(metadata.title).toBe('New Plymouth - Best Outdoor Spots')
    expect(metadata.description).toBe(
      'Find the best spots for SUP, kayaking, snorkeling, and cycling in New Plymouth based on current weather and sea conditions.',
    )
  })
})
