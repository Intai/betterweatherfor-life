jest.mock('postgres', () => {
  const mockClient = { end: jest.fn() }
  return jest.fn(() => mockClient)
})

jest.mock('drizzle-orm/postgres-js', () => ({
  drizzle: jest.fn(() => ({ query: jest.fn() })),
}))

const config = require('config')
const postgres = require('postgres')
const { drizzle } = require('drizzle-orm/postgres-js')

describe('postgres', () => {
  it('should create a postgres client from database.url config and export a drizzle instance', () => {
    const db = require('./index').default
    expect(postgres).toHaveBeenCalledWith(config.get('database.url'))
    expect(drizzle).toHaveBeenCalledWith({ client: postgres() })
    expect(db).toEqual({ query: expect.any(Function) })
  })
})
