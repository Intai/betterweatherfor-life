import { render, screen } from '@testing-library/react'

jest.mock('./time-window-picker-menu', () => {
  return function MockTimeWindowPickerMenu({ day }) {
    return <div data-testid={`${day}-menu`} />
  }
})

jest.mock('./time-window-picker-calendar', () => {
  return function MockTimeWindowPickerCalendar() {
    return <div data-testid="pick-date-calendar" />
  }
})

import TimeWindowPicker from './time-window-picker'

describe('TimeWindowPicker', () => {
  it('should render today menu, tomorrow menu and pick-date-calendar', () => {
    render(<TimeWindowPicker />)
    expect(screen.getByTestId('today-menu')).toBeInTheDocument()
    expect(screen.getByTestId('tomorrow-menu')).toBeInTheDocument()
    expect(screen.getByTestId('pick-date-calendar')).toBeInTheDocument()
  })
})
