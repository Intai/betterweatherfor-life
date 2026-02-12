import { buildForecastKey } from './forecast'

describe('buildForecastKey', () => {
  it('should return a full forecast key when coordinates are provided', () => {
    expect(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
      .toBe('sup;2026-02-11;all-day;-36.8547,174.8317')
  })

  it('should return a prefix when coordinates are omitted', () => {
    expect(buildForecastKey('sup', '2026-02-11', 'all-day'))
      .toBe('sup;2026-02-11;all-day')
  })
})
