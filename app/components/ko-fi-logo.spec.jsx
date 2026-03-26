import { render, screen } from '@testing-library/react'
import KofiLogo from './ko-fi-logo'

describe('KofiLogo', () => {
  it('should render with default className when none is provided', () => {
    render(<KofiLogo />)
    const svg = screen.getByTestId('kofi-logo')
    expect(svg).toHaveClass('w-6', 'h-6')
  })

  it('should render with custom className when provided', () => {
    render(<KofiLogo className="w-10 h-10" />)
    const svg = screen.getByTestId('kofi-logo')
    expect(svg).toHaveClass('w-10', 'h-10')
    expect(svg).not.toHaveClass('w-6', 'h-6')
  })

  it('should spread additional props onto the SVG element', () => {
    render(<KofiLogo aria-label="ko-fi" role="img" />)
    const svg = screen.getByTestId('kofi-logo')
    expect(svg).toHaveAttribute('aria-label', 'ko-fi')
    expect(svg).toHaveAttribute('role', 'img')
  })
})
