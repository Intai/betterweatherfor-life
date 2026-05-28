import { cookies } from 'next/headers'
import ActivitySelector from '@/app/(app)/components/activity-selector'
import ForecastDayList from '@/app/(app)/components/forecast-day-list'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { parsePreferences } from '@/app/utils/preferences-storage'

export default async function ForecastPage() {
  const cookieStore = await cookies()
  const initialState = parsePreferences(cookieStore.getAll())

  return (
    <ForecastStoreProvider initialState={initialState}>
      <ActivitySelector />
      <ForecastDayList />
    </ForecastStoreProvider>
  )
}
