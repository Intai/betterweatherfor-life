import { NextResponse } from 'next/server'
import { validationError } from '@/app/utils/api.server'
import { forecastSearchParamsSchema } from '@/app/validations/forecast'
import { getForecastsByLocations } from '@/db/queries/forecasts'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const result = forecastSearchParamsSchema.safeParse(Object.fromEntries(searchParams))
  const error = validationError(result)
  if (error) return error

  const forecastMap = await getForecastsByLocations(result.data.locations)

  return NextResponse.json(forecastMap)
}
