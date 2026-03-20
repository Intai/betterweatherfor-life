'use client'

import { createContext, createElement, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'

const baseState = {
  citySlugs: [],
}

/**
 * Creates a Zustand store for managing city slugs.
 * @param {Object} [initialState] - Optional initial state to merge with base state.
 * @returns {import('zustand').StoreApi} The Zustand store instance.
 */
export function createCitiesStore(initialState) {
  return createStore(() => ({
    ...baseState,
    ...initialState,
  }))
}

const CitiesStoreContext = createContext(null)

/**
 * Provider component that creates and supplies a cities store to its children.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components.
 * @param {Object} [props.initialState] - Optional initial state for the store.
 * @returns {React.ReactElement}
 */
export function CitiesStoreProvider({ children, initialState }) {
  const [store] = useState(() => createCitiesStore(initialState))
  return createElement(CitiesStoreContext.Provider, { value: store }, children)
}

/**
 * Hook to access the cities store. Must be used within a CitiesStoreProvider.
 * @param {Function} selector - Selector function to pick state from the store.
 * @returns {*} The selected state value.
 * @throws {Error} If used outside of a CitiesStoreProvider.
 */
export function useCitiesStore(selector) {
  const store = useContext(CitiesStoreContext)
  if (store === null) {
    throw new Error('useCitiesStore must be used within a CitiesStoreProvider')
  }
  return useStore(store, selector)
}
