import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardScore from './location-card-score'

describe('LocationCardScore', () => {
  it('should render correct score bar width and color for ideal condition', () => {
    render(<LocationCardScore score={85} condition="ideal" />)

    const scoreBar = screen.getByTestId('condition-score-bar')
    expect(scoreBar).toHaveStyle({ width: '85%' })
    expect(scoreBar).toHaveClass('bg-condition-ideal')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-ideal')
  })

  it('should render correct score bar width and color for acceptable condition', () => {
    render(<LocationCardScore score={65} condition="acceptable" />)

    const scoreBar = screen.getByTestId('condition-score-bar')
    expect(scoreBar).toHaveStyle({ width: '65%' })
    expect(scoreBar).toHaveClass('bg-condition-acceptable')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-acceptable')
  })

  it('should render correct score bar width and color for marginal condition', () => {
    render(<LocationCardScore score={45} condition="marginal" />)

    const scoreBar = screen.getByTestId('condition-score-bar')
    expect(scoreBar).toHaveStyle({ width: '45%' })
    expect(scoreBar).toHaveClass('bg-condition-marginal')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-marginal')
  })

  it('should render correct score bar width and color for unsuitable condition', () => {
    render(<LocationCardScore score={20} condition="unsuitable" />)

    const scoreBar = screen.getByTestId('condition-score-bar')
    expect(scoreBar).toHaveStyle({ width: '20%' })
    expect(scoreBar).toHaveClass('bg-condition-unsuitable')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-unsuitable')
  })

  it('should render correct score bar width and color for unknown condition', () => {
    render(<LocationCardScore score={0} condition="unknown" />)

    const scoreBar = screen.getByTestId('condition-score-bar')
    expect(scoreBar).toHaveStyle({ width: '0%' })
    expect(scoreBar).toHaveClass('bg-condition-default')
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-condition-default')
  })
})
