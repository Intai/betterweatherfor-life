'use client'

import { createContext, createElement, useContext, useState } from 'react'
import { assocPath, dissocPath, mergeDeepRight, pipe } from 'ramda'
import { createStore, useStore } from 'zustand'
import { fetchJson, postJson } from '@/app/utils/api'
import { buildLocationKey, extractCityLocations, extractLocationKey } from '@/app/utils/forecast'
import {
  addLocations,
  removeLocation as deleteLocation,
  getLocations,
  addLocation as saveLocation,
} from '@/app/utils/location-storage'
import { getPreferences, setPreference } from '@/app/utils/preferences-storage'
import {
  ALL_DAY, SELECTED_ACTIVITY, SELECTED_DATE, SELECTED_DAY,
  SELECTED_TIME_RANGE, SUP, TODAY,
} from '../constants'

const baseState = {
  isLoaded: false,
  citySlug: null,
  locations: null,
  [SELECTED_ACTIVITY]: SUP,
  [SELECTED_DAY]: TODAY,
  [SELECTED_DATE]: null,
  [SELECTED_TIME_RANGE]: ALL_DAY,
  forecast: {},
}

export function createForecastStore(initialState) {
  return createStore((set, get) => ({
    ...baseState,
    ...initialState,
    ...getPreferences(),

    setActivity: activity => {
      set({ [SELECTED_ACTIVITY]: activity })
      setPreference(SELECTED_ACTIVITY, activity)
    },
    setDay: day => {
      set({ [SELECTED_DAY]: day })
      setPreference(SELECTED_DAY, day)
    },
    setDate: date => {
      set({ [SELECTED_DATE]: date })
      setPreference(SELECTED_DATE, date)
    },
    setTimeRange: timeRange => {
      set({ [SELECTED_TIME_RANGE]: timeRange })
      setPreference(SELECTED_TIME_RANGE, timeRange)
    },

    /**
     * Loads locations from local storage and fetches their forecasts from the API.
     * Skips if citySlug is already set.
     * @returns {Promise<void>}
     */
    initLocations: async () => {
      if (get().citySlug) {
        // Locations are defined on the server-side for a city.
        return
      }
      // Otherwise load forecasts according to the client-side local storage.
      const locations = getLocations()
      set({ locations })
      const keys = Object.keys(locations)
      if (keys.length > 0) {
        const param = keys.join(';')
        const forecast = await fetchJson(`/api/forecasts?locations=${param}`)
        set(mergeDeepRight({ forecast }))
      }
      set({ isLoaded: true })
    },
    /**
     * Posts a new location to the API, saves it to local storage, and adds it to the store state.
     * @param {Object} location
     * @param {string} location.name
     * @param {string} location.area
     * @param {string} location.citySlug
     * @param {number} location.latitude
     * @param {number} location.longitude
     * @returns {Promise<void>}
     */
    addLocation: async ({ name, area, citySlug, latitude, longitude }) => {
      const loc = await postJson('/api/locations', { name, area, citySlug, latitude, longitude })
      const key = buildLocationKey(loc.latitude, loc.longitude)
      if (get().citySlug) {
        // On a city page, locations come from server-side forecast data, not localStorage.
        // Extract all existing city locations from forecasts and bulk-save them alongside
        // the new location so they persist when the user visits the home page.
        const cityLocations = extractCityLocations(get().forecast)
        addLocations({ ...cityLocations, [key]: loc })
      } else {
        // On the home page, locations are managed client-side.
        // Save to localStorage and update the store state directly.
        saveLocation(loc)
        set(assocPath(['locations', key], loc))
        // Fetch forecast data in the background so the location transitions
        // from a ScheduledLocationCard placeholder to a full LocationCard.
        fetchJson(`/api/forecasts?locations=${key}`)
          .then(forecast => set(mergeDeepRight({ forecast })))
      }
    },
    /**
     * Removes a location from local storage and the store state by key.
     * @param {string} key - Location key.
     */
    removeLocation: key => {
      deleteLocation(key)
      set(dissocPath(['locations', key]))
    },
    /**
     * Extracts the location key from a forecast key, removes the location from storage,
     * and removes both the location and forecast from the store state.
     * @param {string} key - Forecast key.
     */
    removeForecast: key => {
      const locationKey = extractLocationKey(key)
      deleteLocation(locationKey)
      set(pipe(
        dissocPath(['locations', locationKey]),
        dissocPath(['forecast', key])
      ))
    },
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
