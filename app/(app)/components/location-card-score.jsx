'use client'

import { useTranslation } from 'react-i18next'

function getConditionColor(condition) {
  switch (condition) {
  case 'ideal':
    return 'bg-condition-ideal'
  case 'acceptable':
    return 'bg-condition-acceptable'
  case 'marginal':
    return 'bg-condition-marginal'
  case 'unsuitable':
    return 'bg-condition-unsuitable'
  default:
    return 'bg-condition-default'
  }
}

export default function LocationCardScore({ score, condition }) {
  const { t } = useTranslation()
  const colorClass = getConditionColor(condition)

  return (
    <div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full`}
          style={{ width: `${score}%` }}
          data-testid="condition-score-bar"
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span
          className="text-sm font-medium text-foreground"
          data-testid="condition-score"
        >
          {t('home.conditions.score')}: {score}
        </span>
        <span
          className={`${colorClass} text-primary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full`}
          data-testid="condition-badge"
        >
          {t(`home.conditions.${condition}`)}
        </span>
      </div>
    </div>
  )
}
