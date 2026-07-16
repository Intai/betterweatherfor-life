'use client'

import { useTranslation } from 'react-i18next'
import LocationDetailFactorDaylight from '@/app/(app)/components/location-detail-factor-daylight'
import LocationDetailFactorHumidity from '@/app/(app)/components/location-detail-factor-humidity'
import LocationDetailFactorPrecipitation from '@/app/(app)/components/location-detail-factor-precipitation'
import LocationDetailFactorTemp from '@/app/(app)/components/location-detail-factor-temp'
import LocationDetailFactorTide from '@/app/(app)/components/location-detail-factor-tide'
import LocationDetailFactorUV from '@/app/(app)/components/location-detail-factor-uv'
import LocationDetailFactorVisibility from '@/app/(app)/components/location-detail-factor-visibility'
import LocationDetailFactorWater from '@/app/(app)/components/location-detail-factor-water'
import LocationDetailFactorWind from '@/app/(app)/components/location-detail-factor-wind'

/**
 * Renders a "Conditions" section with a vertical stack of factor cards
 * for each non-null condition field in the forecast entry.
 * @param {Object} props
 * @param {string} props.activity - Selected activity key (e.g. 'sup') used to name the section heading.
 * @param {Object} props.wind - Wind condition data.
 * @param {Object} props.tide - Tide condition data.
 * @param {Object} props.water - Water quality data.
 * @param {Object} props.temp - Temperature data.
 * @param {Object} props.precipitation - Precipitation data.
 * @param {Object} props.uv - UV index data.
 * @param {Object} props.humidity - Humidity data.
 * @param {Object} props.visibility - Visibility data.
 * @param {Object} props.daylight - Daylight data.
 */
export default function LocationDetailConditions({
  activity,
  wind,
  tide,
  water,
  temp,
  precipitation,
  uv,
  humidity,
  visibility,
  daylight,
}) {
  const { t } = useTranslation()

  return (
    <section data-testid="conditions-section" className="px-4 pb-6 md:px-6">
      <h2 className="text-lg font-semibold mb-4">
        {t('locationDetail.conditions', { activity: t(`home.activities.${activity}`) })}
      </h2>
      <div className="space-y-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-4 md:space-y-0">
        {wind && <LocationDetailFactorWind wind={wind} />}
        {tide && <LocationDetailFactorTide tide={tide} />}
        {water && <LocationDetailFactorWater water={water} />}
        {temp && <LocationDetailFactorTemp temp={temp} />}
        {precipitation && <LocationDetailFactorPrecipitation precipitation={precipitation} />}
        {uv && <LocationDetailFactorUV uv={uv} />}
        {humidity && <LocationDetailFactorHumidity humidity={humidity} />}
        {visibility && <LocationDetailFactorVisibility visibility={visibility} />}
        {daylight && <LocationDetailFactorDaylight daylight={daylight} />}
      </div>
    </section>
  )
}
