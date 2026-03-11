import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorDaylight from './location-detail-factor-daylight'

describe('LocationDetailFactorDaylight', () => {
  it('should render daylight factor card with sunset', () => {
    render(
      <LocationDetailFactorDaylight
        daylight={{ sunset: '7:45 PM', condition: 'ideal' }}
      />,
    )

    expect(screen.getByText('daylight')).toBeInTheDocument()
    expect(screen.getByText('sunset')).toBeInTheDocument()
    expect(screen.getByText('7:45 PM')).toBeInTheDocument()
  })

  it('should render daylight factor card with civilTwilightEnd', () => {
    render(
      <LocationDetailFactorDaylight
        daylight={{ civilTwilightEnd: '8:15 PM', condition: 'ideal' }}
      />,
    )

    expect(screen.getByText('daylight')).toBeInTheDocument()
    expect(screen.queryByText('sunset')).not.toBeInTheDocument()
    expect(screen.getByText('civilTwilightEnd')).toBeInTheDocument()
    expect(screen.getByText('8:15 PM')).toBeInTheDocument()
  })
})
