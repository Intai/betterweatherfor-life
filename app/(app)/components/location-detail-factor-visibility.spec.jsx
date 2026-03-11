import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorVisibility from './location-detail-factor-visibility'

describe('LocationDetailFactorVisibility', () => {
  it('should render visibility factor card with estimate', () => {
    render(
      <LocationDetailFactorVisibility
        visibility={{ estimate: '10km', condition: 'ideal', summary: 'Clear visibility.' }}
      />,
    )

    expect(screen.getAllByText('estimate')).toHaveLength(2)
    expect(screen.getByText('10km')).toBeInTheDocument()
    expect(screen.getByText('Clear visibility.')).toBeInTheDocument()
  })
})
