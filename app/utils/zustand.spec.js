import { selectIsLoaded } from './zustand'

describe('selectIsLoaded', () => {
  it('should return true when isLoaded is true', () => {
    expect(selectIsLoaded({ isLoaded: true })).toBe(true)
  })

  it('should return false when isLoaded is false', () => {
    expect(selectIsLoaded({ isLoaded: false })).toBe(false)
  })

  it('should return undefined when isLoaded is not set', () => {
    expect(selectIsLoaded({})).toBeUndefined()
  })
})
