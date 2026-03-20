import { fireEvent, render, screen } from '@testing-library/react'
import AppSidebarCities from './app-sidebar-cities'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}))

const mockPathname = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

jest.mock('lucide-react', () => ({
  ChevronRight: props => <svg data-testid="icon-chevron-right" {...props} />,
  Globe: () => <svg data-testid="icon-globe" />,
}))

const mockCitySlugs = jest.fn()
jest.mock('@/app/(app)/stores/cities-store', () => ({
  useCitiesStore: selector => selector({ citySlugs: mockCitySlugs() }),
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
  SidebarMenuItem: ({ children }) => <li>{children}</li>,
  SidebarMenuButton: ({ children, isActive, asChild: _asChild, className, ...props }) => (
    <div data-active={isActive} data-testid={props['data-testid']} className={className}>
      {children}
    </div>
  ),
  SidebarMenuSub: ({ children }) => <ul data-testid="sidebar-menu-sub">{children}</ul>,
}))

jest.mock('./app-sidebar-city', () => {
  return function MockAppSidebarCity({ slug, isOpen, onToggle }) {
    return (
      <li
        data-testid="app-sidebar-city"
        data-slug={slug}
        data-open={isOpen}
        onClick={onToggle}
      >
        {slug}
      </li>
    )
  }
})

describe('AppSidebarCities', () => {
  beforeEach(() => {
    mockCitySlugs.mockReturnValue(['auckland', 'wellington'])
    mockPathname.mockReturnValue('/home')
  })

  it('should render the Cities trigger with Globe icon, label, and chevron, and list all city items', () => {
    render(<AppSidebarCities />)
    expect(screen.getByTestId('icon-globe')).toBeInTheDocument()
    expect(screen.getByText('sidebar.nav.cities')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar-cities')).toHaveAttribute('data-open', 'false')
    expect(screen.getByTestId('icon-chevron-right').getAttribute('class')).not.toContain('rotate-90')

    const cityItems = screen.getAllByTestId('app-sidebar-city')
    expect(cityItems).toHaveLength(2)
    expect(cityItems[0]).toHaveAttribute('data-slug', 'auckland')
    expect(cityItems[1]).toHaveAttribute('data-slug', 'wellington')
  })

  it('should auto-expand the collapsible and matching city when pathname is a city route', () => {
    mockPathname.mockReturnValue('/auckland/home')
    render(<AppSidebarCities />)
    expect(screen.getByTestId('app-sidebar-cities')).toHaveAttribute('data-open', 'true')
    expect(screen.getByTestId('icon-chevron-right').getAttribute('class')).toContain('rotate-90')

    const cityItems = screen.getAllByTestId('app-sidebar-city')
    expect(cityItems[0]).toHaveAttribute('data-open', 'true')
    expect(cityItems[1]).toHaveAttribute('data-open', 'false')
  })

  it('should toggle city accordion so only one city is open at a time', () => {
    render(<AppSidebarCities />)
    const cityItems = screen.getAllByTestId('app-sidebar-city')
    expect(cityItems[0]).toHaveAttribute('data-open', 'false')
    expect(cityItems[1]).toHaveAttribute('data-open', 'false')

    fireEvent.click(cityItems[0])
    expect(cityItems[0]).toHaveAttribute('data-open', 'true')
    expect(cityItems[1]).toHaveAttribute('data-open', 'false')

    fireEvent.click(cityItems[1])
    expect(cityItems[0]).toHaveAttribute('data-open', 'false')
    expect(cityItems[1]).toHaveAttribute('data-open', 'true')
  })

  it('should close the open city when its toggle is clicked again', () => {
    mockPathname.mockReturnValue('/auckland/home')
    render(<AppSidebarCities />)
    const cityItems = screen.getAllByTestId('app-sidebar-city')
    expect(cityItems[0]).toHaveAttribute('data-open', 'true')

    fireEvent.click(cityItems[0])
    expect(cityItems[0]).toHaveAttribute('data-open', 'false')
  })

  it('should render an empty sub menu when there are no city slugs', () => {
    mockCitySlugs.mockReturnValue([])
    render(<AppSidebarCities />)
    expect(screen.getByTestId('sidebar-menu-sub')).toBeInTheDocument()
    expect(screen.queryByTestId('app-sidebar-city')).not.toBeInTheDocument()
  })
})
