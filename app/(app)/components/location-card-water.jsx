'use client'

import { useTranslation } from 'react-i18next'
import { WaterIcon } from '@/app/(app)/components/condition-icons'
import { getWaterColor } from '@/app/(app)/utils/condition-colors'
import { upperFirst } from '@/app/utils/string'

export default function LocationCardWater({ water }) {
  const { t } = useTranslation()
  const quality = upperFirst(water?.quality)
  const color = getWaterColor(quality)

  return quality && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <WaterIcon />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.water')}</p>
        <p className="font-medium" style={{ color }}>{quality}</p>
      </div>
    </div>
  )
}
