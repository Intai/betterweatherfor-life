'use client'

import { useTranslation } from 'react-i18next'

function getWindColor(condition) {
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

function getWindRotation(direction) {
  switch (direction) {
  case 'N': return 90
  case 'NNE': return 112.5
  case 'NE': return 135
  case 'ENE': return 157.5
  case 'E': return 180
  case 'ESE': return -157.5
  case 'SE': return -135
  case 'SSE': return -112.5
  case 'S': return -90
  case 'SSW': return -67.5
  case 'SW': return -45
  case 'WSW': return -22.5
  case 'W': return 0
  case 'WNW': return 22.5
  case 'NW': return 45
  case 'NNW': return 67.5
  default: return null
  }
}

function WindIcon({ rotation }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

export default function LocationCardWind({ wind }) {
  const { t } = useTranslation()
  const color = getWindColor(wind?.condition)
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
