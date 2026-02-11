import { deslugify } from '@/app/utils/string'

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

export default function CityForecastPage() {
  return null
}
