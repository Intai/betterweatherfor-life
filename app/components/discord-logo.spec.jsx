import { render, screen } from '@testing-library/react'
import DiscordLogo from './discord-logo'

describe('DiscordLogo', () => {
  it('should render with default className when none is provided', () => {
    render(<DiscordLogo />)
    const svg = screen.getByTestId('discord-logo')
    expect(svg).toHaveClass('w-6', 'h-6')
  })

  it('should render with custom className when provided', () => {
    render(<DiscordLogo className="w-10 h-10" />)
    const svg = screen.getByTestId('discord-logo')
    expect(svg).toHaveClass('w-10', 'h-10')
    expect(svg).not.toHaveClass('w-6', 'h-6')
  })

  it('should spread additional props onto the SVG element', () => {
    render(<DiscordLogo aria-label="discord" role="img" />)
    const svg = screen.getByTestId('discord-logo')
    expect(svg).toHaveAttribute('aria-label', 'discord')
    expect(svg).toHaveAttribute('role', 'img')
  })
})
