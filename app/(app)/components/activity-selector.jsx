'use client'

import { useTranslation } from 'react-i18next'
import { prop } from 'ramda'
import { ACTIVITIES } from '@/app/(app)/constants'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { Button } from '@/shadcn/components/ui/button'

export default function ActivitySelector() {
  const { t } = useTranslation()
  const selectedActivity = useForecastStore(prop('selectedActivity'))
  const setActivity = useForecastStore(prop('setActivity'))

  return (
    <section className="px-4 py-3 border-b">
      <div className="flex flex-wrap gap-2" data-testid="activity-selector">
        {ACTIVITIES.map(activity => (
          <Button
            key={activity}
            variant={selectedActivity === activity ? 'default' : 'secondary'}
            size="sm"
            className="rounded-full whitespace-nowrap"
            onClick={() => setActivity(activity)}
            data-testid={`activity-${activity}`}
          >
            {t(`home.activities.${activity}`)}
          </Button>
        ))}
      </div>
    </section>
  )
}
