import { prop } from 'ramda'
import { render, screen } from '@testing-library/react'
import { CitiesStoreProvider, createCitiesStore, useCitiesStore } from './cities-store'

describe('createCitiesStore', () => {
  it('should initialise with default state', () => {
    const store = createCitiesStore()
    const state = store.getState()
    expect(state.citySlugs).toEqual([])
  })

  it('should override defaults with custom initialState', () => {
    const store = createCitiesStore({ citySlugs: ['sydney', 'melbourne'] })
    const state = store.getState()
    expect(state.citySlugs).toEqual(['sydney', 'melbourne'])
  })
})

describe('useCitiesStore', () => {
  function TestConsumer() {
    const value = useCitiesStore(prop('citySlugs'))
    return <div data-testid="value">{JSON.stringify(value)}</div>
  }

  it('should provide store state to child components', () => {
    render(
      <CitiesStoreProvider>
        <TestConsumer />
      </CitiesStoreProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('[]')
  })

  it('should provide custom initial state to child components', () => {
    render(
      <CitiesStoreProvider initialState={{ citySlugs: ['sydney'] }}>
        <TestConsumer />
      </CitiesStoreProvider>
    )
    expect(screen.getByTestId('value')).toHaveTextContent('["sydney"]')
  })

  it('should throw when useCitiesStore is used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestConsumer />))
      .toThrow('useCitiesStore must be used within a CitiesStoreProvider')
    consoleError.mockRestore()
  })
})
