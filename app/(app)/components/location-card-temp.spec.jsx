import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardTemp from './location-card-temp'

describe('LocationCardTemp', () => {
  it('should render temperature icon and text for valid temp', () => {
    const { container } = render(<LocationCardTemp temp="22°C" />)

    expect(screen.getByText('temp')).toBeInTheDocument()
    expect(screen.getByText('22°C')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('should render nothing when temp is undefined', () => {
    const { container } = render(<LocationCardTemp temp={undefined} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when temp is null', () => {
    const { container } = render(<LocationCardTemp temp={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when temp is empty string', () => {
    const { container } = render(<LocationCardTemp temp="" />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when temp has no numeric value', () => {
    const { container } = render(<LocationCardTemp temp="no data" />)
    expect(container.innerHTML).toBe('')
  })

  it.each([
    ['5°C', 'var(--temp-cold)'],
    ['12°C', 'var(--temp-cool)'],
    ['17°C', 'var(--temp-mild)'],
    ['22°C', 'var(--temp-warm)'],
    ['27°C', 'var(--temp-hot)'],
    ['35°C', 'var(--temp-extreme)'],
    ['-5°C', 'var(--temp-cold)'],
  ])('should use currentColor for temp %s', (temp, expectedColor) => {
    const { container } = render(<LocationCardTemp temp={temp} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ color: expectedColor })
    const rects = svg.querySelectorAll('rect')
    expect(rects[0]).toHaveAttribute('stroke', 'currentColor')
    expect(rects[1]).toHaveAttribute('fill', 'currentColor')
  })
})
