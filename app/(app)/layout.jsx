import { CitiesStoreProvider } from '@/app/(app)/stores/cities-store'
import AppSidebar from '@/app/components/app-sidebar'
import TopAppbar from '@/app/components/app-top-appbar'
import { getCitySlugs } from '@/db/queries/locations'
import { SidebarInset, SidebarProvider } from '@/shadcn/components/ui/sidebar'

export default async function AppLayout({ children }) {
  const citySlugs = await getCitySlugs()

  return (
    <CitiesStoreProvider initialState={{ citySlugs }}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopAppbar />
          <main>
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </CitiesStoreProvider>
  )
}
