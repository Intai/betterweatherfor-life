import { forecastSearchParamsSchema } from './forecast'

describe('forecastSearchParamsSchema', () => {
  it('should parse valid locations param', () => {
    const result = forecastSearchParamsSchema.safeParse({
      locations: '51.5,-0.1;48.8,2.3',
    })

    expect(result.success).toBe(true)
    expect(result.data.locations).toEqual([
      [51.5, -0.1],
      [48.8, 2.3],
    ])
  })

  it('should reject missing locations', () => {
    const result = forecastSearchParamsSchema.safeParse({})

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['locations'], code: 'invalid_type' }),
    ])
  })

  it('should reject invalid numbers', () => {
    const result = forecastSearchParamsSchema.safeParse({
      locations: 'abc,def',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['locations', 0, 0], code: 'invalid_type' }),
      expect.objectContaining({ path: ['locations', 0, 1], code: 'invalid_type' }),
    ])
  })

  it('should reject out-of-range latitude', () => {
    const result = forecastSearchParamsSchema.safeParse({
      locations: '91,0',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['locations', 0, 0], code: 'too_big' }),
    ])
  })

  it('should reject out-of-range longitude', () => {
    const result = forecastSearchParamsSchema.safeParse({
      locations: '0,181',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['locations', 0, 1], code: 'too_big' }),
    ])
  })

  it('should reject empty string', () => {
    const result = forecastSearchParamsSchema.safeParse({
      locations: '',
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['locations'], code: 'too_small' }),
    ])
  })
})
