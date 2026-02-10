import AppSidebar from '@/app/components/app-sidebar'
import TopAppbar from '@/app/components/app-top-appbar'
import { SidebarInset, SidebarProvider } from '@/shadcn/components/ui/sidebar'

export default function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopAppbar />
        <main>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
