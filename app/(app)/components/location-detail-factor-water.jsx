'use client'

import { useTranslation } from 'react-i18next'
import { WaterIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getWaterColor } from '@/app/(app)/utils/condition-colors'

export default function LocationDetailFactorWater({ water }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<WaterIcon className="w-5 h-5" />}
      color={getWaterColor(water.quality)}
      title={t('home.conditions.water')}
      data={[{ label: t('locationDetail.water.quality'), value: water.quality }]}
      summary={water.summary}
      condition={water.condition}
      data-testid="factor-card-water"
    />
  )
}
