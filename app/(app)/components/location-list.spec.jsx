import { render, screen } from '@testing-library/react'
import { buildForecastKey } from '@/app/utils/forecast'

const mockUseForecastEntries = jest.fn()
jest.mock('@/app/(app)/stores/forecast-selectors', () => ({
  useForecastEntries: () => mockUseForecastEntries(),
}))

jest.mock('./location-list-header', () => {
  return function MockLocationListHeader() {
    return <div data-testid="location-list-header" />
  }
})

jest.mock('./location-list-empty', () => {
  return function MockLocationListEmpty() {
    return <div data-testid="location-list-empty" />
  }
})

jest.mock('./location-card', () => {
  return function MockLocationCard(props) {
    return <div data-testid="location-card" data-props={JSON.stringify(props)} />
  }
})

import LocationList from './location-list'

describe('LocationList', () => {
  const makeForecast = (overrides = {}) => ({
    name: 'Mission Bay',
    area: 'Beach, Auckland Central',
    score: 85,
    condition: 'ideal',
    wind: { speed: '8km/h', direction: 'NE' },
    tide: { state: 'Rising', percentage: 70 },
    water: 'Green',
    temp: '22\u00B0C',
    summary: 'Great conditions.',
    timeZone: 'Pacific/Auckland',
    ...overrides,
  })

  const key1 = buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')
  const key2 = buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670')

  const defaultEntries = [
    [key1, makeForecast({ score: 85 })],
    [key2, makeForecast({ name: 'Takapuna Beach', score: 72 })],
  ]

  beforeEach(() => {
    mockUseForecastEntries.mockReturnValue(defaultEntries)
  })

  it('should show LocationListEmpty when entries is empty', () => {
    mockUseForecastEntries.mockReturnValue([])

    render(<LocationList />)

    const root = screen.getByTestId('location-list')
    const header = screen.getByTestId('location-list-header')
    expect(root).toContainElement(header)
    expect(screen.getByTestId('location-list-empty')).toBeInTheDocument()
    expect(screen.queryAllByTestId('location-card')).toHaveLength(0)
  })

  it('should render LocationCards for each entry', () => {
    render(<LocationList />)

    const cards = screen.getAllByTestId('location-card')
    expect(cards).toHaveLength(2)

    const firstProps = JSON.parse(cards[0].getAttribute('data-props'))
    const secondProps = JSON.parse(cards[1].getAttribute('data-props'))
    expect(secondProps.score).toBe(72)
    expect(firstProps).toEqual({
      forecastKey: key1,
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      score: 85,
      condition: 'ideal',
      wind: { speed: '8km/h', direction: 'NE' },
      tide: { state: 'Rising', percentage: 70 },
      water: 'Green',
      temp: '22\u00B0C',
      summary: 'Great conditions.',
    })
  })
})
