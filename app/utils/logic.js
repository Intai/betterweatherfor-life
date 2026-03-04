import { uncurryN } from 'ramda'

/**
 * Apply a list of functions to the same arguments and return the first truthy result.
 * Short-circuits as soon as a truthy value is found.
 * @param {Function[]} funcs - Functions to try in order.
 * @param {...*} args - Arguments passed to each function.
 * @returns {*} The first truthy return value, or the last result if none are truthy.
 */
export const anyTruthy = uncurryN(2, funcs => (...args) => {
  let ret
  for (let i = 0, j = funcs.length; i < j; ++i) {
    const func = funcs[i]
    ret = func(...args)
    if (ret) {
      return ret
    }
  }
  return ret
})
