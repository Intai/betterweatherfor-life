import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailForecastStrip from './location-detail-forecast-strip'

describe('LocationDetailForecastStrip', () => {
  const hourly = [
    { time: '7am', score: 85, condition: 'ideal' },
    { time: '8am', score: 92, condition: 'ideal' },
    { time: '9am', score: 78, condition: 'acceptable' },
    { time: '10am', score: 58, condition: 'marginal' },
  ]

  it('should render heading and all time slots with correct score colors and condition bars', () => {
    render(<LocationDetailForecastStrip hourly={hourly} />)

    expect(screen.getByText('forecast')).toBeInTheDocument()

    const times = screen.getAllByTestId('slot-time')
    expect(times).toHaveLength(4)
    expect(times[0]).toHaveTextContent('7am')
    expect(times[1]).toHaveTextContent('8am')
    expect(times[2]).toHaveTextContent('9am')
    expect(times[3]).toHaveTextContent('10am')

    const scores = screen.getAllByTestId('slot-score')
    expect(scores[0]).toHaveTextContent('85')
    expect(scores[0]).toHaveClass('text-condition-ideal')
    expect(scores[2]).toHaveClass('text-condition-acceptable')
    expect(scores[3]).toHaveClass('text-condition-marginal')

    const bars = screen.getAllByTestId('slot-bar')
    expect(bars[0]).toHaveClass('bg-condition-ideal')
    expect(bars[2]).toHaveClass('bg-condition-acceptable')
    expect(bars[3]).toHaveClass('bg-condition-marginal')
  })

  it('should mark the highest-scoring slot with a star badge and highlighted border', () => {
    render(<LocationDetailForecastStrip hourly={hourly} />)

    const bestSlot = screen.getByTestId('forecast-slot-best')
    expect(bestSlot).toHaveTextContent('8am')
    expect(bestSlot).toHaveTextContent('92')
    expect(bestSlot).toHaveClass('border-2')
    expect(bestSlot).toHaveStyle({ borderColor: 'var(--condition-ideal)' })

    expect(screen.getAllByTestId('forecast-slot')).toHaveLength(3)
    expect(screen.getByTestId('best-badge')).toBeInTheDocument()
  })

  it('should render nothing when hourly is empty', () => {
    const { container } = render(<LocationDetailForecastStrip hourly={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render nothing when hourly is undefined', () => {
    const { container } = render(<LocationDetailForecastStrip hourly={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should handle a single time slot as the best hour with matching condition color', () => {
    const single = [{ time: '6am', score: 50, condition: 'marginal' }]
    render(<LocationDetailForecastStrip hourly={single} />)

    const bestSlot = screen.getByTestId('forecast-slot-best')
    expect(bestSlot).toHaveTextContent('6am')
    expect(bestSlot).toHaveStyle({ borderColor: 'var(--condition-marginal)' })
    expect(screen.queryAllByTestId('forecast-slot')).toHaveLength(0)

    const badge = screen.getByTestId('best-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-condition-marginal')
  })

  it('should mark the first occurrence as best when multiple slots share the highest score', () => {
    const tied = [
      { time: '7am', score: 80, condition: 'ideal' },
      { time: '8am', score: 80, condition: 'ideal' },
    ]
    render(<LocationDetailForecastStrip hourly={tied} />)

    const bestSlot = screen.getByTestId('forecast-slot-best')
    expect(bestSlot).toHaveTextContent('7am')
  })

  it('should apply default color for unknown condition', () => {
    const unknown = [{ time: '5am', score: 30, condition: 'unknown' }]
    render(<LocationDetailForecastStrip hourly={unknown} />)

    expect(screen.getByTestId('slot-score')).toHaveClass('text-condition-default')
    expect(screen.getByTestId('slot-bar')).toHaveClass('bg-condition-default')
  })
})
