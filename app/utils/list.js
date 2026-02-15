import { curry } from 'ramda'

/**
 * Build an object from a list by deriving keys and values via mapping functions.
 * @param {Function} funcKey - Function called with (item, index) to produce each key.
 * @param {Function} funcValue - Function called with (item, index) to produce each value.
 * @param {Array} list - The source list.
 * @returns {object} An object keyed by funcKey results with funcValue results as values.
 */
export const indexByToValue = curry((funcKey, funcValue, list) => {
  const ret = {}
  for (let i = 0, j = list.length; i < j; ++i) {
    const item = list[i]
    ret[funcKey(item, i)] = funcValue(item, i)
  }
  return ret
})
