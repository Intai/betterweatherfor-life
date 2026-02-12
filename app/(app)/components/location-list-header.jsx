'use client'

import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'

export default function LocationListHeader() {
  const { t } = useTranslation()

  return (
    <section className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
      <h2
        className="text-lg md:text-xl font-semibold"
        data-testid="locations-heading"
      >
        {t('home.locations.title')}
      </h2>
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        aria-label={t('home.locations.addLocation')}
        data-testid="add-location-button"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </section>
  )
}
