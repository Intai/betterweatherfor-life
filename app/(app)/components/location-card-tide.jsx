'use client'

import { useTranslation } from 'react-i18next'
import { isNil } from 'ramda'
import { TideIcon } from '@/app/(app)/components/condition-icons'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'
import { upperFirst } from '@/app/utils/string'

export default function LocationCardTide({ tide }) {
  const { t } = useTranslation()
  const color = getConditionColor(tide?.condition)

  return tide && !isNil(tide.percentage) && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <TideIcon state={tide.state} percentage={tide.percentage} />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.tide')}</p>
        <p className="font-medium" style={{ color }}>{upperFirst(tide.state)} {tide.percentage}%</p>
      </div>
    </div>
  )
}
