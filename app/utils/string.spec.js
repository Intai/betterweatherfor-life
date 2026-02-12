import {
  deslugify,
  joinByDot,
  joinBySemicolon,
  joinBySeparators,
  joinBySlash,
  joinBySpace,
  kebabToCamel,
  upperFirst,
} from './string'

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

describe('joinBySeparators', () => {
  it('should join 3+ items with separator and lastSeparator', () => {
    expect(joinBySeparators(', ', ' & ', ['a', 'b', 'c'])).toBe('a, b & c')
    expect(joinBySeparators(', ', ', and ', ['x', 'y', 'z', 'w'])).toBe('x, y, z, and w')
  })

  it('should join 2 items with only lastSeparator', () => {
    expect(joinBySeparators(', ', ' & ', ['a', 'b'])).toBe('a & b')
  })

  it('should return single item as-is', () => {
    expect(joinBySeparators(', ', ' & ', ['a'])).toBe('a')
  })

  it('should return empty string for empty array', () => {
    expect(joinBySeparators(', ', ' & ', [])).toBe('')
  })

  it('should filter out falsy values before joining', () => {
    expect(joinBySeparators(', ', ' & ', ['a', null, 'b', '', 'c'])).toBe('a, b & c')
    expect(joinBySeparators(', ', ' & ', [null, undefined, ''])).toBe('')
  })

  it('should return empty string for null/undefined input', () => {
    expect(joinBySeparators(', ', ' & ', null)).toBe('')
    expect(joinBySeparators(', ', ' & ', undefined)).toBe('')
  })

  it('should support currying', () => {
    const joinWithCommaAnd = joinBySeparators(', ', ' & ')
    expect(joinWithCommaAnd(['a', 'b', 'c'])).toBe('a, b & c')
  })

  it('should join with dots', () => {
    expect(joinByDot(['a', 'b', 'c'])).toBe('a.b.c')
  })

  it('should join with semicolons', () => {
    expect(joinBySemicolon(['a', 'b', 'c'])).toBe('a;b;c')
  })

  it('should join with slashes', () => {
    expect(joinBySlash(['a', 'b', 'c'])).toBe('a/b/c')
  })

  it('should join with spaces', () => {
    expect(joinBySpace(['a', 'b', 'c'])).toBe('a b c')
  })
})
