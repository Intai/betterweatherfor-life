import { deslugify, upperFirst } from './string'

describe('upperFirst', () => {
  it('should capitalize the first character', () => {
    expect(upperFirst('hello')).toBe('Hello')
  })

  it('should return empty string unchanged', () => {
    expect(upperFirst('')).toBe('')
  })

  it('should return null/undefined unchanged', () => {
    expect(upperFirst(null)).toBe(null)
    expect(upperFirst(undefined)).toBe(undefined)
  })

  it('should handle single character', () => {
    expect(upperFirst('a')).toBe('A')
  })

  it('should preserve already capitalized strings', () => {
    expect(upperFirst('Hello')).toBe('Hello')
  })
})

describe('deslugify', () => {
  it('should convert slug to title case with spaces', () => {
    expect(deslugify('new-plymouth')).toBe('New Plymouth')
  })

  it('should handle single word slug', () => {
    expect(deslugify('auckland')).toBe('Auckland')
  })

  it('should handle multiple hyphens', () => {
    expect(deslugify('mount-maunganui-beach')).toBe('Mount Maunganui Beach')
  })

  it('should return empty string unchanged', () => {
    expect(deslugify('')).toBe('')
  })

  it('should return null/undefined unchanged', () => {
    expect(deslugify(null)).toBe(null)
    expect(deslugify(undefined)).toBe(undefined)
  })
})
