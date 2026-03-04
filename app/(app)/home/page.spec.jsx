import { render, screen } from '@testing-library/react'
import HomePage from './page'

jest.mock('@/app/(app)/stores/forecast-store', () => ({
  ForecastStoreProvider: ({ children }) => <div data-testid="forecast-store-provider">{children}</div>,
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

describe('HomePage', () => {
  it('should render ActivitySelector, TimeWindowPicker, and LocationList inside ForecastStoreProvider', () => {
    render(<HomePage />)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const timeWindowPicker = screen.getByTestId('time-window-picker')
    const locationList = screen.getByTestId('location-list')

    // All components are children of the store provider
    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(timeWindowPicker)
    expect(provider).toContainElement(locationList)
    // Components render in correct DOM order
    const children = [...provider.children]
    expect(children.indexOf(activitySelector)).toBeLessThan(children.indexOf(timeWindowPicker))
    expect(children.indexOf(timeWindowPicker)).toBeLessThan(children.indexOf(locationList))
  })
})
