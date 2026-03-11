import { assoc, dissoc, mergeRight } from 'ramda'
import { buildLocationKey } from './forecast'
import { getItem, setItem } from './local-storage'

const KEY = 'locations'

/**
 * Retrieve all saved locations from localStorage.
 * @returns An object keyed by "lat,lng" coordinate strings.
 */
export const getLocations = () => getItem(KEY, {})

/**
 * Add or replace a location in localStorage (keyed by coordinates).
 * @param location - The location object to save.
 */
export const addLocation = ({ name, area, latitude, longitude, timeZone }) => {
  const locations = getLocations()
  const key = buildLocationKey(latitude, longitude)
  setItem(KEY, assoc(key, { name, area, latitude, longitude, timeZone }, locations))
}

/**
 * Bulk-merge locations into localStorage. New locations take priority for matching keys;
 * existing locations from other cities are preserved.
 * @param {object} newLocations - Object keyed by "lat,lng" coordinate strings.
 */
export const addLocations = newLocations => {
  const existing = getLocations()
  setItem(KEY, mergeRight(existing, newLocations))
}

/**
 * Remove a location by coordinate key from localStorage.
 * @param key - The "lat,lng" key of the location to remove.
 */
export const removeLocation = key => {
  const locations = getLocations()
  setItem(KEY, dissoc(key, locations))
}
