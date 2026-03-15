import { render, screen } from '@testing-library/react'
import { TODAY } from '@/app/(app)/constants'
import { buildForecastKey } from '@/app/utils/forecast'
import { ForecastStoreProvider } from './forecast-store'
import {
  buildForecastEntries,
  buildForecastEntry,
  buildScheduledLocationEntries,
  buildSevenDayForecastEntries,
  useForecastEntries,
  useForecastEntry,
  useScheduledLocationEntries,
  useSevenDayForecastEntries,
} from './forecast-selectors'

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

describe('buildForecastEntry', () => {
  const forecast = {
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670')]: makeForecast({ score: 85 }),
    [buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
  }

  it('should return the matching forecast entry for the given geolocation', () => {
    const entry = buildForecastEntry('sup', TODAY, null, 'all-day', '-36.8547,174.8317')(forecast)
    expect(entry[0]).toBe(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    expect(entry[1].score).toBe(72)
  })

  it('should return undefined when no entry matches the geolocation', () => {
    const entry = buildForecastEntry('sup', TODAY, null, 'all-day', '-99.0000,99.0000')(forecast)
    expect(entry).toBeUndefined()
  })
})

describe('useForecastEntry', () => {
  function EntryConsumer({ geolocation }) {
    const entry = useForecastEntry(geolocation)
    return <div data-testid="entry">{JSON.stringify(entry ?? null)}</div>
  }

  it('should return the matching forecast entry from the store', () => {
    const forecast = {
      [buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
      [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
    }

    render(
      <ForecastStoreProvider initialState={{ forecast }}>
        <EntryConsumer geolocation="-36.8547,174.8317" />
      </ForecastStoreProvider>
    )

    const entry = JSON.parse(screen.getByTestId('entry').textContent)
    expect(entry).toHaveLength(2)
    expect(entry[0]).toBe(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    expect(entry[1].score).toBe(72)
  })

  it('should return null when no entry matches', () => {
    render(
      <ForecastStoreProvider initialState={{ forecast: {} }}>
        <EntryConsumer geolocation="-99.0000,99.0000" />
      </ForecastStoreProvider>
    )

    const entry = JSON.parse(screen.getByTestId('entry').textContent)
    expect(entry).toBeNull()
  })
})

describe('useForecastEntries', () => {
  function EntriesConsumer() {
    const entries = useForecastEntries()
    return <div data-testid="entries">{JSON.stringify(entries)}</div>
  }

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

describe('buildSevenDayForecastEntries', () => {
  const forecast = {
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
    [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670')]: makeForecast({ score: 85 }),
    [buildForecastKey('sup', '2026-02-12', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
    [buildForecastKey('sup', '2026-02-12', 'all-day', '-36.8400,174.7670')]: makeForecast({ score: 60 }),
    [buildForecastKey('sup', '2026-02-13', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 78 }),
    [buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 95 }),
    [buildForecastKey('sup', '2026-02-11', 'morning', '-36.8547,174.8317')]: makeForecast({ score: 99 }),
  }

  it('should filter by activity and all-day time range, pick best per date, and mark best day', () => {
    const entries = buildSevenDayForecastEntries('sup')(forecast)

    // Should have one entry per date (3 dates)
    expect(entries).toHaveLength(3)
    // Should be sorted by date ascending
    const scores = entries.map(([, entry]) => entry.score)
    expect(scores).toEqual([85, 90, 78])
    // Should exclude kayaking entries
    const keys = entries.map(([key]) => key)
    expect(keys).not.toContain(buildForecastKey('kayaking', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    // Should exclude morning time range entries
    expect(keys).not.toContain(buildForecastKey('sup', '2026-02-11', 'morning', '-36.8547,174.8317'))
    // Should pick best location per date (score 85 over 72 for 2026-02-11)
    expect(keys).toContain(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8400,174.7670'))
    expect(keys).not.toContain(buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317'))
    // Should mark only the highest-scoring entry with isBestDay
    expect(entries[0][1].isBestDay).toBeUndefined()
    expect(entries[1][1].isBestDay).toBe(true)
    expect(entries[2][1].isBestDay).toBeUndefined()
  })

  it('should return empty array when no entries match', () => {
    const entries = buildSevenDayForecastEntries('snorkelling')(forecast)
    expect(entries).toEqual([])
  })

  it('should return empty array for empty forecast', () => {
    const entries = buildSevenDayForecastEntries('sup')({})
    expect(entries).toEqual([])
  })
})

describe('useSevenDayForecastEntries', () => {
  function SevenDayConsumer() {
    const entries = useSevenDayForecastEntries()
    return <div data-testid="seven-day">{JSON.stringify(entries)}</div>
  }

  it('should return 7-day forecast entries from the store with best day marked', () => {
    const forecast = {
      [buildForecastKey('sup', '2026-02-11', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 72 }),
      [buildForecastKey('sup', '2026-02-12', 'all-day', '-36.8547,174.8317')]: makeForecast({ score: 90 }),
    }
    render(
      <ForecastStoreProvider initialState={{ forecast }}>
        <SevenDayConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('seven-day').textContent)
    expect(entries).toHaveLength(2)
    expect(entries[0][1].score).toBe(72)
    expect(entries[0][1].isBestDay).toBeUndefined()
    expect(entries[1][1].score).toBe(90)
    expect(entries[1][1].isBestDay).toBe(true)
  })

  it('should return empty array when no entries match', () => {
    render(
      <ForecastStoreProvider initialState={{ selectedActivity: 'snorkelling' }}>
        <SevenDayConsumer />
      </ForecastStoreProvider>
    )

    const entries = JSON.parse(screen.getByTestId('seven-day').textContent)
    expect(entries).toEqual([])
  })
})
