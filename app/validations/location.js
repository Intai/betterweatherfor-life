import { z } from 'zod'

export const locationSchema = z.object({
  name: z.string().min(1),
  area: z.string().min(1),
  citySlug: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})
