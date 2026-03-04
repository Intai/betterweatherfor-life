import { DebounceAbortError } from './errors'

/**
 * Create a debounced version of a function that delays invocation until
 * `delay` milliseconds have elapsed since the last call.
 *
 * Supports both sync and async functions. Async detection is based on
 * whether the return value of `fn` is thenable (has a `.then` method),
 * not on the function type.
 *
 * For async functions each call returns a promise. When a new call
 * supersedes a pending one the previous promise is rejected with
 * a DebounceAbortError. The `.cancel()` method clears the pending
 * timer and rejects any outstanding promise.
 *
 * @param {Function} fn - The function to debounce.
 * @param {number} delay - Debounce delay in milliseconds.
 * @returns {Function} A debounced function with a `.cancel()` method.
 */
export function debounce(fn, delay) {
  let timerId = null
  let pendingReject = null

  function cancel() {
    if (timerId !== null) {
      clearTimeout(timerId)
      timerId = null
    }
    if (pendingReject) {
      pendingReject(new DebounceAbortError())
      pendingReject = null
    }
  }

  function debounced(...args) {
    const context = this
    cancel()
    return new Promise((resolve, reject) => {
      pendingReject = reject
      timerId = setTimeout(() => {
        timerId = null
        pendingReject = null
        try {
          Promise.resolve(fn.apply(context, args)).then(resolve, reject)
        } catch (err) {
          reject(err)
        }
      }, delay)
    })
  }

  debounced.cancel = cancel
  return debounced
}
