import { dateNow, formatForecastDate, formatISODate, formatShortDate } from './date'

describe('dateNow', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T12:30:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return a Date when called without arguments', () => {
    const result = dateNow()
    expect(result).toBeInstanceOf(Date)
    expect(result.toISOString()).toBe('2026-02-10T12:30:00.000Z')
  })

  it('should return a timezone-adjusted date when given a timezone', () => {
    // UTC 12:30 → Pacific/Auckland (UTC+13) → Feb 11 01:30
    const result = dateNow('Pacific/Auckland')
    expect(result).toBeInstanceOf(Date)
    expect(result.getDate()).toBe(11)
    expect(result.getHours()).toBe(1)
    expect(result.getMinutes()).toBe(30)
  })
})

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

describe('formatISODate', () => {
  it('should format a date as yyyy-MM-dd', () => {
    const date = new Date('2026-02-10T00:00:00')
    expect(formatISODate(date)).toBe('2026-02-10')
  })
})

describe('formatForecastDate', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-02-10T12:30:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return today\'s date when selectedDay is today', () => {
    expect(formatForecastDate('today')).toBe('2026-02-10')
  })

  it('should return tomorrow\'s date when selectedDay is tomorrow', () => {
    expect(formatForecastDate('tomorrow')).toBe('2026-02-11')
  })

  it('should return the selected date when selectedDay is pick-date', () => {
    const picked = new Date('2026-03-15T00:00:00')
    expect(formatForecastDate('pick-date', picked)).toBe('2026-03-15')
  })

  it('should resolve today in the given timeZone', () => {
    // System time is Feb 10 12:30 UTC.
    // In Pacific/Auckland (UTC+13), it is Feb 11 01:30.
    jest.setSystemTime(new Date('2026-02-10T12:30:00Z'))
    expect(formatForecastDate('today', null, 'Pacific/Auckland')).toBe('2026-02-11')
  })

  it('should resolve tomorrow in the given timeZone', () => {
    jest.setSystemTime(new Date('2026-02-10T12:30:00Z'))
    expect(formatForecastDate('tomorrow', null, 'Pacific/Auckland')).toBe('2026-02-12')
  })

  it('should ignore timeZone for pick-date', () => {
    const picked = new Date('2026-03-15T00:00:00Z')
    expect(formatForecastDate('pick-date', picked, 'Pacific/Auckland')).toBe('2026-03-15')
  })
})
