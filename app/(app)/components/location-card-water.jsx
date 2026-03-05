'use client'

import { useTranslation } from 'react-i18next'

function getWaterColor(quality) {
  switch (quality) {
  case 'Green':
    return 'var(--condition-ideal)'
  case 'Orange':
    return 'var(--condition-marginal)'
  case 'Red':
  case 'Black':
    return 'var(--condition-unsuitable)'
  default:
    return 'var(--condition-default)'
  }
}

function WaterIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
    </svg>
  )
}

export default function LocationCardWater({ water }) {
  const { t } = useTranslation()
  const color = getWaterColor(water?.quality)

  return water?.quality && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <WaterIcon />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.water')}</p>
        <p className="font-medium" style={{ color }}>{water.quality}</p>
      </div>
    </div>
  )
}
