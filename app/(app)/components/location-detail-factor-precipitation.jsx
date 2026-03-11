'use client'

import { useTranslation } from 'react-i18next'
import { PrecipitationIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

function getFactorData({ t, precipitation }) {
  const data = []
  if (precipitation.amount) {
    data.push({ label: t('locationDetail.precipitation.amount'), value: precipitation.amount })
  }
  if (precipitation.chance) {
    data.push({ label: t('locationDetail.precipitation.chance'), value: precipitation.chance })
  }
  return data
}

export default function LocationDetailFactorPrecipitation({ precipitation }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<PrecipitationIcon precipitation={precipitation} className="w-5 h-5" />}
      color={getConditionColor(precipitation.condition)}
      title={t('home.conditions.precipitation')}
      data={getFactorData({ t, precipitation })}
      summary={precipitation.summary}
      condition={precipitation.condition}
      data-testid="factor-card-precipitation"
    />
  )
}
