import { deslugify } from '@/app/utils/string'

export async function generateMetadata({ params }) {
  const { city } = await params
  const cityName = deslugify(city)

  return {
    title: `${cityName} - Best Outdoor Spots`,
    description: `Find the best spots for SUP, kayaking, snorkeling, and cycling in ${cityName} based on current weather and sea conditions.`,
    openGraph: {
      title: `${cityName} - Best Outdoor Spots`,
      description: `Find the best spots for SUP, kayaking, snorkeling, and cycling in ${cityName} based on current weather and sea conditions.`,
    },
  }
}

export default function CityHomePage() {
  return null
}
