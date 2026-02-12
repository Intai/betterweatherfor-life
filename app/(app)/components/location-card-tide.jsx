'use client'

import { useId } from 'react'
import { useTranslation } from 'react-i18next'

function getTideColor(condition) {
  switch (condition) {
  case 'ideal':
    return 'var(--condition-ideal)'
  case 'acceptable':
    return 'var(--condition-acceptable)'
  case 'marginal':
    return 'var(--condition-marginal)'
  case 'unsuitable':
    return 'var(--condition-unsuitable)'
  default:
    return 'var(--condition-default)'
  }
}

function TideIcon({ state, percentage, clipId }) {
  const isRising = state === 'Rising'
  const trianglePath = isRising
    ? 'M5 19Q3 19 4.1 17.3L10.9 6.7Q12 5 13.1 6.7L19.9 17.3Q21 19 19 19Z'
    : 'M5 5Q3 5 4.1 6.7L10.9 17.3Q12 19 13.1 17.3L19.9 6.7Q21 5 19 5Z'

  const viewBoxY = isRising ? 1.5 : -1.5
  const fillY = (18 - 7) * (100 - percentage) / 100 + 7 + (isRising ? 0 : -1.5)
  const fillHeight = 19

  return (
    <svg className="w-5 h-5" viewBox={`0 ${viewBoxY} 24 24`} fill="none">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={fillY} width="24" height={fillHeight} />
        </clipPath>
      </defs>
      <path d={trianglePath} stroke="currentColor" strokeWidth="2" fill="none" />
      <path d={trianglePath} fill="currentColor" clipPath={`url(#${clipId})`} />
    </svg>
  )
}

export default function LocationCardTide({ tide }) {
  const { t } = useTranslation()
  const clipId = useId()
  const color = getTideColor(tide?.condition)

  return tide && (
    <div className="flex items-center gap-2 text-sm">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <TideIcon state={tide.state} percentage={tide.percentage} clipId={clipId} />
      </div>
      <div>
        <p className="text-muted-foreground/70 text-xs">{t('home.conditions.tide')}</p>
        <p className="font-medium" style={{ color }}>{tide.state} {tide.percentage}%</p>
      </div>
    </div>
  )
}
