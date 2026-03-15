'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ChevronLeft, Share2 } from 'lucide-react'
import { deslugify } from '@/app/utils/string'
import { SidebarTrigger } from '@/shadcn/components/ui/sidebar'
import AppLogo from './app-logo'

function getTitle(pathname, t) {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments.at(0)
  const last = segments.at(-1)
  if (last === 'home') return t('sidebar.nav.home')
  if (last === 'forecast') return t('sidebar.nav.forecast')
  if (first === 'settings') return t('sidebar.nav.settings')
  if (first === 'about') return t('sidebar.nav.about')
  if (first === 'location') return deslugify(segments[1])
  return ''
}

const renderMobileHome = ({ t }) => (
  <header
    className="sticky top-0 z-50 xl:hidden bg-linear-to-r from-primary to-primary-light text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg"
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

async function handleShare() {
  const shareData = {
    title: document.title,
    url: window.location.href,
  }

  if (navigator.share) {
    await navigator.share(shareData)
  } else {
    await navigator.clipboard.writeText(shareData.url)
  }
}

const renderShareButton = ({ t }) => (
  <button
    onClick={handleShare}
    aria-label={t('locationDetail.share')}
    className="ml-auto text-primary-foreground"
    data-testid="top-appbar-share"
  >
    <Share2 className="w-5 h-5" />
  </button>
)

const renderMobileSub = ({ t, pathname, router, city }) => {
  const title = getTitle(pathname, t)
  const isLocationRoute = pathname.includes('/location/')
  return (
    <header
      className="sticky top-0 z-50 xl:hidden bg-linear-to-r from-primary to-primary-light text-primary-foreground px-4 py-3 flex items-center gap-3 shadow-lg"
      data-testid="top-appbar-mobile-sub"
    >
      {isLocationRoute ? (
        <button onClick={() => router.back()} aria-label={t('topAppbar.back')} data-testid="top-appbar-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
      ) : (
        <Link href={city ? `/${city}/home` : '/home'} aria-label={t('topAppbar.back')} data-testid="top-appbar-back">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      )}
      <span className="font-semibold text-lg tracking-tight">
        {title}
      </span>

      {isLocationRoute && renderShareButton({ t })}
    </header>
  )
}

const renderDesktop = ({ t, pathname, router }) => {
  const title = getTitle(pathname, t)
  const isLocationRoute = pathname.includes('/location/')
  return (
    <header
      className="sticky top-0 z-40 hidden xl:flex bg-linear-to-r from-primary to-primary-light text-primary-foreground px-6 py-3 shadow-lg items-center gap-3"
      data-testid="top-appbar-desktop"
    >
      {isLocationRoute && (
        <button onClick={() => router.back()} aria-label={t('topAppbar.back')} data-testid="top-appbar-desktop-back">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="font-semibold text-lg tracking-tight">
        {title}
      </h1>

      {isLocationRoute && renderShareButton({ t })}
    </header>
  )
}

export default function TopAppbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { city } = useParams()
  const { t } = useTranslation()

  return (
    <>
      {pathname.endsWith('/home')
        ? renderMobileHome({ t })
        : renderMobileSub({ t, pathname, router, city })}
      {renderDesktop({ t, pathname, router })}
    </>
  )
}
