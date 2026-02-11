import ActivitySelector from '@/app/(app)/components/activity-selector'
import TimeWindowPicker from '@/app/(app)/components/time-window-picker'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'

export default function HomePage() {
  return (
    <ForecastStoreProvider>
      <ActivitySelector />
      <TimeWindowPicker />
    </ForecastStoreProvider>
  )
}
