import { act } from 'react'
import { render, screen } from '@testing-library/react'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: (...args) => mockUseForecastStore(...args),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const lookupKey = params?.context ? `${key}_${params.context}` : key
      const labels = {
        'home.timeWindow.today': 'Today',
        'home.timeWindow.today_withRange': `Today: ${params?.range || ''}`,
        'home.timeWindow.tomorrow': 'Tomorrow',
        'home.timeWindow.tomorrow_withRange': `Tomorrow: ${params?.range || ''}`,
        'home.timeWindow.allDay': 'All day',
        'home.timeWindow.morning': 'Morning',
        'home.timeWindow.afternoon': 'Afternoon',
        'home.timeWindow.evening': 'Evening',
      }
      return labels[lookupKey] || key
    },
  }),
}))

jest.mock('lucide-react', () => ({
  ChevronDown: props => <svg data-testid="chevron-down" {...props} />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, variant, ...props }) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
}))

let dropdownMenuInstances = []
let dropdownRadioGroupInstances = []
jest.mock('@/shadcn/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children, open, onOpenChange, ...props }) => {
    dropdownMenuInstances.push({ open, onOpenChange })
    return <div data-testid="dropdown-menu" data-open={open} {...props}>{children}</div>
  },
  DropdownMenuTrigger: ({ children }) => (
    <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children, ...props }) => (
    <div data-testid="dropdown-content" {...props}>{children}</div>
  ),
  DropdownMenuRadioGroup: ({ children, onValueChange, value, ...props }) => {
    dropdownRadioGroupInstances.push({ onValueChange, value })
    return (
      <div data-testid="dropdown-radio-group" data-value={value} {...props}>
        {children}
      </div>
    )
  },
  DropdownMenuRadioItem: ({ children, value, ...props }) => (
    <button data-testid={`dropdown-radio-item-${value}`} data-value={value} {...props}>{children}</button>
  ),
}))

import { AFTERNOON, ALL_DAY, EVENING, MORNING, TODAY, TOMORROW } from '@/app/(app)/constants'
import TimeWindowPickerMenu from './time-window-picker-menu'

describe('TimeWindowPickerMenu', () => {
  function setupStore(overrides = {}) {
    const state = {
      selectedDay: TODAY,
      selectedTimeRange: ALL_DAY,
      setDay: jest.fn(),
      setTimeRange: jest.fn(),
      ...overrides,
    }
    mockUseForecastStore.mockImplementation(selector => selector(state))
    return state
  }

  beforeEach(() => {
    dropdownMenuInstances = []
    dropdownRadioGroupInstances = []
  })

  it('should show today with range and chevron when today is selected', () => {
    setupStore({ selectedDay: TODAY, selectedTimeRange: ALL_DAY })
    render(<TimeWindowPickerMenu day={TODAY} />)
    const todayButton = screen.getByTestId('today-button')
    expect(todayButton).toHaveTextContent('Today: All day')
    expect(todayButton.querySelector('[data-testid="chevron-down"]')).toBeInTheDocument()
    expect(todayButton).toHaveAttribute('data-variant', 'default')
  })

  it('should show tomorrow without range when today is selected', () => {
    setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerMenu day={TOMORROW} />)
    const tomorrowButton = screen.getByTestId('tomorrow-button')
    expect(tomorrowButton).toHaveTextContent('Tomorrow')
    expect(tomorrowButton.querySelector('[data-testid="chevron-down"]')).not.toBeInTheDocument()
    expect(tomorrowButton).toHaveAttribute('data-variant', 'secondary')
  })

  it('should show tomorrow with range and chevron when tomorrow is selected', () => {
    setupStore({ selectedDay: TOMORROW, selectedTimeRange: MORNING })
    render(<TimeWindowPickerMenu day={TOMORROW} />)
    const tomorrowButton = screen.getByTestId('tomorrow-button')
    expect(tomorrowButton).toHaveTextContent('Tomorrow: Morning')
    expect(tomorrowButton.querySelector('[data-testid="chevron-down"]')).toBeInTheDocument()
    expect(tomorrowButton).toHaveAttribute('data-variant', 'default')
  })

  it('should show today without range when tomorrow is selected', () => {
    setupStore({ selectedDay: TOMORROW })
    render(<TimeWindowPickerMenu day={TODAY} />)
    const todayButton = screen.getByTestId('today-button')
    expect(todayButton).toHaveTextContent('Today')
    expect(todayButton.querySelector('[data-testid="chevron-down"]')).not.toBeInTheDocument()
    expect(todayButton).toHaveAttribute('data-variant', 'secondary')
  })

  it('should call setDay when today dropdown opens', () => {
    const state = setupStore({ selectedDay: TOMORROW })
    render(<TimeWindowPickerMenu day={TODAY} />)
    const dropdown = dropdownMenuInstances[0]
    act(() => {
      dropdown.onOpenChange(true)
    })
    expect(state.setDay).toHaveBeenCalledWith(TODAY)
  })

  it('should call setDay when tomorrow dropdown opens', () => {
    const state = setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerMenu day={TOMORROW} />)
    const dropdown = dropdownMenuInstances[0]
    act(() => {
      dropdown.onOpenChange(true)
    })
    expect(state.setDay).toHaveBeenCalledWith(TOMORROW)
  })

  it('should not call setDay when dropdown closes', () => {
    const state = setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerMenu day={TODAY} />)
    const dropdown = dropdownMenuInstances[0]
    act(() => {
      dropdown.onOpenChange(false)
    })
    expect(state.setDay).not.toHaveBeenCalled()
  })

  it('should render dropdown time range options', () => {
    setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerMenu day={TODAY} />)
    expect(screen.getByTestId('dropdown-radio-item-all-day')).toHaveTextContent('All day')
    expect(screen.getByTestId('dropdown-radio-item-morning')).toHaveTextContent('Morning')
    expect(screen.getByTestId('dropdown-radio-item-afternoon')).toHaveTextContent('Afternoon')
    expect(screen.getByTestId('dropdown-radio-item-evening')).toHaveTextContent('Evening')
  })

  it('should show today with evening range', () => {
    setupStore({ selectedDay: TODAY, selectedTimeRange: EVENING })
    render(<TimeWindowPickerMenu day={TODAY} />)
    expect(screen.getByTestId('today-button')).toHaveTextContent('Today: Evening')
  })

  it('should show today with afternoon range', () => {
    setupStore({ selectedDay: TODAY, selectedTimeRange: AFTERNOON })
    render(<TimeWindowPickerMenu day={TODAY} />)
    expect(screen.getByTestId('today-button')).toHaveTextContent('Today: Afternoon')
  })

  it('should call setTimeRange when dropdown radio group value changes', () => {
    const state = setupStore({ selectedDay: TODAY })
    render(<TimeWindowPickerMenu day={TODAY} />)
    const radioGroup = dropdownRadioGroupInstances[0]
    radioGroup.onValueChange(MORNING)
    expect(state.setTimeRange).toHaveBeenCalledWith(MORNING)
  })

  it('should call setTimeRange with evening for tomorrow', () => {
    const state = setupStore({ selectedDay: TOMORROW })
    render(<TimeWindowPickerMenu day={TOMORROW} />)
    const radioGroup = dropdownRadioGroupInstances[0]
    radioGroup.onValueChange(EVENING)
    expect(state.setTimeRange).toHaveBeenCalledWith(EVENING)
  })
})
