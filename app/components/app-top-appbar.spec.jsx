import { fireEvent, render, screen } from '@testing-library/react'

const mockUsePathname = jest.fn()
const mockRouterBack = jest.fn()
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ back: mockRouterBack }),
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
        'locationDetail.share': 'Share Location',
      }
      return translations[key] ?? key
    },
  }),
}))

jest.mock('lucide-react', () => ({
  ChevronLeft: props => <svg data-testid="icon-chevron-left" {...props} />,
  Share2: props => <svg data-testid="icon-share2" {...props} />,
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
    mockRouterBack.mockClear()
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

  it('should render mobile home appbar for /auckland/home', () => {
    mockUsePathname.mockReturnValue('/auckland/home')
    render(<TopAppbar />)
    expect(screen.queryByTestId('top-appbar-mobile-sub')).not.toBeInTheDocument()
    expect(screen.getByTestId('top-appbar-mobile-home')).toHaveTextContent('Better Weather for')
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
    expect(screen.queryByTestId('top-appbar-share')).not.toBeInTheDocument()
  })

  it('should render page title "7-Day Forecast" for /auckland/forecast', () => {
    mockUsePathname.mockReturnValue('/auckland/forecast')
    render(<TopAppbar />)
    expect(screen.queryByTestId('top-appbar-mobile-home')).not.toBeInTheDocument()
    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header).toHaveTextContent('7-Day Forecast')
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('7-Day Forecast')
    expect(screen.queryByTestId('top-appbar-share')).not.toBeInTheDocument()
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

  it('should render deslugified location name and use router.back() for /location/[name] routes', () => {
    mockUsePathname.mockReturnValue('/location/new-plymouth')
    render(<TopAppbar />)

    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header).toHaveTextContent('New Plymouth')
    const backButton = header.querySelector('[data-testid="top-appbar-back"]')
    expect(backButton.tagName).toBe('BUTTON')
    expect(backButton).toHaveAttribute('aria-label', 'Back')
    expect(backButton.querySelector('svg[data-testid="icon-chevron-left"]')).toBeInTheDocument()
    expect(backButton).not.toHaveAttribute('href')
    fireEvent.click(backButton)
    expect(mockRouterBack).toHaveBeenCalledTimes(1)

    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('New Plymouth')
    const desktopBack = desktop.querySelector('[data-testid="top-appbar-desktop-back"]')
    fireEvent.click(desktopBack)
    expect(mockRouterBack).toHaveBeenCalledTimes(2)

    const shareButtons = screen.getAllByTestId('top-appbar-share')
    expect(shareButtons).toHaveLength(2)
    shareButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label', 'Share Location')
      expect(btn.querySelector('svg[data-testid="icon-share2"]')).toBeInTheDocument()
    })
  })

  it('should render page title "Settings" for /settings', () => {
    mockUsePathname.mockReturnValue('/settings')
    render(<TopAppbar />)
    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header).toHaveTextContent('Settings')
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('Settings')
  })

  it('should render page title "About" for /about', () => {
    mockUsePathname.mockReturnValue('/about')
    render(<TopAppbar />)
    const header = screen.getByTestId('top-appbar-mobile-sub')
    expect(header).toHaveTextContent('About')
    const desktop = screen.getByTestId('top-appbar-desktop')
    expect(desktop.querySelector('h1')).toHaveTextContent('About')
  })

  it('should call navigator.share when share button is clicked', async () => {
    mockUsePathname.mockReturnValue('/location/mission-bay')
    const mockShare = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: mockShare, configurable: true })
    Object.defineProperty(document, 'title', { value: 'Mission Bay', configurable: true })

    render(<TopAppbar />)

    fireEvent.click(screen.getAllByTestId('top-appbar-share')[0])
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Mission Bay',
      url: window.location.href,
    })
    delete navigator.share
  })

  it('should fall back to clipboard copy when navigator.share is unavailable', async () => {
    mockUsePathname.mockReturnValue('/location/mission-bay')
    const originalShare = navigator.share
    delete navigator.share
    const mockWriteText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      configurable: true,
    })

    render(<TopAppbar />)

    fireEvent.click(screen.getAllByTestId('top-appbar-share')[0])
    expect(mockWriteText).toHaveBeenCalledWith(window.location.href)
    if (originalShare) navigator.share = originalShare
  })
})
