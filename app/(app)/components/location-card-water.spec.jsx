import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardWater from './location-card-water'

describe('LocationCardWater', () => {
  it('should render water quality text', () => {
    const { container } = render(<LocationCardWater water={{ quality: 'Green' }} />)

    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('Green')).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render nothing when water is null', () => {
    const { container } = render(<LocationCardWater water={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when water is undefined', () => {
    const { container } = render(<LocationCardWater water={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it.each([
    [{ quality: 'Green' }, 'var(--condition-ideal)'],
    [{ quality: 'Orange' }, 'var(--condition-marginal)'],
    [{ quality: 'Red' }, 'var(--condition-unsuitable)'],
    [{ quality: 'Black' }, 'var(--condition-unsuitable)'],
    [{ quality: 'Unknown' }, 'var(--condition-default)'],
  ])('should use condition color for %j quality', (water, expectedColor) => {
    const { container } = render(<LocationCardWater water={water} />)
    const svg = container.querySelector('svg')
    const iconContainer = svg.parentElement
    expect(iconContainer).toHaveStyle({ color: expectedColor })
  })
})
