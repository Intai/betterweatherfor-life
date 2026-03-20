'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { ChevronRight, Globe } from 'lucide-react'
import { prop } from 'ramda'
import { useCitiesStore } from '@/app/(app)/stores/cities-store'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shadcn/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/shadcn/components/ui/sidebar'
import AppSidebarCity from './app-sidebar-city'

/**
 * Extracts the city slug from a pathname if it matches a city route.
 * City routes follow the pattern /{slug}/home or /{slug}/forecast.
 * @param {string} pathname - The current route pathname.
 * @param {string[]} citySlugs - Array of valid city slugs.
 * @returns {string|null} The matched city slug, or null if no match.
 */
function getCitySlugFromPathname(pathname, citySlugs) {
  const segment = pathname.split('/')[1]
  return citySlugs.includes(segment) ? segment : null
}

/**
 * Renders the Cities collapsible section in the sidebar.
 * Maps over city slugs from the cities store and renders an AppSidebarCity
 * for each one. Manages accordion state so only one city is expanded at a time.
 *
 * @param {object} props
 */
export default function AppSidebarCities() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const citySlugs = useCitiesStore(prop('citySlugs'))
  const [openCitySlug, setOpenCitySlug] = useState(() => getCitySlugFromPathname(pathname, citySlugs))
  const [isOpen, setIsOpen] = useState(() => !!openCitySlug)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      data-testid="app-sidebar-cities"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="h-auto px-4 py-3 cursor-pointer"
            data-testid="app-sidebar-cities-trigger"
          >
            <Globe />
            <span>{t('sidebar.nav.cities')}</span>
            <ChevronRight
              className={`ml-auto transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mr-0 py-0 pr-0">
            {citySlugs.map(citySlug => (
              <AppSidebarCity
                key={citySlug}
                slug={citySlug}
                isOpen={openCitySlug === citySlug}
                onToggle={() => setOpenCitySlug(prev => prev !== citySlug ? citySlug : null)}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
