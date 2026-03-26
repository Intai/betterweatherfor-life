'use client'

import { useTranslation } from 'react-i18next'
import { getConditionBackgroundColor } from '@/app/(app)/utils/condition-colors'
import { formatShortDateWithWeekday } from '@/app/utils/date'
import { kebabToCamel } from '@/app/utils/string'

export default function LocationDetailScore({ score, condition, bestHourTime, date, timeRange }) {
  const { t } = useTranslation()
  const colorClass = getConditionBackgroundColor(condition)

  return (
    <section className="px-4 py-6 flex flex-col items-center">
      <div
        className={`w-32 h-32 rounded-full ${colorClass} flex items-center justify-center mb-4`}
        data-testid="score-circle"
      >
        <span className="text-5xl font-bold text-primary-foreground">
          {score}
        </span>
      </div>
      <span
        className={`${colorClass} text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-2`}
        data-testid="score-badge"
      >
        <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
        {t(`home.conditions.${condition}`)}
      </span>
      <p className="text-muted-foreground text-sm mt-2" data-testid="forecast-date">
        {formatShortDateWithWeekday(date)} · {t(`home.timeWindow.${kebabToCamel(timeRange)}`)}
      </p>
      <p className="text-muted-foreground text-sm" data-testid="best-hour">
        {t('locationDetail.bestAt', { time: bestHourTime })}
      </p>
    </section>
  )
}
