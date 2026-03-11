'use client'

import { useMemo } from 'react'
import LocationDetailAnalysis from '@/app/(app)/components/location-detail-analysis'
import LocationDetailConditions from '@/app/(app)/components/location-detail-conditions'
import LocationDetailForecastStrip from '@/app/(app)/components/location-detail-forecast-strip'
import LocationDetailScore from '@/app/(app)/components/location-detail-score'
import { useForecastEntry } from '@/app/(app)/stores/forecast-selectors'
import { findBestHour } from '@/app/utils/forecast'

/**
 * Renders the full location detail view including score, conditions,
 * AI analysis, and hourly forecast strip.
 * @param {object} props
 * @param {string} props.geolocation - Coordinates string in "lat,lng" format.
 */
export default function LocationDetail({ geolocation }) {
  const entry = useForecastEntry(geolocation)
  const locationForecast = entry?.[1]

  const bestHour = useMemo(
    () => findBestHour(locationForecast?.hourly),
    [locationForecast?.hourly],
  )

  return locationForecast && (
    <div data-testid="location-detail" className="max-w-5xl mx-auto">
      <LocationDetailScore
        score={locationForecast.score}
        condition={locationForecast.condition}
        bestHourTime={bestHour?.time}
      />
      <LocationDetailConditions
        wind={locationForecast.wind}
        tide={locationForecast.tide}
        water={locationForecast.water}
        temp={locationForecast.temp}
        precipitation={locationForecast.precipitation}
        uv={locationForecast.uv}
        humidity={locationForecast.humidity}
        visibility={locationForecast.visibility}
        daylight={locationForecast.daylight}
      />
      {locationForecast.analysis && (
        <LocationDetailAnalysis
          analysis={locationForecast.analysis}
          condition={locationForecast.condition}
        />
      )}
      <LocationDetailForecastStrip hourly={locationForecast.hourly} />
    </div>
  )
}
