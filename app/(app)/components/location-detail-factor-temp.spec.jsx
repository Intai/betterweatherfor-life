import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorTemp from './location-detail-factor-temp'

describe('LocationDetailFactorTemp', () => {
  const tempData = {
    air: '22°C',
    feelsLike: '24°C',
    water: '20°C',
    condition: 'ideal',
    summary: 'Comfortable.',
  }

  it('should render temp factor card with air, feelsLike, and water temperatures', () => {
    render(<LocationDetailFactorTemp temp={tempData} />)

    expect(screen.getByText('temp')).toBeInTheDocument()
    expect(screen.getByText('air')).toBeInTheDocument()
    expect(screen.getByText('22°C')).toBeInTheDocument()
    expect(screen.getByText('feelsLike')).toBeInTheDocument()
    expect(screen.getByText('24°C')).toBeInTheDocument()
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('20°C')).toBeInTheDocument()
  })

  it('should render temp factor card without feelsLike when not provided', () => {
    render(
      <LocationDetailFactorTemp
        temp={{ air: '22°C', condition: 'ideal' }}
      />,
    )

    expect(screen.getByText('air')).toBeInTheDocument()
    expect(screen.getByText('22°C')).toBeInTheDocument()
    expect(screen.queryByText('feelsLike')).not.toBeInTheDocument()
    expect(screen.queryByText('water')).not.toBeInTheDocument()
  })

  it('should handle temp with unparseable air value gracefully', () => {
    render(
      <LocationDetailFactorTemp
        temp={{ air: 'warm', condition: 'ideal' }}
      />,
    )

    expect(screen.getByText('air')).toBeInTheDocument()
    expect(screen.getByText('warm')).toBeInTheDocument()
  })
})
