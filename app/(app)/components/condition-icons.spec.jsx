import { render } from '@testing-library/react'
import {
  DaylightIcon,
  getPrecipitationIcon,
  getWindRotation,
  HumidityIcon,
  parseTempValue,
  PrecipitationIcon,
  TempIcon,
  TideIcon,
  UVIcon,
  VisibilityIcon,
  WaterIcon,
  WindIcon,
} from './condition-icons'

describe('getWindRotation', () => {
  it.each([
    ['N', 90],
    ['NNE', 112.5],
    ['NE', 135],
    ['ENE', 157.5],
    ['E', 180],
    ['ESE', -157.5],
    ['SE', -135],
    ['SSE', -112.5],
    ['S', -90],
    ['SSW', -67.5],
    ['SW', -45],
    ['WSW', -22.5],
    ['W', 0],
    ['WNW', 22.5],
    ['NW', 45],
    ['NNW', 67.5],
  ])('should return %d degrees for %s', (direction, degrees) => {
    expect(getWindRotation(direction)).toBe(degrees)
  })

  it('should return null for unknown direction', () => {
    expect(getWindRotation('XYZ')).toBeNull()
  })
})

describe('WindIcon', () => {
  it('should render an svg with the given rotation', () => {
    const { container } = render(<WindIcon rotation={135} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveStyle({ transform: 'rotate(135deg)' })
  })
})

describe('TideIcon', () => {
  it('should render an upward triangle when rising', () => {
    const { container } = render(<TideIcon state="Rising" percentage={50} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('viewBox', '0 1.5 24 24')
    const paths = container.querySelectorAll('path')
    expect(paths[0]).toHaveAttribute('d', expect.stringContaining('M5 19'))
  })

  it('should render a downward triangle when falling', () => {
    const { container } = render(<TideIcon state="Falling" percentage={50} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('viewBox', '0 -1.5 24 24')
    const paths = container.querySelectorAll('path')
    expect(paths[0]).toHaveAttribute('d', expect.stringContaining('M5 5'))
  })

  it('should apply clip path with a generated id', () => {
    const { container } = render(<TideIcon state="Rising" percentage={75} />)
    const clipPath = container.querySelector('clipPath')
    const clipPathId = clipPath.getAttribute('id')
    expect(clipPathId).toBeTruthy()
    const filledPath = container.querySelectorAll('path')[1]
    expect(filledPath).toHaveAttribute('clip-path', `url(#${clipPathId})`)
  })
})

describe('WaterIcon', () => {
  it('should render a Lucide Droplet icon', () => {
    const { container } = render(<WaterIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })
})

describe('parseTempValue', () => {
  it('should parse a positive temperature string', () => {
    expect(parseTempValue('25C')).toBe(25)
  })

  it('should parse a negative temperature string', () => {
    expect(parseTempValue('-3\u00B0C')).toBe(-3)
  })

  it('should return null for empty or falsy input', () => {
    expect(parseTempValue('')).toBeNull()
    expect(parseTempValue(null)).toBeNull()
    expect(parseTempValue(undefined)).toBeNull()
  })

  it('should return a numeric value as-is', () => {
    expect(parseTempValue(25)).toBe(25)
    expect(parseTempValue(-3)).toBe(-3)
    expect(parseTempValue(0)).toBeNull()
  })

  it('should return null when no digits are found', () => {
    expect(parseTempValue('abc')).toBeNull()
  })
})

describe('TempIcon', () => {
  it('should render a thermometer svg with fill based on temperature', () => {
    const { container } = render(<TempIcon tempValue={20} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveStyle({ color: 'var(--temp-mild)' })
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(2)
  })

  it('should clamp temperature below 0 to 0', () => {
    const { container } = render(<TempIcon tempValue={-5} />)
    const fillRect = container.querySelectorAll('rect')[1]
    expect(fillRect).toHaveAttribute('height', '0')
  })

  it('should clamp temperature above 40 to 40', () => {
    const { container } = render(<TempIcon tempValue={50} />)
    const fillRect = container.querySelectorAll('rect')[1]
    expect(fillRect).toHaveAttribute('height', '16')
  })

  it.each([
    [5, 'var(--temp-cold)'],
    [12, 'var(--temp-cool)'],
    [18, 'var(--temp-mild)'],
    [22, 'var(--temp-warm)'],
    [28, 'var(--temp-hot)'],
    [35, 'var(--temp-extreme)'],
  ])('should use correct color for temperature %d', (tempValue, expectedColor) => {
    const { container } = render(<TempIcon tempValue={tempValue} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveStyle({ color: expectedColor })
  })
})

describe('getPrecipitationIcon', () => {
  it('should return sun for ideal condition', () => {
    expect(getPrecipitationIcon({ condition: 'ideal' })).toBe('sun')
  })

  it('should return sun when chance is 0%', () => {
    expect(getPrecipitationIcon({ chance: '0%' })).toBe('sun')
  })

  it('should return sun when amount is 0mm', () => {
    expect(getPrecipitationIcon({ amount: '0mm' })).toBe('sun')
  })

  it('should return drizzle for marginal condition', () => {
    expect(getPrecipitationIcon({ condition: 'marginal' })).toBe('drizzle')
  })

  it('should return rain for unsuitable condition', () => {
    expect(getPrecipitationIcon({ condition: 'unsuitable' })).toBe('rain')
  })

  it('should return cloud as default fallback', () => {
    expect(getPrecipitationIcon({ condition: 'unknown' })).toBe('cloud')
  })

  it('should return cloud when precipitation is null', () => {
    expect(getPrecipitationIcon(null)).toBe('cloud')
  })
})

describe('PrecipitationIcon', () => {
  it('should render a Lucide icon with correct classes', () => {
    const { container } = render(<PrecipitationIcon precipitation={{ condition: 'ideal' }} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })

  it('should render without precipitation prop', () => {
    const { container } = render(<PrecipitationIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})

describe('UVIcon', () => {
  it('should render a Lucide ThermometerSun icon', () => {
    const { container } = render(<UVIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })
})

describe('HumidityIcon', () => {
  it('should render a Lucide Droplets icon', () => {
    const { container } = render(<HumidityIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })
})

describe('VisibilityIcon', () => {
  it('should render a Lucide Eye icon', () => {
    const { container } = render(<VisibilityIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })
})

describe('DaylightIcon', () => {
  it('should render a Lucide Sunrise icon', () => {
    const { container } = render(<DaylightIcon />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('w-4', 'h-4')
  })
})
