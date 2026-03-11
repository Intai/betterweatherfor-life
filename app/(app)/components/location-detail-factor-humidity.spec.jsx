import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorHumidity from './location-detail-factor-humidity'

describe('LocationDetailFactorHumidity', () => {
  it('should render humidity factor card with percentage', () => {
    render(
      <LocationDetailFactorHumidity
        humidity={{ percentage: '65%', condition: 'ideal', summary: 'Comfortable humidity.' }}
      />,
    )

    expect(screen.getAllByText('percentage')).toHaveLength(2)
    expect(screen.getByText('65%')).toBeInTheDocument()
    expect(screen.getByText('Comfortable humidity.')).toBeInTheDocument()
  })
})
