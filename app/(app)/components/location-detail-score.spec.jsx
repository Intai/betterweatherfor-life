import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => opts ? `${key.split('.').pop()}:${opts.time}` : key.split('.').pop(),
  }),
}))

import LocationDetailScore from './location-detail-score'

describe('LocationDetailScore', () => {
  it('should render score circle, condition badge, and best hour for ideal condition', () => {
    render(<LocationDetailScore score={87} condition="ideal" bestHourTime="8am" />)

    const circle = screen.getByTestId('score-circle')
    expect(circle).toHaveClass('w-32', 'h-32', 'rounded-full', 'bg-condition-ideal')
    expect(circle).toHaveTextContent('87')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-ideal')
    expect(screen.getByTestId('score-badge')).toHaveTextContent('ideal')
    expect(screen.getByTestId('best-hour')).toHaveTextContent('bestAt:8am')
  })

  it('should render correct color for acceptable condition', () => {
    render(<LocationDetailScore score={70} condition="acceptable" bestHourTime="10am" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-acceptable')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-acceptable')
  })

  it('should render correct color for marginal condition', () => {
    render(<LocationDetailScore score={45} condition="marginal" bestHourTime="2pm" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-marginal')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-marginal')
  })

  it('should render correct color for unsuitable condition', () => {
    render(<LocationDetailScore score={20} condition="unsuitable" bestHourTime="6am" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-unsuitable')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-unsuitable')
  })

  it('should render default color for unknown condition', () => {
    render(<LocationDetailScore score={0} condition="unknown" bestHourTime="12pm" />)

    expect(screen.getByTestId('score-circle')).toHaveClass('bg-condition-default')
    expect(screen.getByTestId('score-badge')).toHaveClass('bg-condition-default')
  })
})
