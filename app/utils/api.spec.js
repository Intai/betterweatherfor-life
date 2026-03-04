import { fetchJson, postJson } from './api'
import { ApiError } from './errors'

describe('fetchJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    delete global.fetch
  })

  it('should return parsed JSON on success', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: 42 }),
    })

    const result = await fetchJson('/api/test')

    expect(global.fetch).toHaveBeenCalledWith('/api/test', undefined)
    expect(result).toEqual({ data: 42 })
  })

  it('should pass options through to fetch', async () => {
    const options = { headers: { Authorization: 'Bearer token' } }
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    })

    await fetchJson('/api/test', options)

    expect(global.fetch).toHaveBeenCalledWith('/api/test', options)
  })

  it('should throw ApiError with status and body on non-ok response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ error: 'Validation failed' }),
    })

    await expect(fetchJson('/api/test')).rejects.toThrow(ApiError)
    await expect(fetchJson('/api/test')).rejects.toMatchObject({
      status: 422,
      body: { error: 'Validation failed' },
    })
  })

  it('should set body to null when error response has no JSON', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error('not json')),
    })

    await expect(fetchJson('/api/test')).rejects.toMatchObject({
      status: 500,
      body: null,
    })
  })
})

describe('postJson', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    delete global.fetch
  })

  it('should send POST with JSON headers and stringified body', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ id: 1 }),
    })

    const result = await postJson('/api/items', { name: 'test' })

    expect(global.fetch).toHaveBeenCalledWith('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    })
    expect(result).toEqual({ id: 1 })
  })

  it('should throw ApiError on non-ok response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({ error: 'Bad request' }),
    })

    await expect(postJson('/api/items', {})).rejects.toThrow(ApiError)
  })
})
