import { render, screen } from '@testing-library/react'
import { buildForecastKey } from '@/app/utils/forecast'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

const mockUseForecastEntries = jest.fn()
const mockUseScheduledLocationEntries = jest.fn()
jest.mock('@/app/(app)/stores/forecast-selectors', () => ({
  useForecastEntries: () => mockUseForecastEntries(),
  useScheduledLocationEntries: () => mockUseScheduledLocationEntries(),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>
  }
})

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

jest.mock('./scheduled-location-card', () => {
  return function MockScheduledLocationCard() {
    return <div data-testid="scheduled-location-card" />
  }
})

jest.mock('./location-card-skeleton', () => {
  return function MockLocationCardSkeleton() {
    return <div data-testid="location-card-skeleton" />
  }
})

jest.mock('@/shadcn/components/ui/skeleton', () => ({
  Skeleton: props => <div data-testid="skeleton" {...props} />,
}))

import LocationList from './location-list'

describe('LocationList', () => {
  const makeForecast = (overrides = {}) => ({
    name: 'Mission Bay',
    area: 'Beach, Auckland Central',
    latitude: '-36.8547',
    longitude: '174.8317',
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

  const forecastEntries = [
    [key1, makeForecast({ score: 85 })],
    [key2, makeForecast({ name: 'Takapuna Beach', latitude: '-36.8400', longitude: '174.7670', score: 72 })],
  ]

  let mockSyncLocations

  beforeEach(() => {
    mockSyncLocations = jest.fn()
    mockUseForecastStore.mockImplementation(selector => {
      const state = { initLocations: mockSyncLocations, isLoaded: true }
      return selector(state)
    })
    mockUseForecastEntries.mockReturnValue(forecastEntries)
    mockUseScheduledLocationEntries.mockReturnValue([])
  })

  it('should show LocationListEmpty when entries is empty', () => {
    mockUseForecastEntries.mockReturnValue([])

    render(<LocationList />)

    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('location-card-skeleton')).toHaveLength(0)
    expect(mockSyncLocations).toHaveBeenCalledTimes(1)
    const root = screen.getByTestId('location-list')
    const header = screen.getByTestId('location-list-header')
    expect(root).toContainElement(header)
    expect(screen.getByTestId('location-list-empty')).toBeInTheDocument()
    expect(screen.queryAllByTestId('location-card')).toHaveLength(0)
  })

  it('should not show LocationListEmpty when isLoaded is false', () => {
    mockUseForecastStore.mockImplementation(selector => {
      const state = { initLocations: mockSyncLocations, isLoaded: false }
      return selector(state)
    })
    mockUseForecastEntries.mockReturnValue([])
    mockUseScheduledLocationEntries.mockReturnValue([
      ['-36.8547,174.8317', { name: 'Mission Bay', area: 'Beach, Auckland Central' }],
      ['-36.8400,174.7670', { name: 'Takapuna Beach', area: 'Beach, North Shore' }],
    ])

    render(<LocationList />)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.getAllByTestId('location-card-skeleton')).toHaveLength(2)
    expect(screen.queryByTestId('location-list-header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('location-list-empty')).not.toBeInTheDocument()
    expect(screen.queryAllByTestId('location-card')).toHaveLength(0)
  })

  it('should render LocationCards wrapped in Links for each entry', () => {
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
      latitude: '-36.8547',
      longitude: '174.8317',
      score: 85,
      condition: 'ideal',
      wind: { speed: '8km/h', direction: 'NE' },
      tide: { state: 'Rising', percentage: 70 },
      water: 'Green',
      temp: '22\u00B0C',
      summary: 'Great conditions.',
    })

    const firstLink = cards[0].closest('a')
    const secondLink = cards[1].closest('a')
    expect(firstLink).toHaveAttribute('href', '/location/mission-bay/-36.8547,174.8317')
    expect(secondLink).toHaveAttribute('href', '/location/takapuna-beach/-36.8400,174.7670')
  })

  it('should render ScheduledLocationCards for each scheduled location', () => {
    mockUseScheduledLocationEntries.mockReturnValue([
      ['-36.8547,174.8317', { name: 'Mission Bay', area: 'Beach, Auckland Central' }],
      ['-36.8400,174.7670', { name: 'Takapuna Beach', area: 'Beach, North Shore' }],
    ])

    render(<LocationList />)

    const cards = screen.getAllByTestId('scheduled-location-card')
    expect(cards).toHaveLength(2)
  })

  it('should not show LocationListEmpty when only scheduled locations exist', () => {
    mockUseForecastEntries.mockReturnValue([])
    mockUseScheduledLocationEntries.mockReturnValue([
      ['-36.8547,174.8317', { name: 'Mission Bay', area: 'Beach, Auckland Central' }],
    ])

    render(<LocationList />)

    expect(screen.queryByTestId('location-list-empty')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('scheduled-location-card')).toHaveLength(1)
  })
})
