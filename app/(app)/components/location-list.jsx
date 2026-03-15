'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { prop } from 'ramda'
import { useForecastEntries, useScheduledLocationEntries } from '@/app/(app)/stores/forecast-selectors'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { buildLocationKey } from '@/app/utils/forecast'
import { slugify } from '@/app/utils/string'
import { selectIsLoaded } from '@/app/utils/zustand'
import { Skeleton } from '@/shadcn/components/ui/skeleton'
import LocationCard from './location-card'
import LocationCardSkeleton from './location-card-skeleton'
import LocationListEmpty from './location-list-empty'
import LocationListHeader from './location-list-header'
import ScheduledLocationCard from './scheduled-location-card'

function renderSkeleton(length) {
  return (
    <>
      <section className="px-4 py-3 md:px-6 md:py-4">
        <Skeleton className="my-1 h-7 w-32 md:h-7" />
      </section>
      <section className="px-4 pb-6 md:px-6">
        <div className="space-y-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-4 md:space-y-0">
          {Array.from({ length }, (_, i) => (
            <LocationCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  )
}

export default function LocationList() {
  const entries = useForecastEntries()
  const scheduledLocations = useScheduledLocationEntries()
  const isLoaded = useForecastStore(selectIsLoaded)
  const isEmpty = entries.length <= 0 && scheduledLocations.length <= 0
  const initLocations = useForecastStore(prop('initLocations'))

  useEffect(() => {
    initLocations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div data-testid="location-list" className="max-w-5xl mx-auto">
      {isLoaded ? <LocationListHeader /> : renderSkeleton(scheduledLocations.length)}
      {isLoaded && isEmpty && <LocationListEmpty />}
      {isLoaded && !isEmpty && (
        <section className="px-4 pb-6 md:px-6">
          <div className="space-y-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] md:gap-4 md:space-y-0">
            {entries.map(([key, entry]) => (
              <Link key={key} href={`/location/${slugify(entry.name)}/${buildLocationKey(entry.latitude, entry.longitude)}`}>
                <LocationCard
                  forecastKey={key}
                  name={entry.name}
                  area={entry.area}
                  latitude={entry.latitude}
                  longitude={entry.longitude}
                  score={entry.score}
                  condition={entry.condition}
                  wind={entry.wind}
                  tide={entry.tide}
                  water={entry.water}
                  temp={entry.temp}
                  summary={entry.summary}
                />
              </Link>
            ))}
            {scheduledLocations.map(([key, location]) => (
              <ScheduledLocationCard
                key={key}
                locationKey={key}
                name={location.name}
                area={location.area}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
