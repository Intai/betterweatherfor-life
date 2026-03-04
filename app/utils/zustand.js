import { prop } from 'ramda'

/**
 * Selector that returns whether the store has finished loading.
 * @param {Object} state
 * @returns {boolean}
 */
export const selectIsLoaded = prop('isLoaded')
