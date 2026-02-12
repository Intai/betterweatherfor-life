'use client'

import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'

export default function LocationListEmpty() {
  const { t } = useTranslation()

  return (
    <section className="px-4 md:px-6 pb-6 flex-1" data-testid="location-list-empty">
      <div className="flex flex-col items-center justify-center py-16 md:py-20 px-6">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <MapPin className="w-10 h-10 text-muted-foreground" data-testid="map-pin-icon" />
        </div>
        <h3 className="text-lg font-semibold mb-1">
          {t('home.locations.empty.title')}
        </h3>
        <p className="text-muted-foreground text-sm text-center mb-6">
          {t('home.locations.empty.subtitle')}
        </p>
      </div>
    </section>
  )
}
