import { NextResponse } from 'next/server'
import { find } from 'geo-tz'
import { validationError } from '@/app/utils/api.server'
import { locationSchema } from '@/app/validations/location'
import { upsertLocation } from '@/db/queries/locations'

export async function POST(request) {
  const body = await request.json()
  const result = locationSchema.safeParse(body)
  const error = validationError(result)
  if (error) return error

  const { name, area, citySlug, latitude, longitude } = result.data
  const [timeZone] = find(latitude, longitude)

  const row = await upsertLocation({
    name,
    area,
    citySlug,
    latitude,
    longitude,
    timeZone,
    source: 'geocoded',
  })

  return NextResponse.json({
    name: row.name,
    area: row.area,
    latitude: row.latitude,
    longitude: row.longitude,
    timeZone: row.timeZone,
  })
}
