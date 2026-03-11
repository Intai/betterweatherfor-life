import { cookies } from 'next/headers'
import ActivitySelector from '@/app/(app)/components/activity-selector'
import LocationList from '@/app/(app)/components/location-list'
import TimeWindowPicker from '@/app/(app)/components/time-window-picker'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { pickPreferences } from '@/app/utils/preferences-storage'
import { deslugify } from '@/app/utils/string'
import { getForecastsByCity } from '@/db/queries/forecasts'

export async function generateMetadata({ params }) {
  const { city: citySlug } = await params
  const cityName = deslugify(citySlug)

  return {
    title: `${cityName} - Best Outdoor Spots`,
    description: `Find the best spots for SUP, kayaking, snorkeling, and cycling in ${cityName} based on current weather and sea conditions.`,
    openGraph: {
      title: `${cityName} - Best Outdoor Spots`,
      description: `Find the best spots for SUP, kayaking, snorkeling, and cycling in ${cityName} based on current weather and sea conditions.`,
    },
  }
}

export default async function CityHomePage({ params }) {
  const { city: citySlug } = await params
  const forecast = await getForecastsByCity(citySlug)
  const cookieStore = await cookies()
  const initialState = {
    ...pickPreferences(cookieStore.getAll()),
    isLoaded: true,
    citySlug,
    forecast,
  }

  return (
    <ForecastStoreProvider initialState={initialState}>
      <ActivitySelector />
      <TimeWindowPicker />
      <LocationList />
    </ForecastStoreProvider>
  )
}
