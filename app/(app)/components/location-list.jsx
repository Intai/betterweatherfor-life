'use client'

import { useForecastEntries } from '@/app/(app)/stores/forecast-selectors'
import LocationCard from './location-card'
import LocationListEmpty from './location-list-empty'
import LocationListHeader from './location-list-header'

export default function LocationList() {
  const entries = useForecastEntries()
  const isEmpty = entries.length <= 0

  return (
    <div data-testid="location-list">
      <LocationListHeader />
      {isEmpty && <LocationListEmpty />}
      {!isEmpty && (
        <section className="px-4 pb-6 md:px-6">
          <div className="space-y-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-4 md:space-y-0">
            {entries.map(([key, entry]) => (
              <LocationCard
                key={key}
                forecastKey={key}
                name={entry.name}
                area={entry.area}
                score={entry.score}
                condition={entry.condition}
                wind={entry.wind}
                tide={entry.tide}
                water={entry.water}
                temp={entry.temp}
                summary={entry.summary}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
