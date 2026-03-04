import { render, screen } from '@testing-library/react'
import { PICK_DATE, TODAY, TOMORROW } from '@/app/(app)/constants'
import { createForecastStore, ForecastStoreProvider, useForecastStore } from './forecast-store'
import { fetchJson, postJson } from '@/app/utils/api'
import { extractCityLocations } from '@/app/utils/forecast'
import {
  addLocations,
  buildLocationKey,
  removeLocation as deleteLocation,
  getLocations,
  addLocation as saveLocation,
} from '@/app/utils/location-storage'

jest.mock('@/app/utils/api', () => ({
  fetchJson: jest.fn(),
  postJson: jest.fn(),
}))

jest.mock('@/app/utils/forecast', () => ({
  ...jest.requireActual('@/app/utils/forecast'),
  extractCityLocations: jest.fn(),
}))

jest.mock('@/app/utils/location-storage', () => ({
  buildLocationKey: jest.fn(),
  addLocation: jest.fn(),
  addLocations: jest.fn(),
  getLocations: jest.fn(),
  removeLocation: jest.fn(),
}))

describe('createForecastStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialise with default state', () => {
    const store = createForecastStore()
    const state = store.getState()
    expect(state.isLoaded).toBe(false)
    expect(state.citySlug).toBeNull()
    expect(state.locations).toBeNull()
    expect(state.selectedActivity).toBe('sup')
    expect(state.selectedDay).toBe(TODAY)
    expect(state.selectedDate).toBe(null)
    expect(state.selectedTimeRange).toBe('all-day')
    expect(state.forecast).toEqual({})
    expect(typeof state.setActivity).toBe('function')
    expect(typeof state.setDay).toBe('function')
    expect(typeof state.setDate).toBe('function')
    expect(typeof state.setTimeRange).toBe('function')
    expect(typeof state.removeForecast).toBe('function')
  })

  it('should override defaults with custom initialState', () => {
    const store = createForecastStore({
      citySlug: 'sydney',
      selectedActivity: 'kayaking',
      selectedDay: TOMORROW,
    })
    const state = store.getState()
    expect(state.citySlug).toBe('sydney')
    expect(state.selectedActivity).toBe('kayaking')
    expect(state.selectedDay).toBe(TOMORROW)
    expect(state.selectedDate).toBe(null)
    expect(state.selectedTimeRange).toBe('all-day')
  })

  it('should update selectedActivity via setActivity', () => {
    const store = createForecastStore()
    store.getState().setActivity('cycling')
    expect(store.getState().selectedActivity).toBe('cycling')
  })

  it('should update selectedDay via setDay', () => {
    const store = createForecastStore()
    store.getState().setDay(PICK_DATE)
    expect(store.getState().selectedDay).toBe(PICK_DATE)
  })

  it('should update selectedDate via setDate', () => {
    const date = new Date('2026-02-15')
    const store = createForecastStore()
    store.getState().setDate(date)
    expect(store.getState().selectedDate).toBe(date)
  })

  it('should update selectedTimeRange via setTimeRange', () => {
    const store = createForecastStore()
    store.getState().setTimeRange('morning')
    expect(store.getState().selectedTimeRange).toBe('morning')
  })

  it('should remove the correct key from forecast via removeForecast', () => {
    const key1 = 'sup;2026-02-12;all-day;-36.8547,174.8317'
    const key2 = 'kayaking;2026-02-12;morning;-36.8547,174.8317'
    const store = createForecastStore({
      forecast: {
        [key1]: { name: 'Takapuna', score: 85 },
        [key2]: { name: 'Mission Bay', score: 72 },
      },
    })
    store.getState().removeForecast(key1)
    expect(store.getState().forecast).toEqual({
      [key2]: { name: 'Mission Bay', score: 72 },
    })
  })

  it('should not break state when removeForecast is called with a non-existent key', () => {
    const key = 'sup;2026-02-12;all-day;-36.8547,174.8317'
    const store = createForecastStore({
      forecast: { [key]: { name: 'Takapuna', score: 85 } },
    })
    store.getState().removeForecast('non-existent-key')
    expect(store.getState().forecast).toEqual({
      [key]: { name: 'Takapuna', score: 85 },
    })
  })

  it('should remove forecast entry and its location by key', () => {
    const store = createForecastStore({
      forecast: {
        'sup;2026-03-01;all-day;1,2': { score: 80 },
        'sup;2026-03-01;all-day;3,4': { score: 70 },
      },
      locations: {
        '1,2': { name: 'A' },
        '3,4': { name: 'B' },
      },
    })
    store.getState().removeForecast('sup;2026-03-01;all-day;1,2')
    const state = store.getState()
    expect(state.forecast).toEqual({ 'sup;2026-03-01;all-day;3,4': { score: 70 } })
    expect(state.locations).toEqual({ '3,4': { name: 'B' } })
    expect(deleteLocation).toHaveBeenCalledWith('1,2')
  })

  describe('initLocations', () => {
    it('should read localStorage, set locations, and fetch forecasts when locations exist', async () => {
      const locations = {
        '51.5,-0.1': { latitude: 51.5, longitude: -0.1 },
        '48.8,2.3': { latitude: 48.8, longitude: 2.3 },
      }
      getLocations.mockReturnValue(locations)
      const forecastData = { 'sup;2026-03-01;all-day;51.5,-0.1': { score: 80 } }
      fetchJson.mockResolvedValue(forecastData)

      const store = createForecastStore({ forecast: { existing: { score: 50 } } })
      await store.getState().initLocations()

      expect(getLocations).toHaveBeenCalled()
      const state = store.getState()
      expect(state.isLoaded).toBe(true)
      expect(state.locations).toEqual(locations)
      expect(fetchJson).toHaveBeenCalledWith('/api/forecasts?locations=51.5,-0.1;48.8,2.3')
      expect(state.forecast).toEqual({
        existing: { score: 50 },
        'sup;2026-03-01;all-day;51.5,-0.1': { score: 80 },
      })
    })

    it('should skip when citySlug is set', async () => {
      const store = createForecastStore({ citySlug: 'sydney' })
      await store.getState().initLocations()

      expect(getLocations).not.toHaveBeenCalled()
      expect(fetchJson).not.toHaveBeenCalled()
    })

    it('should not fetch forecasts when there are no saved locations', async () => {
      getLocations.mockReturnValue({})

      const store = createForecastStore()
      await store.getState().initLocations()

      const state = store.getState()
      expect(state.isLoaded).toBe(true)
      expect(state.locations).toEqual({})
      expect(fetchJson).not.toHaveBeenCalled()
    })
  })

  describe('addLocation', () => {
    it('should post to the API, save to localStorage, and add to state', async () => {
      const apiResponse = {
        name: 'Bondi',
        area: 'Eastern Suburbs',
        latitude: -33.89,
        longitude: 151.27,
        timeZone: 'Australia/Sydney',
      }
      postJson.mockResolvedValue(apiResponse)
      buildLocationKey.mockReturnValue('-33.89,151.27')
      const forecastData = { 'sup;2026-03-01;all-day;-33.89,151.27': { score: 90 } }
      fetchJson.mockResolvedValue(forecastData)

      const store = createForecastStore({ locations: {} })
      await store.getState().addLocation({
        name: 'Bondi',
        area: 'Eastern Suburbs',
        citySlug: 'sydney',
        latitude: -33.89,
        longitude: 151.27,
      })

      expect(postJson).toHaveBeenCalledWith('/api/locations', {
        name: 'Bondi',
        area: 'Eastern Suburbs',
        citySlug: 'sydney',
        latitude: -33.89,
        longitude: 151.27,
      })
      const expectedLoc = {
        name: 'Bondi',
        area: 'Eastern Suburbs',
        latitude: -33.89,
        longitude: 151.27,
        timeZone: 'Australia/Sydney',
      }
      expect(saveLocation).toHaveBeenCalledWith(expectedLoc)
      expect(store.getState().locations).toEqual({ '-33.89,151.27': expectedLoc })
      expect(fetchJson).toHaveBeenCalledWith('/api/forecasts?locations=-33.89,151.27')

      // Flush the background .then() microtask
      await Promise.resolve()
      expect(store.getState().forecast).toEqual(forecastData)
    })

    it('should save city locations plus new location when citySlug is set', async () => {
      const apiResponse = { name: 'Bondi', area: 'Eastern Suburbs', latitude: -33.89, longitude: 151.27, timeZone: 'Australia/Sydney' }
      postJson.mockResolvedValue(apiResponse)
      buildLocationKey.mockReturnValue('-33.89,151.27')
      const cityLocations = { '-33.8,151.3': { name: 'Manly', area: 'North', latitude: -33.8, longitude: 151.3, timeZone: 'Australia/Sydney' } }
      extractCityLocations.mockReturnValue(cityLocations)

      const forecast = { 'sup;2026-03-01;all-day;-33.8,151.3': { name: 'Manly', area: 'North', timeZone: 'Australia/Sydney', score: 80 } }
      const store = createForecastStore({ citySlug: 'sydney', locations: {}, forecast })
      await store.getState().addLocation({
        name: 'Bondi', area: 'Eastern Suburbs', citySlug: 'sydney', latitude: -33.89, longitude: 151.27,
      })

      expect(extractCityLocations).toHaveBeenCalledWith(forecast)
      expect(addLocations).toHaveBeenCalledWith({ ...cityLocations, '-33.89,151.27': apiResponse })
      expect(saveLocation).not.toHaveBeenCalled()
      expect(store.getState().locations).toEqual({})
    })

    it('should initialise locations object when locations is null', async () => {
      const apiResponse = { name: 'Manly', area: 'North', latitude: -33.8, longitude: 151.3, timeZone: 'Australia/Sydney' }
      postJson.mockResolvedValue(apiResponse)
      buildLocationKey.mockReturnValue('-33.8,151.3')
      const forecastData = { 'sup;2026-03-01;all-day;-33.8,151.3': { score: 75 } }
      fetchJson.mockResolvedValue(forecastData)

      const store = createForecastStore()
      await store.getState().addLocation({
        name: 'Manly',
        area: 'North',
        citySlug: 'sydney',
        latitude: -33.8,
        longitude: 151.3,
      })

      const expectedLoc = { name: 'Manly', area: 'North', latitude: -33.8, longitude: 151.3, timeZone: 'Australia/Sydney' }
      expect(store.getState().locations).toEqual({ '-33.8,151.3': expectedLoc })
      expect(fetchJson).toHaveBeenCalledWith('/api/forecasts?locations=-33.8,151.3')
      await Promise.resolve()
      expect(store.getState().forecast).toEqual(forecastData)
    })
  })

  describe('removeLocation', () => {
    it('should remove from localStorage and dissoc from state', () => {
      const store = createForecastStore({
        locations: {
          '1,2': { name: 'A' },
          '3,4': { name: 'B' },
        },
      })
      store.getState().removeLocation('1,2')

      expect(deleteLocation).toHaveBeenCalledWith('1,2')
      expect(store.getState().locations).toEqual({ '3,4': { name: 'B' } })
    })

    it('should handle null locations gracefully', () => {
      const store = createForecastStore()
      store.getState().removeLocation('1,2')

      expect(deleteLocation).toHaveBeenCalledWith('1,2')
      expect(store.getState().locations).toBeNull()
    })
  })
})

describe('useForecastStore', () => {
  function TestConsumer({ selector }) {
    const value = useForecastStore(selector)
    return <div data-testid="value">{String(value)}</div>
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide store state to child components', () => {
    render(
      <ForecastStoreProvider>
        <TestConsumer selector={s => s.selectedActivity} />
      </ForecastStoreProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('sup')
  })

  it('should provide custom initial state to child components', () => {
    render(
      <ForecastStoreProvider initialState={{ selectedActivity: 'snorkeling' }}>
        <TestConsumer selector={s => s.selectedActivity} />
      </ForecastStoreProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('snorkeling')
  })

  it('should throw when useForecastStore is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer selector={s => s.selectedActivity} />))
      .toThrow('useForecastStore must be used within a ForecastStoreProvider')
    consoleError.mockRestore()
  })
})
