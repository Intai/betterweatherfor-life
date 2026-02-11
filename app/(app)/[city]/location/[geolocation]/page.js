import { deslugify } from '@/app/utils/string'

export async function generateMetadata({ params }) {
  const { city, geolocation } = await params
  const cityName = deslugify(city)

  return {
    title: `${cityName} ${geolocation}`,
    description: `Current weather, tide, and sea conditions for outdoor activities in ${cityName}.`,
    openGraph: {
      title: `${cityName} ${geolocation}`,
      description: `Current weather, tide, and sea conditions for outdoor activities in ${cityName}.`,
    },
  }
}

export default function LocationDetailPage() {
  return null
}
