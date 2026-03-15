'use client'

import { getConditionColor } from '@/app/(app)/utils/condition-colors'
import { useLocale } from '@/app/components/locale-provider'
import { formatShortDate, formatShortWeekday } from '@/app/utils/date'
import { extractDateSegment } from '@/app/utils/forecast'

/**
 * Render a single day button for the selector strip.
 *
 * @param {object} props
 * @param {string} props.dateSegment - Date segment string (e.g. "2026-02-10").
 * @param {number} props.score - The forecast score.
 * @param {string} props.condition - The forecast condition.
 * @param {Function} props.onSelect - Callback when the day is tapped.
 */
function DayButton({ locale, dateSegment, score, condition, onSelect }) {
  const date = new Date(`${dateSegment}T00:00:00`)
  const weekday = formatShortWeekday(date, locale)
  const dateLabel = formatShortDate(date, locale)
  const conditionColor = getConditionColor(condition)

  return (
    <button
      className="flex flex-col items-center min-w-13 p-2 rounded-xl bg-card border border-border hover:bg-accent active:scale-[0.98] transition-transform md:min-w-21 md:p-3"
      onClick={() => onSelect(dateSegment)}
      aria-label={dateLabel}
      data-testid="day-selector-button"
    >
      <span className="text-xxs font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
        {weekday}
      </span>
      <span className="text-base font-semibold text-foreground md:hidden">
        {date.getDate()}
      </span>
      <span className="hidden font-semibold text-foreground md:inline">
        {dateLabel}
      </span>
      <div
        className="mt-1 px-1.5 py-0.5 rounded text-xxs font-semibold text-primary-foreground md:mt-1.5 md:px-2 md:text-xs"
        style={{ backgroundColor: conditionColor }}
        data-testid="day-score-badge"
      >
        {score}
      </div>
    </button>
  )
}

/**
 * Horizontal scrollable strip of day selector buttons.
 * Each button shows a day abbreviation, date number, and color-coded mini score badge.
 * Hidden in phone landscape; visible in phone portrait, tablet, and desktop.
 *
 * @param {object} props
 * @param {Array<[string, object]>} props.entries - Forecast entries as [key, entry] pairs.
 * @param {Function} props.onDaySelect - Callback invoked with the date string when a day button is tapped.
 */
export default function ForecastDaySelectorStrip({ entries, onDaySelect }) {
  const locale = useLocale()

  return entries?.length > 0 && (
    <section
      className="border-b border-border bg-muted/50 landscape:max-lg:hidden"
      data-testid="day-selector-strip"
    >
      <div className="px-4 py-3 overflow-x-auto hide-scrollbar max-w-5xl mx-auto md:px-6">
        <div className="flex gap-2 w-max md:gap-3">
          {entries.map(([key, entry]) => (
            <DayButton
              key={key}
              locale={locale}
              dateSegment={extractDateSegment(key)}
              score={entry.score}
              condition={entry.condition}
              onSelect={onDaySelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
