import { getTableConfig } from 'drizzle-orm/pg-core'
import { forecasts } from './index'

const config = getTableConfig(forecasts)

describe('forecasts table', () => {
  it('should have a foreign key on location_id referencing locations', () => {
    expect(config.foreignKeys.length).toBe(1)
    const fk = config.foreignKeys[0]
    expect(fk.reference().columns.length).toBe(1)
    expect(fk.reference().columns[0].name).toBe('location_id')
    expect(fk.reference().foreignColumns[0].name).toBe('id')
    expect(getTableConfig(fk.reference().foreignTable).name).toBe('locations')
  })
})
