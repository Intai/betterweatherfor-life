import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorWater from './location-detail-factor-water'

describe('LocationDetailFactorWater', () => {
  const waterData = {
    quality: 'Green',
    condition: 'ideal',
    summary: 'No contamination risk.',
  }

  it('should render water factor card with quality', () => {
    render(<LocationDetailFactorWater water={waterData} />)

    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('quality')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
    expect(screen.getByText('No contamination risk.')).toBeInTheDocument()
  })
})
