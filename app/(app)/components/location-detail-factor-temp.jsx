'use client'

import { useTranslation } from 'react-i18next'
import { parseTempValue, TempIcon } from '@/app/(app)/components/condition-icons'
import LocationDetailFactorCard from '@/app/(app)/components/location-detail-factor-card'
import { getTempColor } from '@/app/(app)/utils/condition-colors'

function getFactorData({ t, temp }) {
  const data = [
    { label: t('locationDetail.temp.air'), value: temp.air },
  ]
  if (temp.feelsLike) {
    data.push({ label: t('locationDetail.temp.feelsLike'), value: temp.feelsLike })
  }
  if (temp.water) {
    data.push({ label: t('locationDetail.temp.water'), value: temp.water })
  }
  return data
}

export default function LocationDetailFactorTemp({ temp }) {
  const { t } = useTranslation()
  const tempValue = parseTempValue(temp.air) ?? 20
  const color = getTempColor(tempValue)

  return (
    <LocationDetailFactorCard
      icon={<TempIcon tempValue={tempValue} className="w-6 h-6" />}
      color={color}
      title={t('home.conditions.temp')}
      data={getFactorData({ t, temp })}
      summary={temp.summary}
      condition={temp.condition}
      data-testid="factor-card-temp"
    />
  )
}
