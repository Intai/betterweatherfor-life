import { anyTruthy } from './logic'

describe('anyTruthy', () => {
  it('should return the first truthy result and short-circuit', () => {
    const fn1 = jest.fn(() => 'first')
    const fn2 = jest.fn(() => 'second')

    const result = anyTruthy([fn1, fn2], 'a', 'b')

    expect(result).toBe('first')
    expect(fn1).toHaveBeenCalledWith('a', 'b')
    expect(fn2).not.toHaveBeenCalled()
  })

  it('should fall back to the next function when the first returns falsy', () => {
    const fn1 = jest.fn(() => null)
    const fn2 = jest.fn(() => 'second')

    const result = anyTruthy([fn1, fn2], 'x')

    expect(result).toBe('second')
    expect(fn1).toHaveBeenCalledWith('x')
    expect(fn2).toHaveBeenCalledWith('x')
  })

  it('should return the last falsy result when no function returns truthy', () => {
    const fn1 = jest.fn(() => undefined)
    const fn2 = jest.fn(() => 0)

    const result = anyTruthy([fn1, fn2], 'z')

    expect(result).toBe(0)
  })

  it('should work with curried form anyTruthy(funcs)(args)', () => {
    const fn1 = jest.fn(() => null)
    const fn2 = jest.fn(() => 'found')

    const finder = anyTruthy([fn1, fn2])
    const result = finder('arg1', 'arg2')

    expect(result).toBe('found')
    expect(fn1).toHaveBeenCalledWith('arg1', 'arg2')
    expect(fn2).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
