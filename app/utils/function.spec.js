import { DebounceAbortError } from './errors'
import { debounce } from './function'

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('sync functions', () => {
    it('should delay invocation until the timer elapses', () => {
      const fn = jest.fn(() => 42)
      const debounced = debounce(fn, 200)

      debounced().catch(() => {})
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(200)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should reset the timer on subsequent calls', () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 200)

      debounced().catch(() => {})
      jest.advanceTimersByTime(150)
      debounced().catch(() => {})
      jest.advanceTimersByTime(150)
      expect(fn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to the underlying function', async () => {
      const fn = jest.fn((a, b) => a + b)
      const debounced = debounce(fn, 100)

      const promise = debounced(3, 4)
      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBe(7)
      expect(fn).toHaveBeenCalledWith(3, 4)
    })

    it('should resolve with the return value of the sync function', async () => {
      const fn = jest.fn(() => 'hello')
      const debounced = debounce(fn, 100)

      const promise = debounced()
      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBe('hello')
    })

    it('should reject when a sync function throws', async () => {
      const error = new Error('sync failure')
      const fn = jest.fn(() => {
        throw error
      })
      const debounced = debounce(fn, 100)

      const promise = debounced()
      jest.advanceTimersByTime(100)

      await expect(promise).rejects.toBe(error)
    })
  })

  describe('async functions', () => {
    it('should resolve with the async return value after the timer elapses', async () => {
      const fn = jest.fn(() => Promise.resolve('async result'))
      const debounced = debounce(fn, 100)

      const promise = debounced()
      jest.advanceTimersByTime(100)

      await expect(promise).resolves.toBe('async result')
    })

    it('should reject the previous promise with DebounceAbortError when superseded', async () => {
      const fn = jest.fn(() => Promise.resolve('latest'))
      const debounced = debounce(fn, 100)

      const first = debounced().catch(err => {
        throw err
      })
      const second = debounced()
      jest.advanceTimersByTime(100)

      await expect(first).rejects.toBeInstanceOf(DebounceAbortError)
      await expect(second).resolves.toBe('latest')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should reject when the async function rejects', async () => {
      const error = new Error('async failure')
      const fn = jest.fn(() => Promise.reject(error))
      const debounced = debounce(fn, 100)

      const promise = debounced()
      jest.advanceTimersByTime(100)

      await expect(promise).rejects.toBe(error)
    })
  })

  describe('cancel', () => {
    it('should clear the pending timer so the function is never called', () => {
      const fn = jest.fn()
      const debounced = debounce(fn, 200)

      debounced().catch(() => {})
      debounced.cancel()
      jest.advanceTimersByTime(200)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should reject the pending promise with DebounceAbortError', async () => {
      const fn = jest.fn(() => Promise.resolve())
      const debounced = debounce(fn, 200)

      const promise = debounced()
      debounced.cancel()

      await expect(promise).rejects.toBeInstanceOf(DebounceAbortError)
    })

    it('should be safe to call when nothing is pending', () => {
      const debounced = debounce(jest.fn(), 100)
      expect(() => debounced.cancel()).not.toThrow()
    })
  })
})
