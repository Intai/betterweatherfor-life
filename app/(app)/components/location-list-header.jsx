'use client'

import { useTranslation } from 'react-i18next'
import AddLocationModal from '@/app/(app)/components/add-location-modal'

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
      <AddLocationModal />
    </section>
  )
}
