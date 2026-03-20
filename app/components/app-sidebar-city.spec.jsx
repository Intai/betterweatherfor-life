import { fireEvent, render, screen } from '@testing-library/react'
import AppSidebarCity from './app-sidebar-city'

const mockIsMobile = jest.fn()
const mockToggleSidebar = jest.fn()
const mockPathname = jest.fn()

jest.mock('next/link', () => {
  return function MockLink({ href, children, onClick }) {
    return <a href={href} onClick={onClick}>{children}</a>
  }
})

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}))

jest.mock('lucide-react', () => ({
  ChevronRight: props => <svg data-testid="icon-chevron-right" {...props} />,
  MapPin: () => <svg data-testid="icon-map-pin" />,
}))

jest.mock('@/shadcn/components/ui/collapsible', () => ({
  Collapsible: ({ children, open, onOpenChange, ...props }) => (
    <div data-open={open} data-testid={props['data-testid']} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
  ),
  CollapsibleTrigger: ({ children, asChild: _asChild }) => _asChild ? children : <button>{children}</button>,
  CollapsibleContent: ({ children }) => <div data-testid="collapsible-content">{children}</div>,
}))

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  SidebarMenuButton: ({ children, className, ...props }) => (
    <button data-testid={props['data-testid']} className={className}>
      {children}
    </button>
  ),
  SidebarMenuSub: ({ children }) => <ul>{children}</ul>,
  SidebarMenuSubItem: ({ children }) => <li>{children}</li>,
  SidebarMenuSubButton: ({ children, isActive, asChild: _asChild, className, ...props }) => (
    <div data-active={isActive} data-testid={props['data-testid']} className={className}>
      {children}
    </div>
  ),
  useSidebar: () => ({ isMobile: mockIsMobile(), toggleSidebar: mockToggleSidebar }),
}))

describe('AppSidebarCity', () => {
  const defaultProps = {
    slug: 'auckland',
    isOpen: false,
    onToggle: jest.fn(),
  }

  beforeEach(() => {
    mockIsMobile.mockReturnValue(false)
    mockToggleSidebar.mockClear()
    mockPathname.mockReturnValue('/auckland/home')
    defaultProps.onToggle.mockClear()
  })

  it('should render the city name, icons, and sub-nav links with correct hrefs', () => {
    render(<AppSidebarCity {...defaultProps} isOpen />)
    expect(screen.getByText('Auckland')).toBeInTheDocument()
    expect(screen.getByTestId('icon-map-pin')).toBeInTheDocument()
    expect(screen.getByTestId('icon-chevron-right')).toBeInTheDocument()

    const overviewLink = screen.getByText('sidebar.nav.overview').closest('a')
    expect(overviewLink).toHaveAttribute('href', '/auckland/home')
    const forecastLink = screen.getByText('sidebar.nav.forecast').closest('a')
    expect(forecastLink).toHaveAttribute('href', '/auckland/forecast')

    const buttons = screen.getAllByTestId('app-sidebar-city-sub-button')
    expect(buttons[0]).toHaveAttribute('data-active', 'true')
    expect(buttons[1]).toHaveAttribute('data-active', 'false')
  })

  it('should highlight the active sub-nav item based on pathname', () => {
    mockPathname.mockReturnValue('/auckland/forecast')
    render(<AppSidebarCity {...defaultProps} isOpen />)
    const buttons = screen.getAllByTestId('app-sidebar-city-sub-button')
    expect(buttons[0]).toHaveAttribute('data-active', 'false')
    expect(buttons[1]).toHaveAttribute('data-active', 'true')
  })

  it('should rotate the chevron when isOpen is true', () => {
    const { rerender } = render(<AppSidebarCity {...defaultProps} isOpen={false} />)
    const chevron = screen.getByTestId('icon-chevron-right')
    expect(chevron.getAttribute('class')).not.toContain('rotate-90')

    rerender(<AppSidebarCity {...defaultProps} isOpen />)
    const chevronOpen = screen.getByTestId('icon-chevron-right')
    expect(chevronOpen.getAttribute('class')).toContain('rotate-90')
  })

  it('should call toggleSidebar when a sub-nav link is clicked on mobile', () => {
    mockIsMobile.mockReturnValue(true)
    render(<AppSidebarCity {...defaultProps} isOpen />)
    fireEvent.click(screen.getByText('sidebar.nav.overview').closest('a'))
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1)
  })

  it('should not call toggleSidebar when a sub-nav link is clicked on desktop', () => {
    mockIsMobile.mockReturnValue(false)
    render(<AppSidebarCity {...defaultProps} isOpen />)
    fireEvent.click(screen.getByText('sidebar.nav.overview').closest('a'))
    expect(mockToggleSidebar).not.toHaveBeenCalled()
  })

  it('should deslugify multi-word city slugs correctly', () => {
    render(<AppSidebarCity {...defaultProps} slug="new-plymouth" />)
    expect(screen.getByText('New Plymouth')).toBeInTheDocument()
  })
})
