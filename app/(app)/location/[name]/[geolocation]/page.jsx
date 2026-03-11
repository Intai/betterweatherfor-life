import { cookies } from 'next/headers'
import LocationDetail from '@/app/(app)/components/location-detail'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { splitLocationKey } from '@/app/utils/forecast'
import { pickPreferences } from '@/app/utils/preferences-storage'
import { deslugify } from '@/app/utils/string'
import { getForecastsByLocations } from '@/db/queries/forecasts'

export async function generateMetadata({ params }) {
  const { name: nameSlug } = await params
  const locationName = deslugify(nameSlug)

  return {
    title: `${locationName} - Weather & Conditions`,
    description: `View detailed weather, tide, and sea conditions for ${locationName}. Find the best time for SUP, kayaking, snorkeling, and cycling.`,
    openGraph: {
      title: `${locationName} - Weather & Conditions`,
      description: `View detailed weather, tide, and sea conditions for ${locationName}. Find the best time for SUP, kayaking, snorkeling, and cycling.`,
    },
  }
}

export default async function LocationDetailPage({ params }) {
  const { geolocation: encoded } = await params
  const geolocation = decodeURIComponent(encoded)
  const latLng = splitLocationKey(geolocation)
  const forecast = await getForecastsByLocations([latLng])
  const cookieStore = await cookies()
  const initialState = {
    ...pickPreferences(cookieStore.getAll()),
    isLoaded: true,
    forecast,
  }

  return (
    <ForecastStoreProvider initialState={initialState}>
      <LocationDetail geolocation={geolocation} />
    </ForecastStoreProvider>
  )
}
