'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { prop } from 'ramda'
import { PICK_DATE, UNSUITABLE } from '@/app/(app)/constants'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { getConditionBackgroundColor, getConditionColor, isWarningCondition } from '@/app/(app)/utils/condition-colors'
import { useLocale } from '@/app/components/locale-provider'
import { dateIsToday, formatShortDateWithWeekday } from '@/app/utils/date'
import { findBestWindow } from '@/app/utils/forecast'
import { Card, CardContent } from '@/shadcn/components/ui/card'
import { cn } from '@/shadcn/utils'

function CardHeader({ date, timeZone, isBestDay, isUnsuitable }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const dateHeading = formatShortDateWithWeekday(date, locale)

  return (
    <div className="-mb-1 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-foreground text-base" data-testid="date-heading">
          {dateHeading}
        </h3>
        {dateIsToday(date, timeZone) && (
          <span
            className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full"
            data-testid="today-chip"
          >
            {t('forecast.today')}
          </span>
        )}
      </div>
      {!isUnsuitable && isBestDay && (
        <span
          className="best-day-badge text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
          data-testid="best-day-badge"
        >
          <Star className="w-3 h-3" fill="currentColor" />
          {t('forecast.bestDay')}
        </span>
      )}
    </div>
  )
}

function CardLocationName({ locationName, isUnsuitable }) {
  const { t } = useTranslation()

  return !isUnsuitable && !!locationName && (
    <p className="text-sm text-muted-foreground" data-testid="best-spot">
      {t('forecast.bestSpot')}: <span className="font-medium text-foreground">{locationName}</span>
    </p>
  )
}

function CardScore({ score, condition, hourly, isUnsuitable }) {
  const { t } = useTranslation()
  const colorClass = getConditionBackgroundColor(condition)
  const bestWindow = findBestWindow(hourly)

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-14 h-14 rounded-full ${colorClass} flex items-center justify-center`}
        data-testid="score-circle"
      >
        <span className="text-xl font-bold text-primary-foreground">
          {score}
        </span>
      </div>
      <div className="flex-1">
        <span
          className={`${colorClass} text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit`}
          data-testid="condition-badge"
        >
          {t(`home.conditions.${condition}`)}
        </span>

        {isUnsuitable && (
          <p className="text-sm text-muted-foreground mt-1.5" data-testid="no-window">
            {t('forecast.noWindow')}
          </p>
        )}
        {!isUnsuitable && bestWindow && (
          <p className="text-sm text-muted-foreground mt-1.5" data-testid="best-window">
            {t('forecast.bestWindow')}: <span className="font-medium">{t('forecast.bestWindowRange', bestWindow)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function CardSummary({ condition, summary }) {
  const showWarning = isWarningCondition(condition)
  const conditionColor = getConditionColor(condition)

  const summaryStyle = showWarning
    ? { backgroundColor: `color-mix(in srgb, ${conditionColor} 10%, transparent)` }
    : undefined

  const textStyle = showWarning
    ? { color: conditionColor }
    : undefined

  return !!summary && (
    <div
      className={summaryStyle ? 'rounded-xl px-3 py-2' : 'bg-secondary rounded-xl px-3 py-2'}
      style={summaryStyle}
      data-testid="day-summary"
    >
      <p
        className={textStyle ? 'text-sm leading-relaxed' : 'text-sm text-muted-foreground leading-relaxed'}
        style={textStyle}
      >
        {summary}
      </p>
    </div>
  )
}

/**
 * A single day card for the 7-day forecast view.
 * Shows the date, best location, score, condition, time window, and AI summary.
 * Renders an unsuitable variant when the condition is unsuitable.
 *
 * @param {object} props
 * @param {string} props.dateSegment - Date segment string (e.g. "2026-02-01").
 * @param {string} props.timeZone - IANA timezone for the city (e.g. "Pacific/Auckland").
 * @param {boolean} [props.isBestDay] - Whether this is the best day of the week.
 * @param {string} [props.locationName] - Best location name for the day.
 * @param {number} props.score - Overall score for the day.
 * @param {string} props.condition - Condition level (ideal, acceptable, marginal, unsuitable).
 * @param {object[]} [props.hourly] - Hourly forecast data for computing best window.
 * @param {string} [props.summary] - AI-generated summary text.
 */
export default function ForecastDayCard({
  ref,
  className,
  dateSegment,
  timeZone,
  isBestDay,
  locationName,
  score,
  condition,
  summary,
  hourly,
}) {
  const citySlug = useForecastStore(prop('citySlug'))
  const setDay = useForecastStore(prop('setDay'))
  const setDate = useForecastStore(prop('setDate'))
  const date = new Date(`${dateSegment}T00:00:00`)
  const isUnsuitable = condition === UNSUITABLE

  const handleClick = () => {
    setDay(PICK_DATE)
    setDate(date)
  }

  return (
    <Card
      ref={ref}
      as={Link}
      href={citySlug ? `/${citySlug}/home` : '/home'}
      className={cn(
        'p-0 gap-0 overflow-hidden rounded-2xl shadow-md cursor-pointer',
        isUnsuitable && 'opacity-80',
        className,
      )}
      onClick={handleClick}
      data-testid="forecast-day-card"
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <CardHeader date={date} timeZone={timeZone} isBestDay={isBestDay} isUnsuitable={isUnsuitable} />
        <CardLocationName locationName={locationName} isUnsuitable={isUnsuitable} />
        <CardScore score={score} condition={condition} hourly={hourly} isUnsuitable={isUnsuitable} />
        <CardSummary condition={condition} summary={summary} />
      </CardContent>
    </Card>
  )
}
