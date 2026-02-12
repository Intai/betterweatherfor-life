import ActivitySelector from '@/app/(app)/components/activity-selector'
import LocationList from '@/app/(app)/components/location-list'
import TimeWindowPicker from '@/app/(app)/components/time-window-picker'
import { ForecastStoreProvider } from '@/app/(app)/stores/forecast-store'
import { formatForecastDate } from '@/app/utils/date'
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

const today = formatForecastDate('today', null, 'Pacific/Auckland')

const initialState = {
  forecast: {
    [`sup;${today};all-day;-36.8547,174.8317`]: {
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      timeZone: 'Pacific/Auckland',
      score: 85,
      condition: 'ideal',
      wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
      tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
      water: 'Green',
      temp: '22°C',
      summary: 'Light onshore breeze, excellent for paddling this morning.',
    },
    [`sup;${today};all-day;-36.7878,174.7768`]: {
      name: 'Takapuna Beach',
      area: 'Beach, North Shore',
      timeZone: 'Pacific/Auckland',
      score: 62,
      condition: 'acceptable',
      wind: { speed: '12km/h', direction: 'SW', condition: 'acceptable' },
      tide: { state: 'Rising', percentage: 50, condition: 'acceptable' },
      water: 'Green',
      temp: '21°C',
      summary: 'Offshore wind component - take care near outer areas.',
    },
    [`sup;${today};all-day;-36.8508,174.8593`]: {
      name: 'St Heliers Bay',
      area: 'Beach, East Auckland',
      timeZone: 'Pacific/Auckland',
      score: 58,
      condition: 'marginal',
      wind: { speed: '15km/h', direction: 'SW', condition: 'marginal' },
      tide: { state: 'Falling', percentage: 30, condition: 'marginal' },
      water: 'Orange',
      temp: '15°C',
      summary: 'Moderate winds and outgoing tide may create choppy conditions.',
    },
  },
}

export default function CityHomePage() {
  return (
    <ForecastStoreProvider initialState={initialState}>
      <ActivitySelector />
      <TimeWindowPicker />
      <LocationList />
    </ForecastStoreProvider>
  )
}
