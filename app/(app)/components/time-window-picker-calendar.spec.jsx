import { act } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { AFTERNOON, ALL_DAY, EVENING, MORNING, PICK_DATE, TODAY } from '@/app/(app)/constants'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: (...args) => mockUseForecastStore(...args),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const lookupKey = params?.context ? `${key}_${params.context}` : key
      const labels = {
        'home.timeWindow.pickDate': 'Pick date',
        'home.timeWindow.allDay': 'All day',
        'home.timeWindow.morning': 'Morning',
        'home.timeWindow.afternoon': 'Afternoon',
        'home.timeWindow.evening': 'Evening',
      }
      return labels[lookupKey] || key
    },
  }),
}))

jest.mock('@/app/utils/date', () => ({
  formatShortDate: date => {
    const d = new Date(date)
    const day = d.getDate()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${months[d.getMonth()]}`
  },
}))

jest.mock('lucide-react', () => ({
  ChevronDown: props => <svg data-testid="chevron-down" {...props} />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, variant, ...props }) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
}))

let popoverInstances = []
jest.mock('@/shadcn/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange, ...props }) => {
    popoverInstances.push({ open, onOpenChange })
    return <div data-testid="popover" data-open={open} {...props}>{children}</div>
  },
  PopoverTrigger: ({ children }) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children, ...props }) => (
    <div data-testid="popover-content" {...props}>{children}</div>
  ),
}))

let radioGroupInstances = []

jest.mock('@/shadcn/components/ui/calendar', () => ({
  Calendar: ({ onSelect, selected: _selected, startMonth, endMonth, disabled, ...props }) => (
    <div
      data-testid="pick-date-calendar"
      data-has-on-select={onSelect ? 'true' : 'false'}
      data-has-start-month={startMonth ? 'true' : 'false'}
      data-has-end-month={endMonth ? 'true' : 'false'}
      data-has-disabled={disabled ? 'true' : 'false'}
      {...props}
    >
      <button data-testid="calendar-select" onClick={() => onSelect(new Date('2026-02-15'))}>
        Select 15 Feb
      </button>
    </div>
  ),
}))

jest.mock('@/shadcn/components/ui/radio-group', () => ({
  RadioGroup: ({ children, onValueChange, value, ...props }) => {
    radioGroupInstances.push({ onValueChange, value })
    return (
      <div
        data-testid="pick-date-radio-group"
        data-value={value}
        {...props}
      >
        {children}
      </div>
    )
  },
  RadioGroupItem: ({ value, ...props }) => (
    <input type="radio" data-testid={`radio-item-${value}`} data-value={value} {...props} />
  ),
}))

import TimeWindowPickerCalendar from './time-window-picker-calendar'

describe('TimeWindowPickerCalendar', () => {
  function setupStore(overrides = {}) {
    const state = {
      selectedDay: TODAY,
      selectedDate: null,
      selectedTimeRange: ALL_DAY,
      setDay: jest.fn(),
      setDate: jest.fn(),
      setTimeRange: jest.fn(),
      ...overrides,
    }
    mockUseForecastStore.mockImplementation(selector => selector(state))
    return state
  }

  beforeEach(() => {
    popoverInstances = []
    radioGroupInstances = []
  })

  it('should show pick date without date when no date is selected', () => {
    setupStore({ selectedDay: PICK_DATE, selectedDate: null })
    render(<TimeWindowPickerCalendar />)
    const pickDateButton = screen.getByTestId('pick-date-button')
    expect(pickDateButton).toHaveTextContent('Pick date')
  })

  it('should show formatted date with time range when pick-date has a date', () => {
    setupStore({
      selectedDay: PICK_DATE,
      selectedDate: new Date('2026-02-10'),
      selectedTimeRange: MORNING,
    })
    render(<TimeWindowPickerCalendar />)
    const pickDateButton = screen.getByTestId('pick-date-button')
    expect(pickDateButton).toHaveTextContent('10 Feb: Morning')
    expect(pickDateButton.querySelector('[data-testid="chevron-down"]')).toBeInTheDocument()
    expect(pickDateButton).toHaveAttribute('data-variant', 'default')
  })

  it('should show pick date label with all-day range', () => {
    setupStore({
      selectedDay: PICK_DATE,
      selectedDate: new Date('2026-02-14'),
      selectedTimeRange: ALL_DAY,
    })
    render(<TimeWindowPickerCalendar />)
    expect(screen.getByTestId('pick-date-button')).toHaveTextContent('14 Feb: All day')
  })

  it('should call setDay when pick-date popover opens', () => {
    const state = setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerCalendar />)
    const pickDatePopover = popoverInstances[0]
    act(() => {
      pickDatePopover.onOpenChange(true)
    })
    expect(state.setDay).toHaveBeenCalledWith(PICK_DATE)
  })

  it('should not call setDay when popover closes', () => {
    const state = setupStore({ selectedDay: PICK_DATE })
    render(<TimeWindowPickerCalendar />)
    const pickDatePopover = popoverInstances[0]
    act(() => {
      pickDatePopover.onOpenChange(false)
    })
    expect(state.setDay).not.toHaveBeenCalled()
  })

  it('should render calendar in pick-date popover', () => {
    setupStore({ selectedDay: PICK_DATE })
    render(<TimeWindowPickerCalendar />)
    const calendar = screen.getByTestId('pick-date-calendar')
    expect(calendar).toBeInTheDocument()
    expect(calendar).toHaveAttribute('data-has-on-select', 'true')
    expect(calendar).toHaveAttribute('data-has-start-month', 'true')
    expect(calendar).toHaveAttribute('data-has-end-month', 'true')
    expect(calendar).toHaveAttribute('data-has-disabled', 'true')
  })

  it('should render radio group in pick-date popover', () => {
    setupStore({ selectedDay: PICK_DATE, selectedTimeRange: AFTERNOON })
    render(<TimeWindowPickerCalendar />)
    const radioGroup = screen.getByTestId('pick-date-radio-group')
    expect(radioGroup).toBeInTheDocument()
    expect(radioGroup).toHaveAttribute('data-value', AFTERNOON)
    expect(screen.getByTestId('radio-item-all-day')).toBeInTheDocument()
    expect(screen.getByTestId('radio-item-morning')).toBeInTheDocument()
    expect(screen.getByTestId('radio-item-afternoon')).toBeInTheDocument()
    expect(screen.getByTestId('radio-item-evening')).toBeInTheDocument()
  })

  it('should call setDate when a calendar date is selected', () => {
    const state = setupStore({ selectedDay: PICK_DATE })
    render(<TimeWindowPickerCalendar />)
    fireEvent.click(screen.getByTestId('calendar-select'))
    expect(state.setDate).toHaveBeenCalledWith(new Date('2026-02-15'))
  })

  it('should show pick date as secondary when not selected', () => {
    setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerCalendar />)
    expect(screen.getByTestId('pick-date-button')).toHaveAttribute('data-variant', 'secondary')
  })

  it('should show pick date with evening range', () => {
    setupStore({
      selectedDay: PICK_DATE,
      selectedDate: new Date('2026-02-20'),
      selectedTimeRange: EVENING,
    })
    render(<TimeWindowPickerCalendar />)
    expect(screen.getByTestId('pick-date-button')).toHaveTextContent('20 Feb: Evening')
  })

  it('should show pick date with afternoon range', () => {
    setupStore({
      selectedDay: PICK_DATE,
      selectedDate: new Date('2026-02-12'),
      selectedTimeRange: AFTERNOON,
    })
    render(<TimeWindowPickerCalendar />)
    expect(screen.getByTestId('pick-date-button')).toHaveTextContent('12 Feb: Afternoon')
  })

  it('should call setTimeRange when pick-date radio group value changes', () => {
    const state = setupStore({ selectedDay: PICK_DATE })
    render(<TimeWindowPickerCalendar />)
    const pickDateRadioGroup = radioGroupInstances[0]
    pickDateRadioGroup.onValueChange(AFTERNOON)
    expect(state.setTimeRange).toHaveBeenCalledWith(AFTERNOON)
  })
})
