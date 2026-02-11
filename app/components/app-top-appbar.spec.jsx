import { render, screen } from '@testing-library/react'

const mockUsePathname = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => {
      const translations = {
        'sidebar.appName': 'Better Weather for',
        'sidebar.nav.home': 'Home',
        'sidebar.nav.forecast': '7-Day Forecast',
        'sidebar.nav.settings': 'Settings',
        'sidebar.nav.about': 'About',
        'topAppbar.back': 'Back',
      }
      return translations[key] ?? key
    },
  }),
}))

jest.mock('lucide-react', () => ({
  ChevronLeft: props => <svg data-testid="icon-chevron-left" {...props} />,
}))

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  SidebarTrigger: props => <button {...props} data-testid="sidebar-trigger" />,
}))

jest.mock('@/app/components/app-logo', () => {
  return function MockAppLogo(props) {
    return <svg data-testid="app-logo" {...props} />
  }
})

import TopAppbar from './app-top-appbar'

describe('TopAppbar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/home')
  })

  it('should render page title "Better Weather for" for /home', () => {
    render(<TopAppbar />)
    expect(screen.queryByTestId('top-appbar-mobile-sub')).not.toBeInTheDocument()
    expect(screen.queryByTestId('top-appbar-back')).not.toBeInTheDocument()
    const header = screen.getByTestId('top-appbar-mobile-home')
    expect(header.querySelector('svg[data-testid="app-logo"]')).toBeInTheDocument()
    expect(header).toHaveTextContent('Better Weather for')
    expect(header.querySelector('[data-testid="sidebar-trigger"]')).toBeInTheDocument()
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('Home')
  })

  it('should render page title "7-Day Forecast" for /forecast', () => {
    mockUsePathname.mockReturnValue('/forecast')
    render(<TopAppbar />)
    expect(screen.queryByTestId('top-appbar-mobile-home')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-trigger')).not.toBeInTheDocument()
    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header.querySelector('svg[data-testid="app-logo"]')).not.toBeInTheDocument()
    expect(header).toHaveTextContent('7-Day Forecast')
    const backLink = header.querySelector('[data-testid="top-appbar-back"]')
    expect(backLink).toHaveAttribute('href', '/home')
    expect(backLink).toHaveAttribute('aria-label', 'Back')
    expect(backLink.querySelector('svg[data-testid="icon-chevron-left"]')).toBeInTheDocument()
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('7-Day Forecast')
  })

  it('should render header with empty title for unknown route', () => {
    mockUsePathname.mockReturnValue('/unknown')
    render(<TopAppbar />)
    expect(screen.queryByTestId('top-appbar-mobile-home')).not.toBeInTheDocument()
    expect(screen.queryByTestId('sidebar-trigger')).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-logo')).not.toBeInTheDocument()
    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header).toHaveTextContent('')
    expect(header.querySelector('[data-testid="top-appbar-back"]')).toBeInTheDocument()
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('')
  })
})
