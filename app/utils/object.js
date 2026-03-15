import { curry } from 'ramda'

/**
 * Filter an object's entries using a predicate function.
 * @param {Function} func - Predicate called with (value, key, obj) for each entry.
 * @param {object} obj - The source object to filter.
 * @returns {object} A new object containing only the entries for which the predicate returned truthy.
 */
export const filterObj = curry((func, obj) => {
  const result = {}
  for (const key in obj) {
    const value = obj[key]
    if (func(value, key, obj)) {
      result[key] = value
    }
  }
  return result
})
