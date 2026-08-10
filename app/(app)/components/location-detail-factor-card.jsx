'use client'

import { useTranslation } from 'react-i18next'
import ConditionSummary from '@/app/(app)/components/condition-summary'
import {
  MARGINAL,
  UNSUITABLE,
} from '@/app/(app)/constants'
import { isWarningCondition } from '@/app/(app)/utils/condition-colors'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'

function getBorderClass(condition) {
  switch (condition) {
  case MARGINAL:
    return 'border-2 border-condition-marginal'
  case UNSUITABLE:
    return 'border-2 border-condition-unsuitable'
  default:
    return ''
  }
}

function getBadgeClass(condition) {
  switch (condition) {
  case MARGINAL:
    return 'bg-condition-marginal'
  case UNSUITABLE:
    return 'bg-condition-unsuitable'
  default:
    return ''
  }
}

export default function LocationDetailFactorCard({
  icon,
  color,
  title,
  data,
  summary,
  condition,
  'data-testid': dataTestid = 'factor-card',
}) {
  const { t } = useTranslation()
  const borderClass = getBorderClass(condition)
  const badgeClass = getBadgeClass(condition)
  const showBadge = isWarningCondition(condition)
  const hasColor = !!color

  const iconStyle = hasColor
    ? { color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }
    : undefined

  return (
    <Card
      className={`gap-3 overflow-hidden rounded-2xl py-4 shadow-md ${borderClass}`}
      data-testid={dataTestid}
    >
      <CardHeader className="px-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasColor ? '' : 'bg-secondary'}`}
            style={iconStyle}
            data-testid="factor-icon"
          >
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
          {showBadge && (
            <span
              className={`ml-auto ${badgeClass} text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full`}
              data-testid="condition-badge"
            >
              {t(`home.conditions.${condition}`)}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {data?.length > 0 && (
          <div
            className="grid grid-cols-3 gap-2"
            data-testid="data-grid"
          >
            {data.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground/70">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        {summary && (
          <ConditionSummary
            condition={condition}
            className="rounded-lg px-3 py-2"
            data-testid="factor-summary"
          >
            {summary}
          </ConditionSummary>
        )}
      </CardContent>
    </Card>
  )
}
