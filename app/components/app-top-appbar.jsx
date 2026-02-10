'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { SidebarTrigger } from '@/shadcn/components/ui/sidebar'
import AppLogo from './app-logo'

const navItems = {
  '/home': { titleKey: 'sidebar.nav.home' },
  '/forecast': { titleKey: 'sidebar.nav.forecast' },
  '/settings': { titleKey: 'sidebar.nav.settings' },
  '/about': { titleKey: 'sidebar.nav.about' },
}

const renderMobileHome = ({ t }) => (
  <header
    className="sticky top-0 z-50 bg-linear-to-r from-primary to-primary-light text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg"
    data-testid="top-appbar-mobile-home"
  >
    <div className="flex items-center gap-2">
      <AppLogo className="w-6 h-6" />
      <span className="font-semibold text-lg tracking-tight">
        {t('sidebar.appName')}
      </span>
    </div>
    <SidebarTrigger
      className="-ml-1 text-sidebar-primary-foreground"
      data-testid="app-sidebar-trigger"
    />
  </header>
)

const renderMobileSub = ({ t, pathname }) => (
  <header
    className="sticky top-0 z-50 bg-linear-to-r from-primary to-primary-light text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg"
    data-testid="top-appbar-mobile-sub"
  >
    <Link href="/home" aria-label={t('topAppbar.back')} data-testid="top-appbar-back">
      <ChevronLeft className="w-5 h-5" />
    </Link>
    <span className="font-semibold text-lg tracking-tight">
      {navItems[pathname] ? t(navItems[pathname].titleKey) : ''}
    </span>
  </header>
)

const renderDesktop = ({ t, pathname }) => (
  <header
    className="sticky top-0 z-40 bg-linear-to-r from-primary to-primary-light text-primary-foreground px-6 py-3 shadow-lg flex"
    data-testid="top-appbar-desktop"
  >
    <h1 className="font-semibold text-lg tracking-tight">
      {navItems[pathname] ? t(navItems[pathname].titleKey) : ''}
    </h1>
  </header>
)

export default function TopAppbar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <>
      <div className="xl:hidden">
        {pathname === '/home'
          ? renderMobileHome({ t })
          : renderMobileSub({ t, pathname })}
      </div>
      <div className="hidden xl:block">
        {renderDesktop({ t, pathname })}
      </div>
    </>
  )
}
