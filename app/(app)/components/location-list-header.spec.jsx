import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, variant, ...props }) => (
    <button data-variant={variant} {...props}>{children}</button>
  ),
}))

jest.mock('lucide-react', () => ({
  Plus: props => <svg data-testid="plus-icon" {...props} />,
}))

import LocationListHeader from './location-list-header'

describe('LocationListHeader', () => {
  it('should render the locations heading with translated text', () => {
    render(<LocationListHeader />)

    const heading = screen.getByTestId('locations-heading')
    expect(heading).toHaveTextContent('title')
    expect(heading.tagName).toBe('H2')
  })

  it('should render the add location button with translated aria-label', () => {
    render(<LocationListHeader />)

    const button = screen.getByTestId('add-location-button')
    expect(button).toHaveAttribute('aria-label', 'addLocation')
    expect(button).toHaveAttribute('data-variant', 'outline')
    expect(button).toHaveClass('rounded-full')
    const icon = screen.getByTestId('plus-icon')
    expect(button).toContainElement(icon)
  })
})
