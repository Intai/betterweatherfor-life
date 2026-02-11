import { deslugify, kebabToCamel, upperFirst } from './string'

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

describe('kebabToCamel', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(kebabToCamel('hello-world')).toBe('helloWorld')
  })

  it('should handle multiple hyphens', () => {
    expect(kebabToCamel('my-long-name')).toBe('myLongName')
  })

  it('should return single word unchanged', () => {
    expect(kebabToCamel('hello')).toBe('hello')
  })

  it('should handle trailing hyphen', () => {
    expect(kebabToCamel('hello-')).toBe('hello')
  })

  it('should handle consecutive hyphens', () => {
    expect(kebabToCamel('hello--world')).toBe('helloWorld')
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
