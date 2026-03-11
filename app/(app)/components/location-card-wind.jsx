'use client'

import { useTranslation } from 'react-i18next'
import { getWindRotation, WindIcon } from '@/app/(app)/components/condition-icons'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

export default function LocationCardWind({ wind }) {
  const { t } = useTranslation()
  const color = getConditionColor(wind?.condition)
  const rotation = getWindRotation(wind?.direction)

  return wind && rotation !== null && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <WindIcon rotation={rotation} />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.wind')}</p>
        <p className="font-medium" style={{ color }}>{wind.speed} {wind.direction}</p>
      </div>
    </div>
  )
}
