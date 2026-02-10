import { render, screen } from '@testing-library/react'
import AppLogo from './app-logo'

describe('AppLogo', () => {
  it('should render with default className when none is provided', () => {
    render(<AppLogo />)
    const svg = screen.getByTestId('app-logo')
    expect(svg).toHaveClass('w-6', 'h-6')
  })

  it('should render with custom className when provided', () => {
    render(<AppLogo className="w-10 h-10" />)
    const svg = screen.getByTestId('app-logo')
    expect(svg).toHaveClass('w-10', 'h-10')
    expect(svg).not.toHaveClass('w-6', 'h-6')
  })

  it('should spread additional props onto the SVG element', () => {
    render(<AppLogo aria-label="logo" role="img" />)
    const svg = screen.getByTestId('app-logo')
    expect(svg).toHaveAttribute('aria-label', 'logo')
    expect(svg).toHaveAttribute('role', 'img')
  })
})
