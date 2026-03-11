import { render, screen } from '@testing-library/react'

jest.mock('@/app/(app)/stores/forecast-selectors', () => ({
  useForecastEntry: jest.fn(),
}))

jest.mock('@/app/(app)/components/location-detail-score', () =>
  function MockScore({ score, condition, bestHourTime }) {
    return <div data-testid="score">{score}-{condition}-{bestHourTime}</div>
  },
)

jest.mock('@/app/(app)/components/location-detail-conditions', () =>
  function MockConditions(props) {
    return <div data-testid="conditions">{Object.keys(props).filter(k => props[k]).join(',')}</div>
  },
)

jest.mock('@/app/(app)/components/location-detail-analysis', () =>
  function MockAnalysis({ analysis, condition }) {
    return <div data-testid="analysis">{analysis}-{condition}</div>
  },
)

jest.mock('@/app/(app)/components/location-detail-forecast-strip', () =>
  function MockForecastStrip({ hourly }) {
    return <div data-testid="forecast-strip">{hourly?.length ?? 0}</div>
  },
)

import { useForecastEntry } from '@/app/(app)/stores/forecast-selectors'
import LocationDetail from './location-detail'

describe('LocationDetail', () => {
  const baseEntry = {
    name: 'Test Beach',
    score: 85,
    condition: 'ideal',
    analysis: 'Great conditions today.',
    hourly: [
      { time: '8am', score: 70 },
      { time: '9am', score: 85 },
      { time: '10am', score: 60 },
    ],
    wind: { speed: '10km/h', direction: 'N', condition: 'ideal' },
    temp: { air: '22°C', condition: 'ideal' },
  }

  it('should render nothing when forecast entry is not found', () => {
    useForecastEntry.mockReturnValue(undefined)

    const { container } = render(<LocationDetail geolocation="-36.8,174.7" />)

    expect(container.innerHTML).toBe('')
    expect(useForecastEntry).toHaveBeenCalledWith('-36.8,174.7')
  })

  it('should render all detail sections with correct props when entry exists', () => {
    useForecastEntry.mockReturnValue(['forecast-key', baseEntry])

    render(<LocationDetail geolocation="-36.8,174.7" />)

    expect(screen.getByTestId('location-detail')).toBeInTheDocument()
    expect(screen.getByTestId('score')).toHaveTextContent('85-ideal-9am')
    expect(screen.getByTestId('conditions')).toHaveTextContent('wind,temp')
    expect(screen.getByTestId('analysis')).toHaveTextContent('Great conditions today.-ideal')
    expect(screen.getByTestId('forecast-strip')).toHaveTextContent('3')
  })

  it('should omit analysis section when entry has no analysis', () => {
    useForecastEntry.mockReturnValue(['forecast-key', { ...baseEntry, analysis: undefined }])

    render(<LocationDetail geolocation="-36.8,174.7" />)

    expect(screen.getByTestId('location-detail')).toBeInTheDocument()
    expect(screen.queryByTestId('analysis')).not.toBeInTheDocument()
  })

  it('should handle entry with empty hourly array', () => {
    useForecastEntry.mockReturnValue(['forecast-key', { ...baseEntry, hourly: [] }])

    render(<LocationDetail geolocation="-36.8,174.7" />)

    expect(screen.getByTestId('score')).toHaveTextContent('85-ideal-')
    expect(screen.getByTestId('forecast-strip')).toHaveTextContent('0')
  })

  it('should handle entry with no hourly data', () => {
    useForecastEntry.mockReturnValue(['forecast-key', { ...baseEntry, hourly: undefined }])

    render(<LocationDetail geolocation="-36.8,174.7" />)

    expect(screen.getByTestId('score')).toHaveTextContent('85-ideal-')
    expect(screen.getByTestId('forecast-strip')).toHaveTextContent('0')
  })
})
