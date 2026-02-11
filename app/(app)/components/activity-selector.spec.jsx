import { fireEvent, render, screen } from '@testing-library/react'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

jest.mock('@/app/(app)/constants', () => ({
  ACTIVITIES: ['sup', 'kayaking', 'snorkelling', 'cycling'],
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, variant, ...props }) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
}))

import ActivitySelector from './activity-selector'

describe('ActivitySelector', () => {
  let mockSetActivity

  beforeEach(() => {
    mockSetActivity = jest.fn()
    mockUseForecastStore.mockImplementation(selector => {
      const state = {
        selectedActivity: 'sup',
        setActivity: mockSetActivity,
      }
      return selector(state)
    })
  })

  it('should render all four activity pill buttons with correct variants and classes', () => {
    render(<ActivitySelector />)

    const sup = screen.getByTestId('activity-sup')
    const kayaking = screen.getByTestId('activity-kayaking')
    const snorkelling = screen.getByTestId('activity-snorkelling')
    const cycling = screen.getByTestId('activity-cycling')

    expect(sup).toHaveTextContent('sup')
    expect(kayaking).toHaveTextContent('kayaking')
    expect(snorkelling).toHaveTextContent('snorkelling')
    expect(cycling).toHaveTextContent('cycling')

    expect(sup).toHaveAttribute('data-variant', 'default')
    expect(kayaking).toHaveAttribute('data-variant', 'secondary')
    expect(snorkelling).toHaveAttribute('data-variant', 'secondary')
    expect(cycling).toHaveAttribute('data-variant', 'secondary')

    expect(sup).toHaveClass('rounded-full')
    expect(kayaking).toHaveClass('rounded-full')
    expect(snorkelling).toHaveClass('rounded-full')
    expect(cycling).toHaveClass('rounded-full')
  })

  it('should render the selected activity with default variant when a different activity is selected', () => {
    mockUseForecastStore.mockImplementation(selector => {
      const state = {
        selectedActivity: 'cycling',
        setActivity: mockSetActivity,
      }
      return selector(state)
    })

    render(<ActivitySelector />)

    expect(screen.getByTestId('activity-sup')).toHaveAttribute('data-variant', 'secondary')
    expect(screen.getByTestId('activity-kayaking')).toHaveAttribute('data-variant', 'secondary')
    expect(screen.getByTestId('activity-snorkelling')).toHaveAttribute('data-variant', 'secondary')
    expect(screen.getByTestId('activity-cycling')).toHaveAttribute('data-variant', 'default')
  })

  it('should call setActivity with the correct activity key when an unselected activity is clicked', () => {
    render(<ActivitySelector />)

    fireEvent.click(screen.getByTestId('activity-kayaking'))
    expect(mockSetActivity).toHaveBeenCalledWith('kayaking')

    fireEvent.click(screen.getByTestId('activity-snorkelling'))
    expect(mockSetActivity).toHaveBeenCalledWith('snorkelling')

    fireEvent.click(screen.getByTestId('activity-cycling'))
    expect(mockSetActivity).toHaveBeenCalledWith('cycling')
  })
})
