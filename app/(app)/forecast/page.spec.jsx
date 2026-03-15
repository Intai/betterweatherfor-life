import { render, screen } from '@testing-library/react'
import ForecastPage from './page'

jest.mock('@/app/(app)/stores/forecast-store', () => ({
  ForecastStoreProvider: ({ children }) => <div data-testid="forecast-store-provider">{children}</div>,
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
  it('should render ActivitySelector and ForecastDayList inside ForecastStoreProvider', () => {
    render(<ForecastPage />)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const forecastDayList = screen.getByTestId('forecast-day-list')
    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(forecastDayList)
  })
})
