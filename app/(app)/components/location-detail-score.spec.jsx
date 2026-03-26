import { render, screen } from '@testing-library/react'
import { formatShortDateWithWeekday } from '@/app/utils/date'
import LocationDetailScore from './location-detail-score'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts ? `${key.split('.').pop()}:${opts.time}` : key.split('.').pop(),
  }),
}))

const defaultProps = {
  score: 87,
  condition: 'ideal',
  bestHourTime: '8am',
  date: new Date('2026-02-10T00:00:00'),
  timeRange: 'all-day',
}

describe('LocationDetailScore', () => {
  it('should render score circle, condition badge, and best hour for ideal condition', () => {
    render(<LocationDetailScore {...defaultProps} />)

    const circle = screen.getByTestId('score-circle')
    expect(circle).toHaveClass('w-32', 'h-32', 'rounded-full', 'bg-condition-ideal')
    expect(circle).toHaveTextContent('87')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-ideal')
    expect(screen.getByTestId('score-badge')).toHaveTextContent('ideal')
    expect(screen.getByTestId('best-hour')).toHaveTextContent('bestAt:8am')
    const dateEl = screen.getByTestId('forecast-date')
    expect(dateEl).toHaveTextContent(formatShortDateWithWeekday(defaultProps.date))
    expect(dateEl).toHaveTextContent('allDay')
  })

  it('should render correct color for acceptable condition', () => {
    render(<LocationDetailScore {...defaultProps} score={70} condition="acceptable" bestHourTime="10am" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-acceptable')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-acceptable')
  })

  it('should render correct color for marginal condition', () => {
    render(<LocationDetailScore {...defaultProps} score={45} condition="marginal" bestHourTime="2pm" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-marginal')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-marginal')
  })

  it('should render correct color for unsuitable condition', () => {
    render(<LocationDetailScore {...defaultProps} score={20} condition="unsuitable" bestHourTime="6am" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-unsuitable')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-unsuitable')
  })

  it('should render default color for unknown condition', () => {
    render(<LocationDetailScore {...defaultProps} score={0} condition="unknown" bestHourTime="12pm" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-default')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-default')
  })

  it('should render morning time range', () => {
    render(<LocationDetailScore {...defaultProps} timeRange="morning" />)
    expect(screen.getByTestId('forecast-date')).toHaveTextContent('morning')
  })

  it('should render afternoon time range', () => {
    render(<LocationDetailScore {...defaultProps} timeRange="afternoon" />)
    expect(screen.getByTestId('forecast-date')).toHaveTextContent('afternoon')
  })

  it('should render evening time range', () => {
    render(<LocationDetailScore {...defaultProps} timeRange="evening" />)
    expect(screen.getByTestId('forecast-date')).toHaveTextContent('evening')
  })
})
