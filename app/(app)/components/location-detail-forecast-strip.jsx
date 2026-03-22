'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getConditionBackgroundColor, getConditionColor, getConditionTextColor } from '@/app/(app)/utils/condition-colors'
import { findBestHour } from '@/app/utils/forecast'

const renderBestBadge = condition => (
  <span
    className={`absolute -top-1 -right-1 w-5 h-5 ${getConditionBackgroundColor(condition)} rounded-full flex items-center justify-center`}
    data-testid="best-badge"
  >
    <svg
      className="w-3 h-3 text-primary-foreground"
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  </span>
)

const renderHourlySlot = bestHour => function HourlySlot(slot) {
  const isBest = slot === bestHour
  const bgColor = getConditionBackgroundColor(slot.condition)
  const textColor = getConditionTextColor(slot.condition)
  const conditionColor = getConditionColor(slot.condition)

  const borderClassName = isBest
    ? 'border-2'
    : 'bg-transparent border border-border'

  const bestStyle = isBest
    ? { borderColor: conditionColor, backgroundColor: `color-mix(in srgb, ${conditionColor} 10%, transparent)` }
    : undefined

  return (
    <div
      key={slot.time}
      className={`w-15 flex flex-col items-center p-2 rounded-xl relative overflow-visible ${borderClassName}`}
      style={bestStyle}
      data-testid={isBest ? 'forecast-slot-best' : 'forecast-slot'}
    >
      {isBest && renderBestBadge(slot.condition)}
      <span className="text-xs text-muted-foreground mb-1" data-testid="slot-time">
        {slot.time}
      </span>
      <span
        className={`text-lg font-bold ${textColor}`}
        data-testid="slot-score"
      >
        {slot.score}
      </span>
      <div
        className={`w-6 h-1.5 rounded-full ${bgColor} mt-1`}
        data-testid="slot-bar"
      />
    </div>
  )
}

export default function LocationDetailForecastStrip({ hourly }) {
  const { t } = useTranslation()
  const bestHour = useMemo(() => findBestHour(hourly), [hourly])

  return hourly?.length > 0 && (
    <section className="px-4 pb-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {t('locationDetail.forecast')}
      </h2>
      <div className="overflow-x-auto hide-scrollbar -mt-2">
        <div className="flex gap-2 py-2" style={{ width: 'max-content' }}>
          {hourly.map(renderHourlySlot(bestHour))}
        </div>
      </div>
    </section>
  )
}
