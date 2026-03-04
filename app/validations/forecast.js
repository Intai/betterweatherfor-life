import { z } from 'zod'
import { splitLocationKey } from '@/app/utils/forecast.js'

const zLatLngPairs = z.string().min(1).transform(val =>
  val.split(';').map(splitLocationKey),
).pipe(
  z.array(z.tuple([
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
  ])).min(1),
)

export const forecastSearchParamsSchema = z.object({
  locations: zLatLngPairs,
})
