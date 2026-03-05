import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationCardTemp from './location-card-temp'

describe('LocationCardTemp', () => {
  it('should render temperature icon and text for valid temp', () => {
    const { container } = render(<LocationCardTemp temp={{ air: '22°C' }} />)

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

  it('should render nothing when temp has no air value', () => {
    const { container } = render(<LocationCardTemp temp={{}} />)
    expect(container.innerHTML).toBe('')
  })

  it('should render nothing when temp.air has no numeric value', () => {
    const { container } = render(<LocationCardTemp temp={{ air: 'no data' }} />)
    expect(container.innerHTML).toBe('')
  })

  it.each([
    [{ air: '5°C' }, 'var(--temp-cold)'],
    [{ air: '12°C' }, 'var(--temp-cool)'],
    [{ air: '17°C' }, 'var(--temp-mild)'],
    [{ air: '22°C' }, 'var(--temp-warm)'],
    [{ air: '27°C' }, 'var(--temp-hot)'],
    [{ air: '35°C' }, 'var(--temp-extreme)'],
    [{ air: '-5°C' }, 'var(--temp-cold)'],
  ])('should use currentColor for temp %j', (temp, expectedColor) => {
    const { container } = render(<LocationCardTemp temp={temp} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ color: expectedColor })
    const rects = svg.querySelectorAll('rect')
    expect(rects[0]).toHaveAttribute('stroke', 'currentColor')
    expect(rects[1]).toHaveAttribute('fill', 'currentColor')
  })
})
