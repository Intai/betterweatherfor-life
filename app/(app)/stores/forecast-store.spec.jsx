import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { PICK_DATE, TODAY, TOMORROW } from '@/app/(app)/constants'
import { createForecastStore, ForecastStoreProvider, useForecastStore } from './forecast-store'

describe('createForecastStore', () => {
  it('should initialise with default state', () => {
    const store = createForecastStore()
    const state = store.getState()
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
      selectedActivity: 'kayaking',
      selectedDay: TOMORROW,
    })
    const state = store.getState()
    expect(state.selectedActivity).toBe('kayaking')
    expect(state.selectedDay).toBe(TOMORROW)
    expect(state.selectedDate).toBe(null)
    expect(state.selectedTimeRange).toBe('all-day')
  })

  it('should update selectedActivity via setActivity', () => {
    const store = createForecastStore()
    act(() => store.getState().setActivity('cycling'))
    expect(store.getState().selectedActivity).toBe('cycling')
  })

  it('should update selectedDay via setDay', () => {
    const store = createForecastStore()
    act(() => store.getState().setDay(PICK_DATE))
    expect(store.getState().selectedDay).toBe(PICK_DATE)
  })

  it('should update selectedDate via setDate', () => {
    const date = new Date('2026-02-15')
    const store = createForecastStore()
    act(() => store.getState().setDate(date))
    expect(store.getState().selectedDate).toBe(date)
  })

  it('should update selectedTimeRange via setTimeRange', () => {
    const store = createForecastStore()
    act(() => store.getState().setTimeRange('morning'))
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
    act(() => store.getState().removeForecast(key1))
    expect(store.getState().forecast).toEqual({
      [key2]: { name: 'Mission Bay', score: 72 },
    })
  })

  it('should not break state when removeForecast is called with a non-existent key', () => {
    const key = 'sup;2026-02-12;all-day;-36.8547,174.8317'
    const store = createForecastStore({
      forecast: { [key]: { name: 'Takapuna', score: 85 } },
    })
    act(() => store.getState().removeForecast('non-existent-key'))
    expect(store.getState().forecast).toEqual({
      [key]: { name: 'Takapuna', score: 85 },
    })
  })
})

function TestConsumer({ selector }) {
  const value = useForecastStore(selector)
  return <div data-testid="value">{String(value)}</div>
}

describe('useForecastStore', () => {
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
