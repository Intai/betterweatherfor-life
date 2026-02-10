import { fireEvent, render, screen } from '@testing-library/react'

const mockUsePathname = jest.fn()
const mockIsMobile = jest.fn()
const mockToggleSidebar = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

jest.mock('next/link', () => {
  return function MockLink({ href, children, onClick }) {
    return <a href={href} onClick={onClick}>{children}</a>
  }
})

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const translations = {
        'sidebar.appName': 'Better Weather for',
        'sidebar.nav.home': 'Home',
        'sidebar.nav.forecast': '7-Day Forecast',
        'sidebar.nav.settings': 'Settings',
        'sidebar.nav.about': 'About',
        'sidebar.closeMenu': 'Close menu',
        'sidebar.version': `Version ${opts?.version ?? ''}`,
      }
      return translations[key] ?? key
    },
  }),
}))

jest.mock('lucide-react', () => ({
  Home: () => <svg data-testid="icon-home" />,
  Calendar: () => <svg data-testid="icon-calendar" />,
  Settings: () => <svg data-testid="icon-settings" />,
  Info: () => <svg data-testid="icon-info" />,
  X: () => <svg data-testid="icon-x" />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: (props) => <button {...props} />,
}))

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  Sidebar: ({ children }) => <div data-testid="sidebar">{children}</div>,
  SidebarHeader: ({ children, className }) => <div data-testid="sidebar-header" className={className}>{children}</div>,
  SidebarContent: ({ children }) => <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarGroup: ({ children }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }) => <div>{children}</div>,
  SidebarMenu: ({ children }) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }) => <li>{children}</li>,
  SidebarMenuButton: ({ children, isActive }) => <div data-testid="menu-button" data-active={isActive}>{children}</div>,
  useSidebar: () => ({ isMobile: mockIsMobile(), toggleSidebar: mockToggleSidebar }),
}))

import AppSidebar from './app-sidebar'

describe('AppSidebar', () => {
  beforeEach(() => {
    process.env.BUILD = '1.2.3'
    mockUsePathname.mockReturnValue('/home')
    mockIsMobile.mockReturnValue(false)
    mockToggleSidebar.mockClear()
  })

  it('should render the sidebar header with app logo and name', () => {
    render(<AppSidebar />)
    const header = screen.getByTestId('sidebar-header')
    expect(header).toHaveClass('bg-linear-to-r', 'from-primary', 'to-primary-light', 'px-4', 'py-3')
    expect(header.querySelector('svg[data-testid="app-logo"]')).toBeInTheDocument()
    expect(screen.getByText('Better Weather for')).toBeInTheDocument()
  })

  it('should render all navigation items with correct hrefs and icons', () => {
    render(<AppSidebar />)
    const homeLink = screen.getByText('Home').closest('a')
    expect(homeLink).toHaveAttribute('href', '/home')
    expect(screen.getByTestId('icon-home')).toBeInTheDocument()

    const forecastLink = screen.getByText('7-Day Forecast').closest('a')
    expect(forecastLink).toHaveAttribute('href', '/forecast')
    expect(screen.getByTestId('icon-calendar')).toBeInTheDocument()

    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/settings')
    expect(screen.getByTestId('icon-settings')).toBeInTheDocument()

    const aboutLink = screen.getByText('About').closest('a')
    expect(aboutLink).toHaveAttribute('href', '/about')
    expect(screen.getByTestId('icon-info')).toBeInTheDocument()
  })

  it('should highlight the active route based on pathname', () => {
    mockUsePathname.mockReturnValue('/forecast')
    render(<AppSidebar />)
    const buttons = screen.getAllByTestId('menu-button')
    expect(buttons[0]).toHaveAttribute('data-active', 'false')
    expect(buttons[1]).toHaveAttribute('data-active', 'true')
    expect(buttons[2]).toHaveAttribute('data-active', 'false')
    expect(buttons[3]).toHaveAttribute('data-active', 'false')
  })

  it('should call toggleSidebar when close button is clicked', () => {
    render(<AppSidebar />)
    const closeButton = screen.getByTestId('app-sidebar-close-button')
    expect(closeButton).toHaveAttribute('aria-label', 'Close menu')
    expect(closeButton.querySelector('svg[data-testid="icon-x"]')).toBeInTheDocument()
    fireEvent.click(closeButton)
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('should render the build version in the footer', () => {
    render(<AppSidebar />)
    expect(screen.getByText('Version 1.2.3')).toBeInTheDocument()
    const footer = screen.getByTestId('sidebar-footer')
    expect(footer).toContainElement(screen.getByText('Version 1.2.3'))
  })

  it('should call toggleSidebar when a menu link is clicked on mobile', () => {
    mockIsMobile.mockReturnValue(true)
    render(<AppSidebar />)
    fireEvent.click(screen.getByText('Home').closest('a'))
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('should not call toggleSidebar when a menu link is clicked on desktop', () => {
    mockIsMobile.mockReturnValue(false)
    render(<AppSidebar />)
    fireEvent.click(screen.getByText('Home').closest('a'))
    expect(mockToggleSidebar).not.toHaveBeenCalled()
  })
})
