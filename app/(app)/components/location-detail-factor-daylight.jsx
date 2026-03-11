'use client'

import { useTranslation } from 'react-i18next'
import { DaylightIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getConditionColor } from '@/app/(app)/utils/condition-colors'

function getFactorData({ t, daylight }) {
  const data = []
  if (daylight.sunset) {
    data.push({ label: t('locationDetail.daylight.sunset'), value: daylight.sunset })
  }
  if (daylight.civilTwilightEnd) {
    data.push({ label: t('locationDetail.daylight.civilTwilightEnd'), value: daylight.civilTwilightEnd })
  }
  return data
}

export default function LocationDetailFactorDaylight({ daylight }) {
  const { t } = useTranslation()

  return (
    <LocationDetailFactorCard
      icon={<DaylightIcon className="w-5 h-5" />}
      color={getConditionColor(daylight.condition)}
      title={t('home.conditions.daylight')}
      data={getFactorData({ t, daylight })}
      summary={daylight.summary}
      condition={daylight.condition}
      data-testid="factor-card-daylight"
    />
  )
}
