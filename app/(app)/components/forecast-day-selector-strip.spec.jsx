import { fireEvent, render, screen } from '@testing-library/react'
import LocaleProvider from '@/app/components/locale-provider'
import ForecastDaySelectorStrip from './forecast-day-selector-strip'

describe('ForecastDaySelectorStrip', () => {
  const makeEntries = () => [
    ['sup;2026-02-10;all-day;-36.8547,174.8317', { score: 92, condition: 'ideal' }],
    ['sup;2026-02-11;all-day;-36.8400,174.7670', { score: 78, condition: 'acceptable' }],
    ['sup;2026-02-12;all-day;-36.8300,174.7500', { score: 45, condition: 'marginal' }],
    ['sup;2026-02-13;all-day;-36.8200,174.7400', { score: 28, condition: 'unsuitable' }],
  ]

  function renderWithLocale(element, locale = 'en-NZ') {
    return render(<LocaleProvider locale={locale}>{element}</LocaleProvider>)
  }

  it('should render all day buttons with weekday, date number, and color-coded score badge', () => {
    const onDaySelect = jest.fn()
    renderWithLocale(<ForecastDaySelectorStrip entries={makeEntries()} onDaySelect={onDaySelect} />)

    expect(screen.getByTestId('day-selector-strip')).toBeInTheDocument()
    const buttons = screen.getAllByTestId('day-selector-button')
    expect(buttons).toHaveLength(4)
    expect(buttons[0]).toHaveTextContent('10')
    expect(buttons[1]).toHaveTextContent('11')
    expect(buttons[2]).toHaveTextContent('12')
    expect(buttons[3]).toHaveTextContent('13')

    const badges = screen.getAllByTestId('day-score-badge')
    expect(badges[0]).toHaveTextContent('92')
    expect(badges[0]).toHaveStyle({ backgroundColor: 'var(--condition-ideal)' })
    expect(badges[1]).toHaveTextContent('78')
    expect(badges[1]).toHaveStyle({ backgroundColor: 'var(--condition-acceptable)' })
    expect(badges[2]).toHaveTextContent('45')
    expect(badges[2]).toHaveStyle({ backgroundColor: 'var(--condition-marginal)' })
    expect(badges[3]).toHaveTextContent('28')
    expect(badges[3]).toHaveStyle({ backgroundColor: 'var(--condition-unsuitable)' })
  })

  it('should call onDaySelect with the date string when a button is tapped', () => {
    const onDaySelect = jest.fn()
    renderWithLocale(<ForecastDaySelectorStrip entries={makeEntries()} onDaySelect={onDaySelect} />)

    const buttons = screen.getAllByTestId('day-selector-button')
    fireEvent.click(buttons[2])
    expect(onDaySelect).toHaveBeenCalledTimes(1)
    expect(onDaySelect).toHaveBeenCalledWith('2026-02-12')
  })

  it('should render nothing when entries is empty', () => {
    const { container } = renderWithLocale(<ForecastDaySelectorStrip entries={[]} onDaySelect={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render nothing when entries is undefined', () => {
    const { container } = renderWithLocale(<ForecastDaySelectorStrip entries={undefined} onDaySelect={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render nothing when entries is null', () => {
    const { container } = renderWithLocale(<ForecastDaySelectorStrip entries={null} onDaySelect={jest.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should apply default condition color for unknown condition', () => {
    const entries = [['sup;2026-02-10;all-day;-36.8547,174.8317', { score: 30, condition: 'unknown' }]]
    renderWithLocale(<ForecastDaySelectorStrip entries={entries} onDaySelect={jest.fn()} />)

    const badge = screen.getByTestId('day-score-badge')
    expect(badge).toHaveStyle({ backgroundColor: 'var(--condition-default)' })
  })
})
