import AppSidebar from '@/app/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/shadcn/components/ui/sidebar'

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex items-center bg-linear-to-r from-primary to-primary-light text-white px-4 py-3 shadow-lg md:hidden">
          <SidebarTrigger className="-ml-1 text-sidebar-primary-foreground" data-testid="app-sidebar-trigger" />
        </header>
        <main>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
