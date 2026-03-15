import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('lucide-react', () => ({
  CalendarDays: props => <svg data-testid="calendar-icon" {...props} />,
  Home: props => <svg data-testid="home-icon" {...props} />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

import ForecastDayListEmpty from './forecast-day-list-empty'

describe('ForecastDayListEmpty', () => {
  it('should render icon, title, subtitle, and Go Home button linking to /home', () => {
    render(<ForecastDayListEmpty />)

    expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
    const heading = screen.getByText('title')
    expect(heading.tagName).toBe('H3')
    expect(heading).toHaveClass('text-lg', 'font-semibold')
    const subtitle = screen.getByText('subtitle')
    expect(subtitle.tagName).toBe('P')
    expect(subtitle).toHaveClass('text-muted-foreground', 'text-sm', 'text-center')
    const goHomeButton = screen.getByTestId('go-home-button')
    expect(goHomeButton.closest('a')).toHaveAttribute('href', '/home')
  })
})
