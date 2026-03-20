'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, Info, Settings, X } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shadcn/components/ui/sidebar'
import AppLogo from './app-logo'
import AppSidebarCities from './app-sidebar-cities'

const navItemsBefore = [
  { titleKey: 'sidebar.nav.home', href: '/home', icon: Home },
  { titleKey: 'sidebar.nav.forecast', href: '/forecast', icon: Calendar },
]

const navItemsAfter = [
  { titleKey: 'sidebar.nav.settings', href: '/settings', icon: Settings },
  { titleKey: 'sidebar.nav.about', href: '/about', icon: Info },
]

function renderNavItems({ pathname, t, isMobile, toggleSidebar, items }) {
  return items.map(item => (
    <SidebarMenuItem key={item.titleKey}>
      <SidebarMenuButton
        asChild
        isActive={pathname === item.href}
        className="h-auto px-4 py-3"
        data-testid="app-sidebar-menu-button"
      >
        <Link href={item.href} onClick={isMobile ? toggleSidebar : undefined}>
          <item.icon />
          <span>{t(item.titleKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))
}

export default function AppSidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { isMobile, toggleSidebar } = useSidebar()
  const navProps = { pathname, t, isMobile, toggleSidebar }

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="bg-linear-to-r from-primary to-primary-light px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppLogo className="w-6 h-6 text-sidebar-primary-foreground" />
            <span
              className="font-semibold text-lg tracking-tight text-sidebar-primary-foreground"
              data-testid="app-sidebar-name"
            >
              {t('sidebar.appName')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 -mr-1 text-sidebar-primary-foreground xl:hidden"
            aria-label={t('sidebar.closeMenu')}
            onClick={toggleSidebar}
            data-testid="app-sidebar-close-button"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderNavItems({ ...navProps, items: navItemsBefore })}
              <AppSidebarCities />
              {renderNavItems({ ...navProps, items: navItemsAfter })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter
        className="px-4 py-4 border-t border-sidebar-border"
        data-testid="app-sidebar-footer"
      >
        <p className="text-xs text-sidebar-foreground/50 text-center">{t('sidebar.version', { version: process.env.BUILD })}</p>
      </SidebarFooter>
    </Sidebar>
  )
}
