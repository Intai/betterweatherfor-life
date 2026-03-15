import { cookies } from 'next/headers'
import ActivitySelector from '@/app/(app)/components/activity-selector'
import ForecastDayList from '@/app/(app)/components/forecast-day-list'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { parsePreferences } from '@/app/utils/preferences-storage'
import { deslugify } from '@/app/utils/string'
import { getForecastsByCity } from '@/db/queries/forecasts'

export async function generateMetadata({ params }) {
  const { city } = await params
  const cityName = deslugify(city)

  return {
    title: `${cityName} 7-Day Forecast`,
    description: `7-day weather, tide, and sea conditions forecast for outdoor activities in ${cityName}.`,
    openGraph: {
      title: `${cityName} 7-Day Forecast`,
      description: `7-day weather, tide, and sea conditions forecast for outdoor activities in ${cityName}.`,
    },
  }
}

export default async function CityForecastPage({ params }) {
  const { city: citySlug } = await params
  const forecast = await getForecastsByCity(citySlug)
  const cookieStore = await cookies()
  const initialState = {
    ...parsePreferences(cookieStore.getAll()),
    isLoaded: true,
    citySlug,
    forecast,
  }

  return (
    <ForecastStoreProvider initialState={initialState}>
      <ActivitySelector />
      <ForecastDayList />
    </ForecastStoreProvider>
  )
}
