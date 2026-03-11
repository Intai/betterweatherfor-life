'use client'

import { useTranslation } from 'react-i18next'
import { getConditionBackgroundColor } from '@/app/(app)/utils/condition-colors'

export default function LocationCardScore({ score, condition }) {
  const { t } = useTranslation()
  const colorClass = getConditionBackgroundColor(condition)

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
