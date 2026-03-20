import { render, screen } from '@testing-library/react'
import AppLayout from './layout'

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarInset: ({ children }) => <div data-testid="sidebar-inset">{children}</div>,
}))

jest.mock('@/app/components/app-sidebar', () => {
  return function MockAppSidebar() {
    return <div data-testid="app-sidebar" />
  }
})

jest.mock('@/app/components/app-top-appbar', () => {
  return function MockTopAppbar() {
    return <div data-testid="top-appbar" />
  }
})

jest.mock('@/app/(app)/stores/cities-store', () => ({
  CitiesStoreProvider: ({ children, initialState }) => (
    <div data-testid="cities-store-provider" data-initial-state={JSON.stringify(initialState)}>
      {children}
    </div>
  ),
}))

jest.mock('@/db/queries/locations', () => ({
  getCitySlugs: jest.fn(),
}))

const { getCitySlugs } = require('@/db/queries/locations')

describe('AppLayout', () => {
  beforeEach(() => {
    getCitySlugs.mockResolvedValue(['auckland', 'wellington'])
  })

  it('should render sidebar layout with cities store provider and children', async () => {
    const Layout = await AppLayout({ children: <div data-testid="child-content">Test Content</div> })
    render(Layout)

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('cities-store-provider')).toBeInTheDocument()
    expect(JSON.parse(screen.getByTestId('cities-store-provider').dataset.initialState))
      .toEqual({ citySlugs: ['auckland', 'wellington'] })
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    expect(screen.getByTestId('top-appbar')).toBeInTheDocument()

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(main).toContainElement(screen.getByTestId('child-content'))
  })
})
