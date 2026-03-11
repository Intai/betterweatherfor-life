'use client'

import { useTranslation } from 'react-i18next'
import { parseTempValue, TempIcon } from '@/app/(app)/components/condition-icons'
import { getTempColor } from '@/app/(app)/utils/condition-colors'

export default function LocationCardTemp({ temp }) {
  const { t } = useTranslation()
  const tempValue = parseTempValue(temp?.air)

  return tempValue && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${getTempColor(tempValue)} 15%, transparent)` }}
      >
        <TempIcon tempValue={tempValue} />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.temp')}</p>
        <p className="font-medium">{temp.air}</p>
      </div>
    </div>
  )
}
