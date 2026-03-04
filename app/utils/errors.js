export class DebounceAbortError extends Error {
  constructor(message = 'Debounced call was superseded') {
    super(message)
    this.name = 'DebounceAbortError'
  }
}

export class ApiError extends Error {
  constructor(status, body) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}
