import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import { find, flip, includes, pipe, propSatisfies } from 'ramda'
import { anyTruthy } from '@/app/utils/logic'

const hasType = pipe(
  includes,
  flip(propSatisfies)('types'),
)

/**
 * Find the city-level address component from a list of Google Places address components.
 * Tries `locality` first, then falls back to `administrative_area_level_1`, `administrative_area_level_2`, and finally `country`.
 * @param {Object[]} components - Google Places address components.
 * @returns {Object|undefined} The matching address component, or undefined.
 */
export const findCityComponent = anyTruthy([
  find(hasType('locality')),
  find(hasType('administrative_area_level_1')),
  find(hasType('administrative_area_level_2')),
  find(hasType('country')),
])

/**
 * Lazy-load the Google Maps Places library and return the
 * AutocompleteService and AutocompleteSessionToken constructors.
 * The result is cached by `importLibrary` so the library is loaded only once.
 *
 * @returns {Promise<{ AutocompleteService: Function, AutocompleteSessionToken: Function }>}
 */
export const loadPlacesLibrary = () => {
  setOptions({
    key: process.env.GOOGLE_MAPS_API_KEY,
    v: 'weekly',
  })

  return importLibrary('places').then(
    ({ AutocompleteService, AutocompleteSessionToken, Place }) => ({
      AutocompleteService,
      AutocompleteSessionToken,
      Place,
    }),
  )
}
