'use client'

import { useCallback, useEffect, useRef } from 'react'
import { prop } from 'ramda'
import { useSevenDayForecastEntries } from '@/app/(app)/stores/forecast-selectors'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { extractDateSegment } from '@/app/utils/forecast'
import { selectIsLoaded } from '@/app/utils/zustand'
import { Skeleton } from '@/shadcn/components/ui/skeleton'
import ForecastDayCard from './forecast-day-card'
import ForecastDayListEmpty from './forecast-day-list-empty'
import ForecastDaySelectorStrip from './forecast-day-selector-strip'

const gridClassName = [
  'space-y-4',
  'max-lg:landscape:flex max-lg:landscape:gap-3 max-lg:landscape:space-y-0 max-lg:landscape:overflow-x-auto max-lg:landscape:hide-scrollbar',
  'md:grid md:grid-cols-2 md:gap-4 md:space-y-0',
  'lg:grid-cols-3 lg:gap-6',
].join(' ')

function renderSkeleton() {
  return (
    <>
      <section className="border-b border-border landscape:max-lg:hidden">
        <div className="px-4 py-3 overflow-x-auto hide-scrollbar max-w-5xl mx-auto md:px-6">
          <div className="flex gap-2 w-max md:gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="h-17 w-13 rounded-xl md:h-22 md:min-w-22" />
            ))}
          </div>
        </div>
      </section>
      <section className="px-4 py-4 md:px-6 max-w-5xl mx-auto">
        <div className={gridClassName}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 mb-3" />
              <div className="flex items-center gap-4 mb-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default function ForecastDayList() {
  const entries = useSevenDayForecastEntries()
  const isLoaded = useForecastStore(selectIsLoaded)
  const initLocations = useForecastStore(prop('initLocations'))
  const isEmpty = entries.length <= 0
  const cardRefs = useRef({})

  useEffect(() => {
    initLocations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setCardRef = useCallback((dateSegment, el) => {
    cardRefs.current[dateSegment] = el
  }, [])

  const handleDaySelect = useCallback(dateStr => {
    const el = cardRefs.current[dateStr]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }, [])

  return (
    <div data-testid="forecast-day-list">
      {isLoaded
        ? <ForecastDaySelectorStrip entries={entries} onDaySelect={handleDaySelect} />
        : renderSkeleton()}
      {isLoaded && isEmpty && <ForecastDayListEmpty />}
      {isLoaded && !isEmpty && (
        <section className="px-4 py-4 md:px-6 max-w-5xl mx-auto" data-testid="forecast-cards">
          <div className={gridClassName}>
            {entries.map(([key, entry]) => {
              const dateSegment = extractDateSegment(key)
              return (
                <ForecastDayCard
                  key={key}
                  ref={el => setCardRef(dateSegment, el)}
                  className="max-lg:landscape:w-56 max-lg:landscape:shrink-0"
                  dateSegment={dateSegment}
                  timeZone={entry.timeZone}
                  isBestDay={entry.isBestDay}
                  locationName={entry.name}
                  score={entry.score}
                  condition={entry.condition}
                  summary={entry.summary}
                  hourly={entry.hourly}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
