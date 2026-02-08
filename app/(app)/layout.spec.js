import { render, screen } from '@testing-library/react'
import AppLayout from './layout'

jest.mock('@/shadcn/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }) => <div data-testid="sidebar-provider">{children}</div>,
  SidebarInset: ({ children }) => <div data-testid="sidebar-inset">{children}</div>,
  SidebarTrigger: (props) => <button {...props} data-testid="sidebar-trigger" />,
}))

jest.mock('@/app/components/app-sidebar', () => {
  return function MockAppSidebar() {
    return <div data-testid="app-sidebar" />
  }
})

describe('AppLayout', () => {
  it('should render sidebar layout with provider, sidebar, header trigger, and children', () => {
    render(
      <AppLayout>
        <div data-testid="child-content">Test Content</div>
      </AppLayout>,
    )

    expect(screen.getByTestId('sidebar-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-inset')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar-trigger')).toBeInTheDocument()

    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(main).toContainElement(screen.getByTestId('child-content'))
  })

  it('should render sticky header with mobile-only visibility class', () => {
    render(
      <AppLayout>
        <div>Content</div>
      </AppLayout>,
    )

    const header = screen.getByTestId('sidebar-trigger').closest('header')
    expect(header).toHaveClass('sticky', 'top-0', 'z-40', 'md:hidden')
    expect(header).toHaveClass('bg-linear-to-r', 'from-primary', 'to-primary-light')
  })
})
