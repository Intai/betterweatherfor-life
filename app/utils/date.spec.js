import { formatShortDate } from './date'

describe('formatShortDate', () => {
  const date = new Date('2026-02-10T00:00:00')

  it('should produce day-first format for en-NZ locale', () => {
    expect(formatShortDate(date, 'en-NZ')).toBe('10 Feb')
  })

  it('should produce month-first format for en-US locale', () => {
    expect(formatShortDate(date, 'en-US')).toBe('Feb 10')
  })

  it('should return a string when no locale is provided', () => {
    expect(typeof formatShortDate(date)).toBe('string')
  })
})
