import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('lucide-react', () => ({
  MapPin: props => <svg data-testid="map-pin-icon" {...props} />,
}))

import LocationListEmpty from './location-list-empty'

describe('LocationListEmpty', () => {
  it('should render the translated empty title and subtitle text', () => {
    render(<LocationListEmpty />)

    const icon = screen.getByTestId('map-pin-icon')
    expect(icon).toBeInTheDocument()
    const heading = screen.getByText('title')
    expect(heading.tagName).toBe('H3')
    expect(heading).toHaveClass('text-lg', 'font-semibold')
    const subtitle = screen.getByText('subtitle')
    expect(subtitle.tagName).toBe('P')
    expect(subtitle).toHaveClass('text-muted-foreground', 'text-sm', 'text-center')
  })
})
