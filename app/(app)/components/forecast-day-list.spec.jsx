import { fireEvent, render, screen } from '@testing-library/react'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

const mockUseSevenDayForecastEntries = jest.fn()
jest.mock('@/app/(app)/stores/forecast-selectors', () => ({
  useSevenDayForecastEntries: () => mockUseSevenDayForecastEntries(),
}))

jest.mock('@/shadcn/components/ui/skeleton', () => ({
  Skeleton: props => <div data-testid="skeleton" {...props} />,
}))

jest.mock('./forecast-day-card', () => {
  const { forwardRef } = require('react')
  return forwardRef(function MockForecastDayCard(props, ref) {
    return <div ref={ref} data-testid="forecast-day-card" data-props={JSON.stringify(props)} />
  })
})

jest.mock('./forecast-day-list-empty', () => {
  return function MockForecastDayListEmpty() {
    return <div data-testid="forecast-empty" />
  }
})

jest.mock('./forecast-day-selector-strip', () => {
  const { extractDateSegment } = require('@/app/utils/forecast')
  return function MockForecastDaySelectorStrip(props) {
    return (
      <div data-testid="day-selector-strip" data-day-count={props.entries?.length}>
        {props.entries?.map(([key]) => {
          const dateStr = extractDateSegment(key)
          return (
            <button key={key} data-testid="day-selector-button" onClick={() => props.onDaySelect(dateStr)}>
              {dateStr}
            </button>
          )
        })}
      </div>
    )
  }
})

import ForecastDayList from './forecast-day-list'

describe('ForecastDayList', () => {
  const makeEntry = (overrides = {}) => ({
    name: 'Mission Bay',
    area: 'Beach, Auckland Central',
    score: 92,
    condition: 'ideal',
    summary: 'Calm winds, incoming tide, perfect morning for paddling.',
    hourly: [
      { time: '07:00', score: 90 },
      { time: '08:00', score: 92 },
      { time: '09:00', score: 88 },
      { time: '10:00', score: 85 },
      { time: '11:00', score: 75 },
    ],
    ...overrides,
  })
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const forecastEntries = [
    [`sup;${todayStr};all-day;-36.8547,174.8317`, makeEntry({ score: 92, isBestDay: true })],
    ['sup;2026-03-15;all-day;-36.8400,174.7670', makeEntry({
      name: 'Takapuna Beach',
      score: 78,
      condition: 'acceptable',
      summary: 'Light winds early.',
      hourly: [
        { time: '06:00', score: 78 },
        { time: '07:00', score: 75 },
        { time: '08:00', score: 70 },
        { time: '09:00', score: 60 },
      ],
    })],
  ]

  let mockInitLocations

  beforeEach(() => {
    mockInitLocations = jest.fn()
    mockUseForecastStore.mockImplementation(selector => {
      const state = { initLocations: mockInitLocations, isLoaded: true, citySlug: null }
      return selector(state)
    })
    mockUseSevenDayForecastEntries.mockReturnValue(forecastEntries)
  })

  it('should render loading skeletons when not loaded', () => {
    mockUseForecastStore.mockImplementation(selector => {
      const state = { initLocations: mockInitLocations, isLoaded: false, citySlug: null }
      return selector(state)
    })
    mockUseSevenDayForecastEntries.mockReturnValue([])

    render(<ForecastDayList />)

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('day-selector-strip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forecast-empty')).not.toBeInTheDocument()
    expect(screen.queryByTestId('forecast-cards')).not.toBeInTheDocument()
    expect(mockInitLocations).toHaveBeenCalledTimes(1)
  })

  it('should render empty state when loaded but no entries', () => {
    mockUseSevenDayForecastEntries.mockReturnValue([])

    render(<ForecastDayList />)

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    expect(screen.getByTestId('day-selector-strip')).toBeInTheDocument()
    expect(screen.getByTestId('forecast-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('forecast-cards')).not.toBeInTheDocument()
  })

  it('should render day selector strip and forecast cards when loaded with entries', () => {
    render(<ForecastDayList />)

    expect(screen.getByTestId('day-selector-strip')).toBeInTheDocument()
    expect(screen.getByTestId('day-selector-strip')).toHaveAttribute('data-day-count', '2')
    expect(screen.queryByTestId('forecast-empty')).not.toBeInTheDocument()
    const cards = screen.getAllByTestId('forecast-day-card')
    expect(cards).toHaveLength(2)

    const firstCard = JSON.parse(cards[0].getAttribute('data-props'))
    expect(firstCard.score).toBe(92)
    expect(firstCard.isBestDay).toBe(true)
    expect(firstCard.dateSegment).toBe(todayStr)
    expect(firstCard.locationName).toBe('Mission Bay')
    expect(firstCard.condition).toBe('ideal')
    expect(firstCard.summary).toBe('Calm winds, incoming tide, perfect morning for paddling.')
    expect(firstCard.hourly).toEqual([
      { time: '07:00', score: 90 },
      { time: '08:00', score: 92 },
      { time: '09:00', score: 88 },
      { time: '10:00', score: 85 },
      { time: '11:00', score: 75 },
    ])

    const secondCard = JSON.parse(cards[1].getAttribute('data-props'))
    expect(secondCard.score).toBe(78)
    expect(secondCard.isBestDay).toBeUndefined()
    expect(secondCard.dateSegment).toBe('2026-03-15')
    expect(secondCard.locationName).toBe('Takapuna Beach')
    expect(secondCard.hourly).toEqual([
      { time: '06:00', score: 78 },
      { time: '07:00', score: 75 },
      { time: '08:00', score: 70 },
      { time: '09:00', score: 60 },
    ])
  })

  it('should handle entries without hourly data', () => {
    mockUseSevenDayForecastEntries.mockReturnValue([
      ['sup;2026-03-15;all-day;-36.8547,174.8317', makeEntry({ hourly: null })],
    ])

    render(<ForecastDayList />)

    const card = screen.getByTestId('forecast-day-card')
    const props = JSON.parse(card.getAttribute('data-props'))
    expect(props.hourly).toBeNull()
  })

  it('should scroll card into view when day selector is tapped', () => {
    const mockScrollIntoView = jest.fn()
    HTMLElement.prototype.scrollIntoView = mockScrollIntoView

    render(<ForecastDayList />)

    const buttons = screen.getAllByTestId('day-selector-button')
    fireEvent.click(buttons[0])
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth', block: 'nearest', inline: 'start',
    })
    delete HTMLElement.prototype.scrollIntoView
  })
})
