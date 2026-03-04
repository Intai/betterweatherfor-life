import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validationError } from './api.server'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

describe('validationError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    NextResponse.json.mockImplementation((data, options) => ({ data, status: options?.status ?? 200 }))
  })

  it('should return a 400 response with flattened errors when validation fails', () => {
    const schema = z.object({ name: z.string() })
    const result = schema.safeParse({ name: 123 })

    const response = validationError(result)

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: expect.objectContaining({ formErrors: expect.any(Array), fieldErrors: expect.any(Object) }) },
      { status: 400 },
    )
    expect(response).toEqual({ data: expect.any(Object), status: 400 })
  })

  it('should return null when validation succeeds', () => {
    const schema = z.object({ name: z.string() })
    const result = schema.safeParse({ name: 'test' })

    const response = validationError(result)

    expect(NextResponse.json).not.toHaveBeenCalled()
    expect(response).toBeNull()
  })
})
