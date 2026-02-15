import { identity, join, nthArg, prop, unapply } from 'ramda'
import { indexByToValue } from './list'

describe('indexByToValue', () => {
  it('should build an object keyed by funcKey with values from funcValue', () => {
    const list = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
    expect(indexByToValue(prop('id'), prop('name'), list)).toEqual({
      a: 'Alice',
      b: 'Bob',
    })
  })

  it('should pass the index as second argument to funcKey and funcValue', () => {
    const list = ['x', 'y', 'z']
    expect(indexByToValue(nthArg(1), unapply(join('')), list)).toEqual({
      0: 'x0',
      1: 'y1',
      2: 'z2',
    })
  })

  it('should return an empty object for an empty list', () => {
    expect(indexByToValue(identity, identity, [])).toEqual({})
  })

  it('should overwrite earlier entries when funcKey produces duplicate keys', () => {
    const list = [{ key: 'dup', value: 1 }, { key: 'dup', value: 2 }]
    expect(indexByToValue(prop('key'), prop('value'), list)).toEqual({ dup: 2 })
  })

  it('should support currying', () => {
    const byId = indexByToValue(prop('id'))
    const byIdToName = byId(prop('name'))
    expect(byIdToName([{ id: 'a', name: 'Alice' }])).toEqual({ a: 'Alice' })
  })
})
