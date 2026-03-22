'use client'

import { useTranslation } from 'react-i18next'
import { WaterIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getWaterColor } from '@/app/(app)/utils/condition-colors'
import { upperFirst } from '@/app/utils/string'

export default function LocationDetailFactorWater({ water }) {
  const { t } = useTranslation()
  const quality = upperFirst(water.quality)

  return (
    <LocationDetailFactorCard
      icon={<WaterIcon className="w-5 h-5" />}
      color={getWaterColor(quality)}
      title={t('home.conditions.water')}
      data={[{ label: t('locationDetail.water.quality'), value: quality }]}
      summary={water.summary}
      condition={water.condition}
      data-testid="factor-card-water"
    />
  )
}
