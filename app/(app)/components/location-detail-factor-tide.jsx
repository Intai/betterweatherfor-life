'use client'

import { useTranslation } from 'react-i18next'
import { TideIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'
import { upperFirst } from '@/app/utils/string'

function getFactorData({ t, tide }) {
  const data = [
    { label: t('locationDetail.tide.state'), value: `${upperFirst(tide.state)} ${tide.percentage}%` },
  ]
  if (tide.nextHigh) {
    data.push({ label: t('locationDetail.tide.nextHigh'), value: tide.nextHigh })
  } else if (tide.nextLow) {
    data.push({ label: t('locationDetail.tide.nextLow'), value: tide.nextLow })
  }
  if (tide.swell) {
    data.push({ label: t('locationDetail.tide.swell'), value: tide.swell })
  }
  return data
}

export default function LocationDetailFactorTide({ tide }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<TideIcon state={tide.state} percentage={tide.percentage} className="w-6 h-6" />}
      color={getConditionColor(tide.condition)}
      title={t('home.conditions.tide')}
      data={getFactorData({ t, tide })}
      summary={tide.summary}
      condition={tide.condition}
      data-testid="factor-card-tide"
    />
  )
}
