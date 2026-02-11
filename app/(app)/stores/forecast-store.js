'use client'

import { createContext, createElement, useContext, useState } from 'react'
import { createStore, useStore } from 'zustand'
import { ALL_DAY, TODAY } from '@/app/(app)/constants'
import { SUP } from '../constants'

const defaultState = {
  selectedActivity: SUP,
  selectedDay: TODAY,
  selectedDate: null,
  selectedTimeRange: ALL_DAY,
}

export function createForecastStore(initialState) {
  return createStore(set => ({
    ...defaultState,
    ...initialState,
    setActivity: activity => set({ selectedActivity: activity }),
    setDay: day => set({ selectedDay: day }),
    setDate: date => set({ selectedDate: date }),
    setTimeRange: timeRange => set({ selectedTimeRange: timeRange }),
  }))
}

const ForecastStoreContext = createContext(null)

export function ForecastStoreProvider({ children, initialState }) {
  const [store] = useState(() => createForecastStore(initialState))
  return createElement(ForecastStoreContext.Provider, { value: store }, children)
}

export function useForecastStore(selector) {
  const store = useContext(ForecastStoreContext)
  if (store === null) {
    throw new Error('useForecastStore must be used within a ForecastStoreProvider')
  }
  return useStore(store, selector)
}
