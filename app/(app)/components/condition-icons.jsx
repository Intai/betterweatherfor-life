import { useId } from 'react'
import {
  Cloud,
  CloudDrizzle,
  CloudRain,
  Droplet,
  Droplets,
  Eye,
  Sun,
  Sunrise,
  ThermometerSun,
} from 'lucide-react'
import {
  IDEAL,
  MARGINAL,
  RISING,
  UNSUITABLE,
} from '@/app/(app)/constants'

/**
 * Returns the rotation angle in degrees for a given compass direction.
 * @param {string} direction - Compass direction (e.g. 'N', 'NE', 'SW').
 * @returns {number|null} Rotation in degrees, or null for unknown directions.
 */
export function getWindRotation(direction) {
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

/**
 * Arrow icon indicating wind direction.
 * @param {Object} props
 * @param {number} props.rotation - Rotation angle in degrees.
 */
export function WindIcon({ rotation, className = 'w-4 h-4' }) {
  return (
    <svg
      className={className}
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

/**
 * Triangle icon representing tide state and percentage.
 * @param {Object} props
 * @param {string} props.state - Tide state ('Rising' or other).
 * @param {number} props.percentage - Tide percentage (0-100).
 */
export function TideIcon({ state, percentage, className = 'w-5 h-5' }) {
  const clipId = useId()
  const isRising = state === RISING
  const trianglePath = isRising
    ? 'M5 19Q3 19 4.1 17.3L10.9 6.7Q12 5 13.1 6.7L19.9 17.3Q21 19 19 19Z'
    : 'M5 5Q3 5 4.1 6.7L10.9 17.3Q12 19 13.1 17.3L19.9 6.7Q21 5 19 5Z'

  const viewBoxY = isRising ? 1.5 : -1.5
  const fillY = (18 - 7) * (100 - percentage) / 100 + 7 + (isRising ? 0 : -1.5)
  const fillHeight = 19

  return (
    <svg className={className} viewBox={`0 ${viewBoxY} 24 24`} fill="none">
      <defs>
        <clipPath id={clipId} suppressHydrationWarning>
          <rect x="0" y={fillY} width="24" height={fillHeight} />
        </clipPath>
      </defs>
      <path d={trianglePath} stroke="currentColor" strokeWidth="2" fill="none" />
      <path d={trianglePath} fill="currentColor" clipPath={`url(#${clipId})`} suppressHydrationWarning />
    </svg>
  )
}

/**
 * Water droplet icon.
 */
export function WaterIcon({ className = 'w-4 h-4' }) {
  return <Droplet className={className} />
}

/**
 * Parses a temperature string and returns the numeric value.
 * @param {string} tempStr - Temperature string (e.g. '25C', '-3C').
 * @returns {number|null} Parsed integer, or null if invalid.
 */
export function parseTempValue(tempStr) {
  if (!tempStr) return null
  const match = tempStr.match(/-?\d+/)
  return match ? parseInt(match[0], 10) : null
}

function getTempColor(temp) {
  if (temp < 10) return 'var(--temp-cold)'
  if (temp < 15) return 'var(--temp-cool)'
  if (temp < 20) return 'var(--temp-mild)'
  if (temp < 25) return 'var(--temp-warm)'
  if (temp < 30) return 'var(--temp-hot)'
  return 'var(--temp-extreme)'
}

/**
 * Thermometer icon with fill level based on temperature.
 * @param {Object} props
 * @param {number} props.tempValue - Temperature value (0-40 range for fill).
 */
export function TempIcon({ tempValue, className = 'w-5 h-5' }) {
  const clampedTemp = Math.max(0, Math.min(40, tempValue))
  const fillRatio = clampedTemp / 40
  const totalHeight = 16
  const fillHeight = totalHeight * fillRatio
  const fillY = 4 + totalHeight - fillHeight
  const color = getTempColor(tempValue)

  return (
    <svg className={className} viewBox="0 0 24 24" style={{ color }}>
      <rect x="8" y="2" width="8" height="20" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="10" y={fillY} width="4" rx="2" height={fillHeight} fill="currentColor" />
    </svg>
  )
}

/**
 * Picks a Lucide precipitation icon key based on condition and data.
 * @param {Object} precipitation - Precipitation data object.
 * @returns {string} Icon key: 'sun', 'drizzle', 'rain', or 'cloud'.
 */
export function getPrecipitationIcon(precipitation) {
  if (!precipitation) return 'cloud'
  const { condition, chance, amount } = precipitation
  if (condition === IDEAL || chance === '0%' || amount === '0mm') return 'sun'
  if (condition === MARGINAL) return 'drizzle'
  if (condition === UNSUITABLE) return 'rain'
  return 'cloud'
}

const PRECIPITATION_ICONS = {
  sun: Sun,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  cloud: Cloud,
}

/**
 * Dynamic precipitation icon based on weather conditions.
 * @param {Object} props
 * @param {Object} [props.precipitation] - Precipitation data for icon selection.
 */
export function PrecipitationIcon({ precipitation, className = 'w-4 h-4' }) {
  const iconKey = getPrecipitationIcon(precipitation)
  const Icon = PRECIPITATION_ICONS[iconKey]
  return <Icon className={className} />
}

/**
 * Sun/thermometer icon for UV index.
 */
export function UVIcon({ className = 'w-4 h-4' }) {
  return <ThermometerSun className={className} />
}

/**
 * Humidity icon (water droplets).
 */
export function HumidityIcon({ className = 'w-4 h-4' }) {
  return <Droplets className={className} />
}

/**
 * Eye icon for visibility.
 */
export function VisibilityIcon({ className = 'w-4 h-4' }) {
  return <Eye className={className} />
}

/**
 * Sunrise icon for daylight.
 */
export function DaylightIcon({ className = 'w-4 h-4' }) {
  return <Sunrise className={className} />
}
