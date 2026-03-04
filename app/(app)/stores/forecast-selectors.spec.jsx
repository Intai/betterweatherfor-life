import { render, screen } from '@testing-library/react'
import { TODAY } from '@/app/(app)/constants'
import { buildForecastKey } from '@/app/utils/forecast'
import { ForecastStoreProvider } from './forecast-store'
import { buildForecastEntries, buildScheduledLocationEntries, useForecastEntries, useScheduledLocationEntries } from './forecast-selectors'

jest.mock('@/app/utils/date', () => ({
  formatForecastDate: jest.fn(() => '2026-02-11'),
}))

const makeForecast = (overrides = {}) => ({
  name: 'Mission Bay',
  score: 85,
  timeZone: 'Pacific/Auckland',
  ...overrides,
})

const makeLocation = (overrides = {}) => ({
  name: 'Mission Bay',
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

describe('buildScheduledLocationEntries', () => {
  const locations = {
    '-36.8547,174.8317': makeLocation({ name: 'Mission Bay' }),
    '-36.8400,174.7670': makeLocation({ name: 'Takapuna Beach' }),
    '-36.7900,174.8200': makeLocation({ name: 'Browns Bay' }),
  }

  const forecastKeys = [
    buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'),
  ]

  it('should return locations without a matching forecast key', () => {
    const entries = buildScheduledLocationEntries('sup', TODAY, null, 'all-day', forecastKeys)(locations)
    const keys = entries.map(([key]) => key)

    expect(keys).toHaveLength(2)
    expect(keys).toContain('-36.8400,174.7670')
    expect(keys).toContain('-36.7900,174.8200')
    expect(keys).not.toContain('-36.8547,174.8317')
  })

  it('should sort results by name ascending', () => {
    const entries = buildScheduledLocationEntries('sup', TODAY, null, 'all-day', forecastKeys)(locations)
    const names = entries.map(([, entry]) => entry.name)
    expect(names).toEqual(['Browns Bay', 'Takapuna Beach'])
  })

  it('should return empty array when locations is null', () => {
    const entries = buildScheduledLocationEntries('sup', TODAY, null, 'all-day', forecastKeys)(null)
    expect(entries).toEqual([])
  })

  it('should return empty array when all locations have forecasts', () => {
    const allKeys = Object.keys(locations).map(coord =>
      buildForecastKey('sup', '2026-02-11', 'all-day', coord)
    )
    const entries = buildScheduledLocationEntries('sup', TODAY, null, 'all-day', allKeys)(locations)
    expect(entries).toEqual([])
  })
})

describe('useScheduledLocationEntries', () => {
  function ScheduledEntriesConsumer() {
    const entries = useScheduledLocationEntries()
    return <div data-testid="scheduled-entries">{JSON.stringify(entries)}</div>
  }

  it('should return a location missing forecast', () => {
    const locations = {
      '-36.8547,174.8317': makeLocation({ name: 'Mission Bay' }),
      '-36.8400,174.7670': makeLocation({ name: 'Takapuna Beach' }),
    }
    const forecast = {
      [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
    }

    render(
      <ForecastStoreProvider initialState={{ locations, forecast }}>
        <ScheduledEntriesConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('scheduled-entries').textContent)
    expect(entries).toHaveLength(1)
    expect(entries[0][0]).toBe('-36.8400,174.7670')
    expect(entries[0][1].name).toBe('Takapuna Beach')
  })

  it('should return empty array when locations is null', () => {
    render(
      <ForecastStoreProvider>
        <ScheduledEntriesConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('scheduled-entries').textContent)
    expect(entries).toEqual([])
  })
})
