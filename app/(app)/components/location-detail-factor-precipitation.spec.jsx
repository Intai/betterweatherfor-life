import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorPrecipitation from './location-detail-factor-precipitation'

describe('LocationDetailFactorPrecipitation', () => {
  const precipitationData = {
    amount: '2mm',
    chance: '10%',
    condition: 'ideal',
    summary: 'Dry conditions.',
  }

  it('should render precipitation factor card with amount and chance', () => {
    render(<LocationDetailFactorPrecipitation precipitation={precipitationData} />)

    expect(screen.getByText('amount')).toBeInTheDocument()
    expect(screen.getByText('2mm')).toBeInTheDocument()
    expect(screen.getByText('chance')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
  })

  it('should render precipitation factor card with only amount when chance is absent', () => {
    render(
      <LocationDetailFactorPrecipitation
        precipitation={{ amount: '0mm', condition: 'ideal' }}
      />,
    )

    expect(screen.getByText('amount')).toBeInTheDocument()
    expect(screen.getByText('0mm')).toBeInTheDocument()
    expect(screen.queryByText('chance')).not.toBeInTheDocument()
  })
})
