import { getItem, setItem } from './local-storage'

describe('local-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getItem', () => {
    it('should return the parsed value when the key exists', () => {
      localStorage.setItem('obj', JSON.stringify({ a: 1 }))
      expect(getItem('obj')).toEqual({ a: 1 })
    })

    it('should return the fallback when the key is missing', () => {
      expect(getItem('missing', 'default')).toBe('default')
    })

    it('should return the fallback when the stored value is invalid JSON', () => {
      localStorage.setItem('bad', '{not json')
      expect(getItem('bad', 42)).toBe(42)
    })

    it('should return the fallback when localStorage throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('access denied')
      })
      expect(getItem('key', 'safe')).toBe('safe')
    })
  })

  describe('setItem', () => {
    it('should write the JSON-serialised value to localStorage', () => {
      setItem('key', { b: 2 })
      expect(localStorage.getItem('key')).toBe(JSON.stringify({ b: 2 }))
    })

    it('should not throw when localStorage.setItem fails', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      expect(() => setItem('key', 'value')).not.toThrow()
    })
  })
})
