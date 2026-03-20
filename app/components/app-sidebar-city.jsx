'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, MapPin } from 'lucide-react'
import { deslugify } from '@/app/utils/string'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shadcn/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/shadcn/components/ui/sidebar'

/**
 * Renders a single city's collapsible accordion item within the sidebar.
 * Shows a MapPin icon, city name, and chevron. When expanded, displays
 * sub-nav links for Overview and 7-Day Forecast.
 *
 * @param {object} props
 * @param {string} props.slug - The city slug (e.g. "auckland")
 * @param {boolean} props.isOpen - Whether this city's accordion is expanded
 * @param {function} props.onToggle - Callback when the city trigger is clicked
 */
export default function AppSidebarCity({ slug, isOpen, onToggle }) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { isMobile, toggleSidebar } = useSidebar()

  const subNavItems = [
    { titleKey: 'sidebar.nav.overview', href: `/${slug}/home` },
    { titleKey: 'sidebar.nav.forecast', href: `/${slug}/forecast` },
  ]

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onToggle}
      data-testid="app-sidebar-city"
    >
      <SidebarMenuSubItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="h-auto py-3 pr-4 cursor-pointer"
            data-testid="app-sidebar-city-trigger"
          >
            <MapPin />
            <span>{deslugify(slug)}</span>
            <ChevronRight
              className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 pt-1 pr-0 pb-0">
            {subNavItems.map(item => (
              <SidebarMenuSubItem key={item.titleKey}>
                <SidebarMenuSubButton
                  asChild
                  isActive={pathname === item.href}
                  className="h-auto py-3"
                  data-testid="app-sidebar-city-sub-button"
                >
                  <Link
                    href={item.href}
                    className="pl-3"
                    onClick={isMobile ? toggleSidebar : undefined}
                  >
                    <span>{t(item.titleKey)}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}
