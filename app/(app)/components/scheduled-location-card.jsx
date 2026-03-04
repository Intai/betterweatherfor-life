'use client'

import { useTranslation } from 'react-i18next'
import { CloudUpload, X } from 'lucide-react'
import { prop } from 'ramda'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'

export default function ScheduledLocationCard({ locationKey, name, area }) {
  const { t } = useTranslation()
  const removeLocation = useForecastStore(prop('removeLocation'))

  return (
    <Card
      className="gap-3 overflow-hidden rounded-2xl border-dashed py-4 shadow-md"
      data-testid="scheduled-location-card"
    >
      <CardHeader className="px-4">
        <CardTitle>{name}</CardTitle>
        <CardDescription>{area}</CardDescription>
        <CardAction className="-mt-2 -mr-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/70"
            aria-label={t('home.locations.removeLocation')}
            onClick={() => removeLocation(locationKey)}
            data-testid="remove-location-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-center text-center px-4 pb-2">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
          <CloudUpload
            className="w-6 h-6 text-primary-light"
            data-testid="cloud-icon"
          />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">
          {t('home.locations.scheduled.title')}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-60">
          {t('home.locations.scheduled.description')}
        </p>
      </CardContent>
    </Card>
  )
}
