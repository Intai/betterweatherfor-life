import { render, screen } from '@testing-library/react'
import { TODAY } from '@/app/(app)/constants'
import { buildForecastKey } from '@/app/utils/forecast'
import { ForecastStoreProvider } from './forecast-store'
import { buildForecastEntries, useForecastEntries } from './forecast-selectors'

jest.mock('@/app/utils/date', () => ({
  formatForecastDate: jest.fn(() => '2026-02-11'),
}))

const makeForecast = (overrides = {}) => ({
  name: 'Mission Bay',
  score: 85,
  timeZone: 'Pacific/Auckland',
  ...overrides,
})

describe('buildForecastEntries', () => {
  const forecast = {
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670')]: makeForecast({ score: 85 }),
    [buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
    [buildForecastKey('sup', '2026-02-12', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 60 }),
    [buildForecastKey('sup', '2026-02-11', 'morning', '-36.8547,174.8317')]: makeForecast({ score: 78 }),
  }

  it('should filter entries matching current activity, date, and time range', () => {
    const entries = buildForecastEntries('sup', TODAY, null, 'all-day')(forecast)
    const keys = entries.map(([key]) => key)

    expect(keys).toContain(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    expect(keys).toContain(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670'))
    expect(keys).not.toContain(buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    expect(keys).not.toContain(buildForecastKey('sup', '2026-02-12', 'all-day', '-36.8547,174.8317'))
    expect(keys).not.toContain(buildForecastKey('sup', '2026-02-11', 'morning', '-36.8547,174.8317'))
  })

  it('should sort matched entries by score descending', () => {
    const entries = buildForecastEntries('sup', TODAY, null, 'all-day')(forecast)
    const scores = entries.map(([, entry]) => entry.score)
    expect(scores).toEqual([85, 72])
  })

  it('should return empty array when no entries match', () => {
    const entries = buildForecastEntries('snorkelling', TODAY, null, 'all-day')(forecast)
    expect(entries).toEqual([])
  })
})

function EntriesConsumer() {
  const entries = useForecastEntries()
  return <div data-testid="entries">{JSON.stringify(entries)}</div>
}

describe('useForecastEntries', () => {
  it('should return filtered and sorted entries from the store', () => {
    const forecast = {
      [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
      [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670')]: makeForecast({ score: 85 }),
      [buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
    }

    render(
      <ForecastStoreProvider initialState={{ forecast }}>
        <EntriesConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('entries').textContent)
    expect(entries).toHaveLength(2)
    expect(entries[0][1].score).toBe(85)
    expect(entries[1][1].score).toBe(72)
  })

  it('should return empty array when no entries match', () => {
    render(
      <ForecastStoreProvider initialState={{ selectedActivity: 'snorkelling' }}>
        <EntriesConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('entries').textContent)
    expect(entries).toEqual([])
  })
})
