import { cookies } from 'next/headers'
import ActivitySelector from '@/app/(app)/components/activity-selector'
import LocationList from '@/app/(app)/components/location-list'
import TimeWindowPicker from '@/app/(app)/components/time-window-picker'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { parsePreferences } from '@/app/utils/preferences-storage'

export default async function HomePage() {
  const cookieStore = await cookies()
  const initialState = parsePreferences(cookieStore.getAll())

  return (
    <ForecastStoreProvider initialState={initialState}>
      <ActivitySelector />
      <TimeWindowPicker />
      <LocationList />
    </ForecastStoreProvider>
  )
}
