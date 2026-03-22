import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorTide from './location-detail-factor-tide'

describe('LocationDetailFactorTide', () => {
  const tideData = {
    state: 'Rising',
    percentage: 70,
    swell: '1.2m',
    nextHigh: '11:30',
    nextLow: '17:45',
    condition: 'ideal',
    summary: 'Rising tide.',
  }

  it('should render combined state and percentage, nextHigh and swell', () => {
    render(<LocationDetailFactorTide tide={tideData} />)

    expect(screen.getByText('tide')).toBeInTheDocument()
    expect(screen.getByText('state')).toBeInTheDocument()
    expect(screen.getByText('Rising 70%')).toBeInTheDocument()
    expect(screen.getByText('nextHigh')).toBeInTheDocument()
    expect(screen.getByText('11:30')).toBeInTheDocument()
    expect(screen.getByText('swell')).toBeInTheDocument()
    expect(screen.getByText('1.2m')).toBeInTheDocument()
  })

  it('should render nextLow when nextLow is sooner than nextHigh', () => {
    render(<LocationDetailFactorTide tide={{ ...tideData, nextHigh: '17:45', nextLow: '11:30' }} />)

    expect(screen.getByText('nextLow')).toBeInTheDocument()
    expect(screen.getByText('11:30')).toBeInTheDocument()
  })
})
