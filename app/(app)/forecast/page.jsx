'use client'

import ActivitySelector from '@/app/(app)/components/activity-selector'
import ForecastDayList from '@/app/(app)/components/forecast-day-list'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'

export default function ForecastPage() {
  return (
    <ForecastStoreProvider>
      <ActivitySelector />
      <ForecastDayList />
    </ForecastStoreProvider>
  )
}
