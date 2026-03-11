import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailFactorUV from './location-detail-factor-uv'

describe('LocationDetailFactorUV', () => {
  it('should render UV factor card with index value', () => {
    render(<LocationDetailFactorUV uv={{ index: 4, condition: 'ideal', summary: 'Moderate UV.' }} />)

    expect(screen.getAllByText('index')).toHaveLength(2)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Moderate UV.')).toBeInTheDocument()
  })
})
