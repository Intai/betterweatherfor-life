'use client'

import { useTranslation } from 'react-i18next'
import { HumidityIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

export default function LocationDetailFactorHumidity({ humidity }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<HumidityIcon className="w-5 h-5" />}
      color={getConditionColor(humidity.condition)}
      title={t('locationDetail.humidity.percentage')}
      data={[{ label: t('locationDetail.humidity.percentage'), value: humidity.percentage }]}
      summary={humidity.summary}
      condition={humidity.condition}
      data-testid="factor-card-humidity"
    />
  )
}
