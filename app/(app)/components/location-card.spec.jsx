import { fireEvent, render, screen } from '@testing-library/react'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('lucide-react', () => ({
  X: props => <svg data-testid="x-icon" {...props} />,
}))

import LocationCard from './location-card'

describe('LocationCard', () => {
  const defaultProps = {
    forecastKey: 'sup;2026-02-11;all-day;-36.8547,174.8317',
    name: 'Mission Bay',
    area: 'Beach, Auckland Central',
    score: 85,
    condition: 'ideal',
    wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
    tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
    water: 'Green',
    temp: '22°C',
    summary: 'Light onshore breeze, excellent for paddling this morning.',
  }

  let mockRemoveForecast

  beforeEach(() => {
    mockRemoveForecast = jest.fn()
    mockUseForecastStore.mockImplementation(selector => {
      const state = { removeForecast: mockRemoveForecast }
      return selector(state)
    })
  })

  it('should render location name, area, and conditions', () => {
    render(<LocationCard {...defaultProps} />)

    expect(screen.getByText('Mission Bay')).toBeInTheDocument()
    expect(screen.getByText('Beach, Auckland Central')).toBeInTheDocument()
    expect(screen.getByText(/85/)).toBeInTheDocument()
    expect(screen.getByTestId('condition-badge')).toHaveTextContent('ideal')
    expect(screen.getByText('8km/h NE')).toBeInTheDocument()
    expect(screen.getByText('Rising 70%')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
    expect(screen.getByText('22°C')).toBeInTheDocument()
  })

  it('should render AI summary text', () => {
    render(<LocationCard {...defaultProps} />)
    expect(screen.getByText('Light onshore breeze, excellent for paddling this morning.')).toBeInTheDocument()
  })

  it('should not render temperature when temp is undefined', () => {
    render(<LocationCard {...defaultProps} temp={undefined} />)
    expect(screen.queryByText('temp')).not.toBeInTheDocument()
  })

  it('should call removeForecast with forecastKey when remove button is clicked', () => {
    render(<LocationCard {...defaultProps} />)

    const removeButton = screen.getByTestId('remove-location-button')
    fireEvent.click(removeButton)
    expect(mockRemoveForecast).toHaveBeenCalledWith('sup;2026-02-11;all-day;-36.8547,174.8317')
  })
})
