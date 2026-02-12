'use client'

import { useTranslation } from 'react-i18next'

function getTempColor(temp) {
  if (temp < 10) return 'var(--temp-cold)'
  if (temp < 15) return 'var(--temp-cool)'
  if (temp < 20) return 'var(--temp-mild)'
  if (temp < 25) return 'var(--temp-warm)'
  if (temp < 30) return 'var(--temp-hot)'
  return 'var(--temp-extreme)'
}

function parseTempValue(tempStr) {
  if (!tempStr) return null
  const match = tempStr.match(/-?\d+/)
  return match ? parseInt(match[0], 10) : null
}

function TempIcon({ tempValue }) {
  const clampedTemp = Math.max(0, Math.min(40, tempValue))
  const fillRatio = clampedTemp / 40
  const totalHeight = 16
  const fillHeight = totalHeight * fillRatio
  const fillY = 4 + totalHeight - fillHeight
  const color = getTempColor(tempValue)

  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" style={{ color }}>
      <rect x="8" y="2" width="8" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="10" y={fillY} width="4" rx="2" height={fillHeight} fill="currentColor" />
    </svg>
  )
}

export default function LocationCardTemp({ temp }) {
  const { t } = useTranslation()
  const tempValue = parseTempValue(temp)

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
        <p className="font-medium">{temp}</p>
      </div>
    </div>
  )
}
