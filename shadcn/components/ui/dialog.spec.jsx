import { render, screen } from '@testing-library/react'

jest.mock('radix-ui', () => {
  const React = require('react')
  const createSlot = displayName => {
    const Comp = React.forwardRef(({ children, ...props }, ref) => (
      <div data-testid={displayName} ref={ref} {...props}>{children}</div>
    ))
    Comp.displayName = displayName
    return Comp
  }
  return {
    Dialog: {
      Root: ({ children, ...props }) => <div data-testid="dialog-root" {...props}>{children}</div>,
      Trigger: createSlot('dialog-trigger'),
      Close: createSlot('dialog-close'),
      Portal: ({ children }) => <div data-testid="dialog-portal">{children}</div>,
      Overlay: createSlot('dialog-overlay'),
      Content: createSlot('dialog-content'),
      Title: createSlot('dialog-title'),
      Description: createSlot('dialog-description'),
    },
  }
})

jest.mock('lucide-react', () => ({
  XIcon: props => <svg data-testid="x-icon" {...props} />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

import { DialogContent } from './dialog'

describe('DialogContent', () => {
  it('should slide in from bottom on mobile and fade/zoom on sm breakpoint', () => {
    render(<DialogContent><span>content</span></DialogContent>)

    const content = screen.getByTestId('dialog-content')
    expect(content).toHaveClass('inset-x-0', 'bottom-0', 'rounded-t-xl', 'border-t')
    expect(content).toHaveClass('sm:inset-auto', 'sm:top-1/2', 'sm:left-1/2', 'sm:rounded-lg', 'sm:max-w-lg')
    expect(content).toHaveClass(
      'data-[state=open]:slide-in-from-bottom',
      'data-[state=closed]:slide-out-to-bottom',
    )
    expect(content).toHaveClass(
      'sm:data-[state=open]:fade-in-0',
      'sm:data-[state=closed]:fade-out-0',
      'sm:data-[state=open]:zoom-in-95',
      'sm:data-[state=closed]:zoom-out-95',
    )
  })

  it('should use flex column layout instead of grid', () => {
    render(<DialogContent><span>content</span></DialogContent>)

    const content = screen.getByTestId('dialog-content')
    expect(content).toHaveClass('flex', 'flex-col')
    expect(content).not.toHaveClass('grid')
  })
})
