import { locationSchema } from './location'

describe('locationSchema', () => {
  it('should accept valid input', () => {
    const result = locationSchema.safeParse({
      name: 'Bondi Beach',
      area: 'Eastern Suburbs',
      citySlug: 'sydney',
      latitude: -33.89,
      longitude: 151.27,
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      name: 'Bondi Beach',
      area: 'Eastern Suburbs',
      citySlug: 'sydney',
      latitude: -33.89,
      longitude: 151.27,
    })
  })

  it('should reject missing fields', () => {
    const result = locationSchema.safeParse({ name: 'Test' })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['area'], code: 'invalid_type' }),
      expect.objectContaining({ path: ['citySlug'], code: 'invalid_type' }),
      expect.objectContaining({ path: ['latitude'], code: 'invalid_type' }),
      expect.objectContaining({ path: ['longitude'], code: 'invalid_type' }),
    ])
  })

  it('should reject latitude out of range', () => {
    const result = locationSchema.safeParse({
      name: 'Test',
      area: 'Area',
      citySlug: 'city',
      latitude: 91,
      longitude: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['latitude'], code: 'too_big' }),
    ])
  })

  it('should reject longitude out of range', () => {
    const result = locationSchema.safeParse({
      name: 'Test',
      area: 'Area',
      citySlug: 'city',
      latitude: 0,
      longitude: -181,
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['longitude'], code: 'too_small' }),
    ])
  })

  it('should reject empty strings', () => {
    const result = locationSchema.safeParse({
      name: '',
      area: '',
      citySlug: '',
      latitude: 0,
      longitude: 0,
    })

    expect(result.success).toBe(false)
    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['name'], code: 'too_small' }),
      expect.objectContaining({ path: ['area'], code: 'too_small' }),
      expect.objectContaining({ path: ['citySlug'], code: 'too_small' }),
    ])
  })
})
