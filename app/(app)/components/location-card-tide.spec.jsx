import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardTide from './location-card-tide'

describe('LocationCardTide', () => {
  it('should render tide state and percentage text', () => {
    const { container } = render(
      <LocationCardTide tide={{ state: 'Rising', percentage: 70, condition: 'ideal' }} />
    )
    expect(screen.getByText('tide')).toBeInTheDocument()
    expect(screen.getByText('Rising 70%')).toBeInTheDocument()
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render nothing when tide is null', () => {
    const { container } = render(<LocationCardTide tide={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when tide is undefined', () => {
    const { container } = render(<LocationCardTide tide={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when tide.percentage is missing', () => {
    const { container } = render(<LocationCardTide tide={{ state: 'Rising', condition: 'ideal' }} />)
    expect(container.innerHTML).toBe('')
  })

  it.each([
    ['ideal', 'var(--condition-ideal)'],
    ['acceptable', 'var(--condition-acceptable)'],
    ['marginal', 'var(--condition-marginal)'],
    ['unsuitable', 'var(--condition-unsuitable)'],
    [undefined, 'var(--condition-default)'],
  ])('should use condition color for %s condition', (condition, expectedColor) => {
    const { container } = render(
      <LocationCardTide tide={{ state: 'Rising', percentage: 70, condition }} />
    )
    const svg = container.querySelector('svg')
    const iconContainer = svg.parentElement
    expect(iconContainer).toHaveStyle({ color: expectedColor })
  })

  it('should render rising icon path', () => {
    const { container } = render(
      <LocationCardTide tide={{ state: 'Rising', percentage: 50, condition: 'ideal' }} />
    )
    const paths = container.querySelectorAll('path')
    expect(paths[0]).toHaveAttribute('d', 'M5 19Q3 19 4.1 17.3L10.9 6.7Q12 5 13.1 6.7L19.9 17.3Q21 19 19 19Z')
  })

  it('should render falling icon path', () => {
    const { container } = render(
      <LocationCardTide tide={{ state: 'Falling', percentage: 50, condition: 'ideal' }} />
    )
    const paths = container.querySelectorAll('path')
    expect(paths[0]).toHaveAttribute('d', 'M5 5Q3 5 4.1 6.7L10.9 17.3Q12 19 13.1 17.3L19.9 6.7Q21 5 19 5Z')
  })
})
