import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardWind from './location-card-wind'

describe('LocationCardWind', () => {
  it('should render wind speed and direction text', () => {
    const { container } = render(
      <LocationCardWind wind={{ speed: '8km/h', direction: 'NE', condition: 'ideal' }} />
    )
    expect(screen.getByText('wind')).toBeInTheDocument()
    expect(screen.getByText('8km/h NE')).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('stroke', 'currentColor')
  })

  it('should render nothing when wind is null', () => {
    const { container } = render(<LocationCardWind wind={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when wind is undefined', () => {
    const { container } = render(<LocationCardWind wind={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it.each([
    ['ideal', 'var(--condition-ideal)'],
    ['acceptable', 'var(--condition-acceptable)'],
    ['marginal', 'var(--condition-marginal)'],
    ['unsuitable', 'var(--condition-unsuitable)'],
    [undefined, 'var(--condition-default)'],
  ])('should use condition color for %s condition', (condition, expectedColor) => {
    const { container } = render(<LocationCardWind wind={{ speed: '10km/h', direction: 'N', condition }} />)
    const svg = container.querySelector('svg')
    const iconContainer = svg.parentElement
    expect(iconContainer).toHaveStyle({ color: expectedColor })
  })

  it.each([
    ['N', -90],
    ['NE', -45],
    ['E', 0],
    ['SE', 45],
    ['S', 90],
    ['SW', 135],
    ['W', 180],
    ['NW', -135],
  ])('should rotate icon to %ideg for %s direction', (direction, degrees) => {
    const { container } = render(<LocationCardWind wind={{ speed: '10km/h', direction, condition: 'ideal' }} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ transform: `rotate(${degrees}deg)` })
  })

  it('should render nothing for unknown direction', () => {
    const { container } = render(<LocationCardWind wind={{ speed: '10km/h', direction: 'XYZ', condition: 'ideal' }} />)
    expect(container.innerHTML).toBe('')
  })
})
