import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Returns a 400 JSON response with flattened Zod errors when validation fails, or null on success.
 * @param {import('zod').SafeParseReturnType} result - Zod safeParse result
 * @returns {NextResponse|null}
 */
export function validationError(result) {
  if (!result.success) {
    return NextResponse.json(
      { error: z.flattenError(result.error) },
      { status: 400 },
    )
  }
  return null
}
