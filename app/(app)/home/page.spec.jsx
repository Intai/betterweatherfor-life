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

describe('HomePage', () => {
  it('should render ActivitySelector and TimeWindowPicker inside ForecastStoreProvider', () => {
    render(<HomePage />)

    const provider = screen.getByTestId('forecast-store-provider')
    const activitySelector = screen.getByTestId('activity-selector')
    const timeWindowPicker = screen.getByTestId('time-window-picker')

    // Both components are children of the store provider
    expect(provider).toContainElement(activitySelector)
    expect(provider).toContainElement(timeWindowPicker)
    // ActivitySelector renders before TimeWindowPicker in DOM order
    const children = [...provider.children]
    expect(children.indexOf(activitySelector)).toBeLessThan(children.indexOf(timeWindowPicker))
  })
})
