import { fireEvent, render, screen } from '@testing-library/react'

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('lucide-react', () => ({
  CloudUpload: props => <svg data-testid="cloud-icon" {...props} />,
  X: props => <svg data-testid="x-icon" {...props} />,
}))

import ScheduledLocationCard from './scheduled-location-card'

describe('ScheduledLocationCard', () => {
  const defaultProps = {
    locationKey: '-36.3,174.8',
    name: 'Goat Island',
    area: 'Marine Reserve, Leigh',
  }

  let mockRemoveLocation

  beforeEach(() => {
    mockRemoveLocation = jest.fn()
    mockUseForecastStore.mockImplementation(selector => {
      const state = { removeLocation: mockRemoveLocation }
      return selector(state)
    })
  })

  it('should render location name, area, and scheduled content', () => {
    render(<ScheduledLocationCard {...defaultProps} />)

    expect(screen.getByText('Goat Island')).toBeInTheDocument()
    expect(screen.getByText('Marine Reserve, Leigh')).toBeInTheDocument()
    expect(screen.getByTestId('cloud-icon')).toBeInTheDocument()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
  })

  it('should call removeLocation with locationKey when remove button is clicked', () => {
    render(<ScheduledLocationCard {...defaultProps} />)

    const removeButton = screen.getByTestId('remove-location-button')
    fireEvent.click(removeButton)
    expect(mockRemoveLocation).toHaveBeenCalledWith('-36.3,174.8')
  })
})
