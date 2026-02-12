'use client'

import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
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
import LocationCardScore from './location-card-score'
import LocationCardTemp from './location-card-temp'
import LocationCardTide from './location-card-tide'
import LocationCardWater from './location-card-water'
import LocationCardWind from './location-card-wind'

function LocationCard({
  forecastKey,
  name,
  area,
  score,
  condition,
  wind,
  tide,
  water,
  temp,
  summary,
}) {
  const { t } = useTranslation()
  const removeForecast = useForecastStore(prop('removeForecast'))

  return (
    <Card
      className="gap-3 overflow-hidden rounded-2xl py-4 shadow-md"
      data-testid="location-card"
    >
      <CardHeader className="px-4">
        <CardTitle>{name}</CardTitle>
        <CardDescription>{area}</CardDescription>
        <CardAction className="-mt-2 -mr-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground/70"
            aria-label={t('home.conditions.removeLocation')}
            onClick={() => removeForecast(forecastKey)}
            data-testid="remove-location-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        {/* Overall Score */}
        <LocationCardScore score={score} condition={condition} />

        {/* Conditions Grid */}
        <div className="grid grid-cols-2 gap-3" data-testid="conditions-grid">
          <LocationCardWind wind={wind} />
          <LocationCardTide tide={tide} />
          <LocationCardWater water={water} />
          <LocationCardTemp temp={temp} />
        </div>

        {/* AI Summary */}
        <div className="bg-secondary rounded-lg px-3 py-2">
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(LocationCard)
