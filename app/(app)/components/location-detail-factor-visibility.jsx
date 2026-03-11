'use client'

import { useTranslation } from 'react-i18next'
import { VisibilityIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

export default function LocationDetailFactorVisibility({ visibility }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<VisibilityIcon className="w-5 h-5" />}
      color={getConditionColor(visibility.condition)}
      title={t('locationDetail.visibility.estimate')}
      data={[{ label: t('locationDetail.visibility.estimate'), value: visibility.estimate }]}
      summary={visibility.summary}
      condition={visibility.condition}
      data-testid="factor-card-visibility"
    />
  )
}
