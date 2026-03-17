const mockReturning = jest.fn()
const mockOnConflictDoUpdate = jest.fn(() => ({ returning: mockReturning }))
const mockValues = jest.fn(() => ({ onConflictDoUpdate: mockOnConflictDoUpdate }))
const mockInsert = jest.fn(() => ({ values: mockValues }))
const mockFrom = jest.fn()
const mockSelect = jest.fn(() => ({ from: mockFrom }))
const mockExecSync = jest.fn(() => Buffer.from(''))
const mockReadFileSync = jest.fn()

jest.mock('@/app/utils/logger', () => ({ info: jest.fn(), error: jest.fn() }))

jest.mock('@/db', () => ({
  __esModule: true,
  default: { insert: mockInsert, select: mockSelect },
}))

jest.mock('drizzle-orm', () => ({
  sql: jest.fn(strings => strings.join('')),
}))

jest.mock('child_process', () => ({
  execSync: mockExecSync,
}))

jest.mock('fs', () => ({
  readFileSync: mockReadFileSync,
}))

jest.mock('@/app/utils/date', () => ({
  dateNow: jest.fn(() => new Date(2026, 1, 14, 0, 0)),
  formatISODate: jest.fn(() => '2026-02-14'),
}))

jest.mock('@/app/(app)/constants', () => ({
  ACTIVITIES: ['sup'],
}))

const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

function setupModuleLevelMocks() {
  mockFrom.mockResolvedValue([])
  mockReadFileSync.mockReturnValue('')
}

const makeLocation = (overrides = {}) => ({
  id: 1,
  name: 'Mission Bay',
  latitude: '-36.8547',
  longitude: '174.8317',
  timeZone: 'Pacific/Auckland',
  ...overrides,
})

const makeForecastValue = (overrides = {}) => ({
  score: 85,
  condition: 'ideal',
  wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
  tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
  water: 'Green',
  temp: '22\u00B0C',
  precipitation: { amount: '0mm', condition: 'ideal' },
  daylight: { sunset: '20:22', condition: 'ideal' },
  summary: 'Light onshore breeze.',
  uv: { index: 4, condition: 'ideal' },
  humidity: null,
  visibility: null,
  analysis: 'Good conditions.',
  hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
  ...overrides,
})

describe('db/update-forecasts', () => {
  const promptTemplate = [
    'geolocation -36.97484844433063,174.62043566419308 on 2026-02-13',
    'latitude=-36.97484844433063&longitude=174.62043566419308&startDate=2026-02-13',
    'geolocation -36.97484844433063,174.62043566419308 on 2026-02-13',
    'lat=-36.97484844433063&lng=174.62043566419308&date=2026-02-13',
    'forecast-{activity}.json',
  ].join('\n')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('updateForecasts', () => {
    async function loadAndCall(setupMocks, locationSlug) {
      setupModuleLevelMocks()
      const { updateForecasts } = require('./update-forecasts')
      await new Promise(resolve => setTimeout(resolve, 0))
      jest.clearAllMocks()
      setupMocks()
      return updateForecasts(locationSlug)
    }

    it('should process a single location with a single forecast entry', async () => {
      const location = makeLocation()
      const value = makeForecastValue()

      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([location])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({ 'sup;2026-02-14;all-day': value }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      })

      expect(total).toBe(1)
      expect(mockExecSync).toHaveBeenCalledTimes(1)
      const prompt = mockExecSync.mock.calls[0][1].input
      expect(prompt).toContain('-36.8547')
      expect(prompt).toContain('174.8317')
      expect(prompt).toContain('2026-02-14')
      expect(prompt).not.toContain('-36.97484844433063')
      expect(prompt).toContain('mission-bay-{activity}.json')
      expect(prompt).not.toContain('forecast-{activity}.json')
      expect(mockValues).toHaveBeenCalledWith({
        locationId: 1,
        activity: 'sup',
        date: '2026-02-14',
        timeRange: 'all-day',
        score: 85,
        condition: 'ideal',
        wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
        tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
        water: 'Green',
        temp: '22\u00B0C',
        precipitation: { amount: '0mm', condition: 'ideal' },
        daylight: { sunset: '20:22', condition: 'ideal' },
        summary: 'Light onshore breeze.',
        uv: { index: 4, condition: 'ideal' },
        humidity: null,
        visibility: null,
        analysis: 'Good conditions.',
        hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
      })
      const { forecasts } = require('@/db/schema/forecasts')
      expect(mockOnConflictDoUpdate).toHaveBeenCalledWith({
        target: [forecasts.locationId, forecasts.activity, forecasts.date, forecasts.timeRange],
        set: expect.objectContaining({
          score: 85,
          condition: 'ideal',
          summary: 'Light onshore breeze.',
          uv: { index: 4, condition: 'ideal' },
          humidity: null,
          visibility: null,
          analysis: 'Good conditions.',
          hourly: [{ time: '06:00', score: 82, condition: 'ideal' }],
        }),
      })
    })

    it('should upsert multiple forecast entries per location', async () => {
      const location = makeLocation()

      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([location])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({
            'sup;2026-02-14;all-day': makeForecastValue(),
            'sup;2026-02-14;morning': makeForecastValue(),
          }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      })

      expect(total).toBe(2)
      expect(mockInsert).toHaveBeenCalledTimes(2)
      const prompt = mockExecSync.mock.calls[0][1].input
      expect(prompt.match(/-36\.8547/g)).toHaveLength(4)
      expect(prompt.match(/174\.8317/g)).toHaveLength(4)
      expect(prompt.match(/2026-02-14/g)).toHaveLength(4)
      expect(prompt.match(/-36\.97484844433063/g)).toBeNull()
      expect(prompt.match(/174\.62043566419308/g)).toBeNull()
      expect(prompt.match(/2026-02-13/g)).toBeNull()
      expect(prompt.match(/mission-bay-\{activity\}\.json/g)).toHaveLength(1)
      expect(prompt.match(/forecast-\{activity\}\.json/g)).toBeNull()
    })

    it('should process multiple locations', async () => {
      const location1 = makeLocation()
      const location2 = makeLocation({
        id: 2,
        name: 'Takapuna Beach',
        latitude: '-36.7840',
        longitude: '174.7740',
      })

      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([location1, location2])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({
            'sup;2026-02-14;all-day': makeForecastValue(),
          }))
          .mockReturnValueOnce(JSON.stringify({
            'sup;2026-02-14;all-day': makeForecastValue(),
          }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      })

      expect(total).toBe(2)
      expect(mockExecSync).toHaveBeenCalledTimes(2)
      expect(mockReadFileSync).toHaveBeenCalledTimes(3)
      const prompt1 = mockExecSync.mock.calls[0][1].input
      expect(prompt1.match(/-36\.8547/g)).toHaveLength(4)
      expect(prompt1.match(/174\.8317/g)).toHaveLength(4)
      expect(prompt1.match(/2026-02-14/g)).toHaveLength(4)
      expect(prompt1.match(/-36\.97484844433063/g)).toBeNull()
      expect(prompt1.match(/174\.62043566419308/g)).toBeNull()
      expect(prompt1.match(/2026-02-13/g)).toBeNull()
      expect(prompt1.match(/mission-bay-\{activity\}\.json/g)).toHaveLength(1)
      expect(prompt1.match(/forecast-\{activity\}\.json/g)).toBeNull()
      const prompt2 = mockExecSync.mock.calls[1][1].input
      expect(prompt2.match(/-36\.7840/g)).toHaveLength(4)
      expect(prompt2.match(/174\.7740/g)).toHaveLength(4)
      expect(prompt2.match(/2026-02-14/g)).toHaveLength(4)
      expect(prompt2.match(/-36\.97484844433063/g)).toBeNull()
      expect(prompt2.match(/174\.62043566419308/g)).toBeNull()
      expect(prompt2.match(/2026-02-13/g)).toBeNull()
      expect(prompt2.match(/takapuna-beach-\{activity\}\.json/g)).toHaveLength(1)
      expect(prompt2.match(/forecast-\{activity\}\.json/g)).toBeNull()
    })

    it('should return 0 when there are no locations', async () => {
      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([])
        mockReadFileSync.mockReturnValueOnce(promptTemplate)
      })

      expect(total).toBe(0)
      expect(mockExecSync).not.toHaveBeenCalled()
    })

    it('should filter to a single location when slug is provided', async () => {
      const location1 = makeLocation()
      const location2 = makeLocation({
        id: 2,
        name: 'Takapuna Beach',
        latitude: '-36.7840',
        longitude: '174.7740',
      })

      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([location1, location2])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({
            'sup;2026-02-14;all-day': makeForecastValue(),
          }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      }, 'takapuna-beach')

      expect(total).toBe(1)
      expect(mockExecSync).toHaveBeenCalledTimes(1)
      const prompt = mockExecSync.mock.calls[0][1].input
      expect(prompt).toContain('-36.7840')
      expect(prompt).toContain('174.7740')
    })

    it('should skip locations not near midnight when no slug is provided', async () => {
      const { dateNow } = require('@/app/utils/date')
      dateNow.mockReturnValue(new Date(2026, 1, 14, 12, 0))

      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([makeLocation()])
        mockReadFileSync.mockReturnValueOnce(promptTemplate)
      })

      expect(total).toBe(0)
      expect(mockExecSync).not.toHaveBeenCalled()
      dateNow.mockReturnValue(new Date(2026, 1, 14, 0, 0))
    })

    it('should process locations near midnight at 23:30+ when no slug is provided', async () => {
      const { dateNow } = require('@/app/utils/date')
      dateNow.mockReturnValue(new Date(2026, 1, 14, 23, 30))

      const location = makeLocation()
      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([location])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({ 'sup;2026-02-14;all-day': makeForecastValue() }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      })

      expect(total).toBe(1)
      expect(mockExecSync).toHaveBeenCalledTimes(1)
      dateNow.mockReturnValue(new Date(2026, 1, 14, 0, 0))
    })

    it('should return 0 when slug matches no locations', async () => {
      const total = await loadAndCall(() => {
        mockFrom.mockResolvedValue([makeLocation()])
        mockReadFileSync.mockReturnValueOnce(promptTemplate)
      }, 'no-such-place')

      expect(total).toBe(0)
      expect(mockExecSync).not.toHaveBeenCalled()
    })

    it('should pick only allowed forecast fields', async () => {
      const location = makeLocation()
      const value = {
        ...makeForecastValue(),
        name: 'Mission Bay',
        area: 'Beach, Auckland',
        timeZone: 'Pacific/Auckland',
        extraField: 'should be excluded',
      }

      await loadAndCall(() => {
        mockFrom.mockResolvedValue([location])
        mockReadFileSync
          .mockReturnValueOnce(promptTemplate)
          .mockReturnValueOnce(JSON.stringify({ 'sup;2026-02-14;all-day': value }))
        mockReturning.mockResolvedValue([{ id: 1 }])
      })

      const valuesArg = mockValues.mock.calls[0][0]
      expect(valuesArg).not.toHaveProperty('name')
      expect(valuesArg).not.toHaveProperty('area')
      expect(valuesArg).not.toHaveProperty('timeZone')
      expect(valuesArg).not.toHaveProperty('extraField')
    })
  })

  describe('module-level execution', () => {
    it('should exit with code 0 on success', async () => {
      setupModuleLevelMocks()
      require('./update-forecasts')
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockExit).toHaveBeenCalledWith(0)
    })

    it('should exit with code 1 on failure', async () => {
      mockReadFileSync.mockReturnValue('')
      mockFrom.mockRejectedValue(new Error('DB error'))
      require('./update-forecasts')
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(mockExit).toHaveBeenCalledWith(1)
    })
  })
})
