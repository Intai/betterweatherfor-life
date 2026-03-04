import { ApiError, DebounceAbortError } from './errors'

describe('DebounceAbortError', () => {
  it('should have the correct name, default message, and extend Error', () => {
    const error = new DebounceAbortError()
    expect(error.name).toBe('DebounceAbortError')
    expect(error.message).toBe('Debounced call was superseded')
    expect(error).toBeInstanceOf(Error)
  })

  it('should accept a custom message', () => {
    const error = new DebounceAbortError('custom message')
    expect(error.message).toBe('custom message')
  })
})

describe('ApiError', () => {
  it('should have the correct name, message, and extend Error', () => {
    const error = new ApiError(404, { error: 'Not found' })
    expect(error.name).toBe('ApiError')
    expect(error.message).toBe('API request failed with status 404')
    expect(error).toBeInstanceOf(Error)
  })

  it('should store status and body', () => {
    const body = { error: 'Server error' }
    const error = new ApiError(500, body)
    expect(error.status).toBe(500)
    expect(error.body).toBe(body)
  })
})
