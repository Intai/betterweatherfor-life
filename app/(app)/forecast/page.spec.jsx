import { render, screen } from '@testing-library/react'
import ForecastPage from './page'

const mockCookies = jest.fn()
jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
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

describe('ForecastPage', () => {
  beforeEach(() => {
    capturedInitialState = undefined
    mockCookies.mockResolvedValue({ getAll: () => [] })
  })

  it('should render ActivitySelector and ForecastDayList inside ForecastStoreProvider', async () => {
    const Page = await ForecastPage()
    render(Page)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const forecastDayList = screen.getByTestId('forecast-day-list')
    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(forecastDayList)
  })

  it('should pass parsed preference cookies as initialState', async () => {
    mockCookies.mockResolvedValue({ getAll: () => [{ name: 'selectedActivity', value: 'kayaking' }] })
    const Page = await ForecastPage()
    render(Page)

    expect(capturedInitialState).toEqual({ selectedActivity: 'kayaking' })
  })
})
