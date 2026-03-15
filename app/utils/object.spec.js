import { filterObj } from './object'

describe('filterObj', () => {
  it('should keep entries matching the predicate and exclude the rest', () => {
    const obj = { a: 1, b: 2, c: 3 }
    const result = filterObj(value => value > 1, obj)
    expect(result).toEqual({ b: 2, c: 3 })
  })

  it('should pass (value, key, obj) to the predicate', () => {
    const obj = { x: 10 }
    const predicate = jest.fn(() => true)
    filterObj(predicate, obj)
    expect(predicate).toHaveBeenCalledWith(10, 'x', obj)
  })

  it('should return an empty object when nothing matches', () => {
    const result = filterObj(() => false, { a: 1, b: 2 })
    expect(result).toEqual({})
  })

  it('should return an empty object for empty input', () => {
    const result = filterObj(() => true, {})
    expect(result).toEqual({})
  })

  it('should support currying via partial application of the predicate', () => {
    const keepEven = filterObj(v => v % 2 === 0)
    expect(keepEven({ a: 1, b: 2, c: 3, d: 4 })).toEqual({ b: 2, d: 4 })
  })
})
