import { render, screen } from '@testing-library/react'
import LocationCardSkeleton from './location-card-skeleton'

describe('LocationCardSkeleton', () => {
  it('should render skeleton elements inside a card', () => {
    render(<LocationCardSkeleton />)

    const card = screen.getByTestId('location-card-skeleton')
    expect(card).toBeInTheDocument()
    const skeletons = card.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render a conditions grid with four skeleton blocks', () => {
    render(<LocationCardSkeleton />)

    const card = screen.getByTestId('location-card-skeleton')
    const grid = card.querySelector('.grid-cols-2')
    expect(grid).toBeInTheDocument()
    expect(grid.children).toHaveLength(4)
  })
})
