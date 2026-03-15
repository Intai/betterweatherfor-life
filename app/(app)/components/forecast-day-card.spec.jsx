import { fireEvent, render, screen } from '@testing-library/react'
import LocaleProvider from '@/app/components/locale-provider'
import { PICK_DATE } from '@/app/(app)/constants'

jest.mock('next/link', () => {
  return function Link({ children, ...props }) {
    return <a {...props}>{children}</a>
  }
})

const mockStore = {
  citySlug: 'auckland',
  setDay: jest.fn(),
  setDate: jest.fn(),
}
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => selector(mockStore),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      if (key === 'forecast.bestWindowRange' && params) {
        return `${params.start} - ${params.end}`
      }
      return key.split('.').pop()
    },
  }),
}))

jest.mock('lucide-react', () => ({
  Star: props => <svg data-testid="star-icon" {...props} />,
}))

import ForecastDayCard from './forecast-day-card'

describe('ForecastDayCard', () => {
  const defaultProps = {
    dateSegment: '2026-02-01',
    timeZone: 'Pacific/Auckland',
    score: 92,
    condition: 'ideal',
    locationName: 'Mission Bay',
    hourly: [
      { time: '07:00', score: 90 },
      { time: '08:00', score: 92 },
      { time: '09:00', score: 88 },
      { time: '10:00', score: 85 },
      { time: '11:00', score: 75 },
    ],
    summary: 'Calm winds, incoming tide, perfect morning for paddling.',
  }

  function renderWithLocale(ui, locale = 'en-NZ') {
    return render(<LocaleProvider locale={locale}>{ui}</LocaleProvider>)
  }

  beforeEach(() => {
    mockStore.setDay.mockClear()
    mockStore.setDate.mockClear()
    mockStore.citySlug = 'auckland'
  })

  it('should render date heading, best spot, score circle, condition badge, best window, and summary', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} />)

    expect(screen.getByTestId('date-heading')).toHaveTextContent('Sun, 1 Feb')
    expect(screen.queryByTestId('today-chip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('best-day-badge')).not.toBeInTheDocument()
    expect(screen.getByTestId('best-spot')).toHaveTextContent('bestSpot')
    expect(screen.getByTestId('best-spot')).toHaveTextContent('Mission Bay')
    const circle = screen.getByTestId('score-circle')
    expect(circle).toHaveClass('w-14', 'h-14', 'rounded-full', 'bg-condition-ideal')
    expect(circle).toHaveTextContent('92')
    expect(screen.getByTestId('condition-badge')).toHaveTextContent('ideal')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-ideal')
    expect(screen.queryByTestId('no-window')).not.toBeInTheDocument()
    expect(screen.getByTestId('best-window')).toHaveTextContent('bestWindow')
    expect(screen.getByTestId('best-window')).toHaveTextContent('07:00 - 11:00')
    const summary = screen.getByTestId('day-summary')
    expect(summary).toHaveClass('bg-secondary', 'rounded-xl')
    expect(summary).toHaveTextContent('Calm winds, incoming tide, perfect morning for paddling.')
  })

  it('should render Today chip when date is today', () => {
    const today = new Date()
    const todaySegment = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    renderWithLocale(<ForecastDayCard {...defaultProps} dateSegment={todaySegment} timeZone={localTz} />)

    const chip = screen.getByTestId('today-chip')
    expect(chip).toHaveTextContent('today')
    expect(chip).toHaveClass('text-primary', 'rounded-full')
  })

  it('should render Today chip respecting city timezone near midnight UTC', () => {
    // System time: Feb 10 23:00 UTC → Feb 11 in Pacific/Auckland (UTC+13)
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T23:00:00Z'))

    renderWithLocale(<ForecastDayCard {...defaultProps} dateSegment="2026-02-11" timeZone="Pacific/Auckland" />)
    expect(screen.getByTestId('today-chip')).toBeInTheDocument()
    jest.useRealTimers()
  })

  it('should not render Today chip when date is not today in city timezone', () => {
    // System time: Feb 10 23:00 UTC → Feb 11 in Pacific/Auckland (UTC+13)
    // dateSegment "2026-02-10" is yesterday in Auckland
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T23:00:00Z'))

    renderWithLocale(<ForecastDayCard {...defaultProps} dateSegment="2026-02-10" timeZone="Pacific/Auckland" />)
    expect(screen.queryByTestId('today-chip')).not.toBeInTheDocument()
    jest.useRealTimers()
  })

  it('should render Best Day badge when isBestDay is true', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} isBestDay />)

    const badge = screen.getByTestId('best-day-badge')
    expect(badge).toHaveTextContent('bestDay')
    expect(badge).toHaveClass('best-day-badge')
    expect(screen.getByTestId('star-icon')).toBeInTheDocument()
  })

  it('should not render Best Day badge when condition is unsuitable even if isBestDay is true', () => {
    render(
      <ForecastDayCard
        dateSegment="2026-02-05"
        score={28}
        condition="unsuitable"
        isBestDay
      />,
    )

    expect(screen.queryByTestId('best-day-badge')).not.toBeInTheDocument()
  })

  it('should render unsuitable variant with no location name, no-window text, and tinted summary', () => {
    render(
      <ForecastDayCard
        dateSegment="2026-02-05"
        score={28}
        condition="unsuitable"
        summary="Strong winds and rain forecast. Not recommended for paddling."
      />,
    )

    const card = screen.getByTestId('forecast-day-card')
    expect(card).toHaveClass('opacity-80')
    expect(screen.queryByTestId('best-spot')).not.toBeInTheDocument()
    const circle = screen.getByTestId('score-circle')
    expect(circle).toHaveClass('bg-condition-unsuitable')
    expect(circle).toHaveTextContent('28')
    expect(screen.getByTestId('condition-badge')).toHaveTextContent('unsuitable')
    expect(screen.getByTestId('no-window')).toHaveTextContent('noWindow')
    expect(screen.queryByTestId('best-window')).not.toBeInTheDocument()
    const summary = screen.getByTestId('day-summary')
    expect(summary).not.toHaveClass('bg-secondary')
    expect(summary).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-unsuitable) 10%, transparent)',
    })
    const text = summary.querySelector('p')
    expect(text).toHaveStyle({ color: 'var(--condition-unsuitable)' })
  })

  it('should render acceptable condition with correct color classes', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} condition="acceptable" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-acceptable')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-acceptable')
  })

  it('should render marginal condition with correct color classes', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} condition="marginal" summary={undefined} />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-marginal')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-marginal')
    expect(screen.queryByTestId('day-summary')).not.toBeInTheDocument()
  })

  it('should apply warning styling to summary for marginal condition', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} condition="marginal" />)

    const summary = screen.getByTestId('day-summary')
    expect(summary).not.toHaveClass('bg-secondary')
    expect(summary).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-marginal) 10%, transparent)',
    })
    const text = summary.querySelector('p')
    expect(text).toHaveStyle({ color: 'var(--condition-marginal)' })
  })

  it('should set day and date when the card is clicked', () => {
    renderWithLocale(<ForecastDayCard {...defaultProps} />)

    const card = screen.getByTestId('forecast-day-card')
    expect(card.tagName).toBe('A')
    expect(card).toHaveAttribute('href', '/auckland/home')
    fireEvent.click(card)
    expect(mockStore.setDay).toHaveBeenCalledWith(PICK_DATE)
    expect(mockStore.setDate).toHaveBeenCalledWith(new Date('2026-02-01T00:00:00'))
  })

  it('should link to /home when citySlug is not set', () => {
    mockStore.citySlug = ''
    renderWithLocale(<ForecastDayCard {...defaultProps} />)

    expect(screen.getByTestId('forecast-day-card')).toHaveAttribute('href', '/home')
  })
})
