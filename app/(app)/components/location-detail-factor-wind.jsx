'use client'

import { useTranslation } from 'react-i18next'
import { getWindRotation, WindIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

function getFactorData({ t, wind }) {
  const data = [
    { label: t('locationDetail.wind.speed'), value: wind.speed },
    { label: t('locationDetail.wind.direction'), value: wind.direction },
  ]
  if (wind.gust) {
    data.push({ label: t('locationDetail.wind.gust'), value: wind.gust })
  }
  return data
}

export default function LocationDetailFactorWind({ wind }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<WindIcon rotation={getWindRotation(wind.direction)} className="w-5 h-5" />}
      color={getConditionColor(wind.condition)}
      title={t('home.conditions.wind')}
      data={getFactorData({ t, wind })}
      summary={wind.summary}
      condition={wind.condition}
      data-testid="factor-card-wind"
    />
  )
}
