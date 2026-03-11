import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorWind from './location-detail-factor-wind'

describe('LocationDetailFactorWind', () => {
  const windData = {
    speed: '8km/h',
    direction: 'NE',
    gust: '12km/h',
    condition: 'ideal',
    summary: 'Light breeze.',
  }

  it('should render wind factor card with speed, direction, and gust data', () => {
    render(<LocationDetailFactorWind wind={windData} />)

    expect(screen.getByText('wind')).toBeInTheDocument()
    expect(screen.getByText('speed')).toBeInTheDocument()
    expect(screen.getByText('8km/h')).toBeInTheDocument()
    expect(screen.getByText('direction')).toBeInTheDocument()
    expect(screen.getByText('NE')).toBeInTheDocument()
    expect(screen.getByText('gust')).toBeInTheDocument()
    expect(screen.getByText('12km/h')).toBeInTheDocument()
    expect(screen.getByText('Light breeze.')).toBeInTheDocument()
  })
})
