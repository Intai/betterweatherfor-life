'use client'

import { useTranslation } from 'react-i18next'
import { UVIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

export default function LocationDetailFactorUV({ uv }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<UVIcon className="w-5 h-5" />}
      color={getConditionColor(uv.condition)}
      title={t('locationDetail.uv.index')}
      data={[{ label: t('locationDetail.uv.index'), value: uv.index }]}
      summary={uv.summary}
      condition={uv.condition}
      data-testid="factor-card-uv"
    />
  )
}
