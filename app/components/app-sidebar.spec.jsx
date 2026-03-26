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
        'sidebar.closeMenu': 'Close menu',
        'sidebar.version': `Version ${opts?.version ?? ''}`,
        'sidebar.community.buyMeACoffee': 'Buy me a coffee',
        'sidebar.community.joinDiscord': 'Join our Discord',
      }
      return translations[key] ?? key
    },
  }),
}))

jest.mock('lucide-react', () => ({
  Home: () => <svg data-testid="icon-home" />,
  Calendar: () => <svg data-testid="icon-calendar" />,
  X: () => <svg data-testid="icon-x" />,
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: props => <button {...props} />,
}))

jest.mock('./ko-fi-logo', () => {
  return function KofiLogo() {
    return <svg data-testid="kofi-logo" />
  }
})

jest.mock('./discord-logo', () => {
  return function DiscordLogo() {
    return <svg data-testid="discord-logo" />
  }
})

jest.mock('./app-sidebar-cities', () => {
  return function AppSidebarCities() {
    return <li data-testid="app-sidebar-cities">Cities</li>
  }
})

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  Sidebar: ({ children }) => <div data-testid="sidebar">{children}</div>,
  SidebarHeader: ({ children, className }) => <div data-testid="sidebar-header" className={className}>{children}</div>,
  SidebarContent: ({ children }) => <div data-testid="sidebar-content">{children}</div>,
  SidebarFooter: ({ children }) => <div data-testid="sidebar-footer">{children}</div>,
  SidebarGroup: ({ children, className }) => <div data-testid="sidebar-group" className={className}>{children}</div>,
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

  })

  it('should render AppSidebarCities between nav groups', () => {
    render(<AppSidebar />)
    expect(screen.getByTestId('app-sidebar-cities')).toBeInTheDocument()

    // Verify ordering: Home, Forecast, Cities
    const menuItems = screen.getAllByRole('list')[0].children
    const texts = Array.from(menuItems).map(li => li.textContent)
    expect(texts).toEqual([
      'Home',
      '7-Day Forecast',
      'Cities',
    ])
  })

  it('should highlight the active route based on pathname', () => {
    mockUsePathname.mockReturnValue('/forecast')
    render(<AppSidebar />)
    const buttons = screen.getAllByTestId('menu-button')
    expect(buttons[0]).toHaveAttribute('data-active', 'false')
    expect(buttons[1]).toHaveAttribute('data-active', 'true')
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

  it('should render community links with correct hrefs, icons, labels, and external link attributes', () => {
    render(<AppSidebar />)
    const kofiLink = screen.getByText('Buy me a coffee').closest('a')
    expect(kofiLink).toHaveAttribute('href', 'https://ko-fi.com/P5P414B69G')
    expect(kofiLink).toHaveAttribute('target', '_blank')
    expect(kofiLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByTestId('kofi-logo')).toBeInTheDocument()

    const discordLink = screen.getByText('Join our Discord').closest('a')
    expect(discordLink).toHaveAttribute('href', 'https://discord.gg/Ve3TeBqZQ7')
    expect(discordLink).toHaveAttribute('target', '_blank')
    expect(discordLink).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByTestId('discord-logo')).toBeInTheDocument()
  })

  it('should not call toggleSidebar when a community link is clicked on mobile', () => {
    mockIsMobile.mockReturnValue(true)
    render(<AppSidebar />)
    fireEvent.click(screen.getByText('Buy me a coffee').closest('a'))
    expect(mockToggleSidebar).not.toHaveBeenCalled()
  })
})
