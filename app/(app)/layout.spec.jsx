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

describe('AppLayout', () => {
  it('should render sidebar layout with provider, sidebar, top appbar, and children', () => {
    render(
      <AppLayout>
        <div data-testid="child-content">Test Content</div>
      </AppLayout>,
    )

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    expect(screen.getByTestId('top-appbar')).toBeInTheDocument()

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(main).toContainElement(screen.getByTestId('child-content'))
  })
})
