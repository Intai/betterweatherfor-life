'use client'

import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { CalendarDays, Home } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'

export default function ForecastDayListEmpty() {
  const { t } = useTranslation()

  return (
    <section className="px-4 md:px-6 pb-6 flex-1" data-testid="forecast-empty">
      <div className="flex flex-col items-center justify-center py-16 md:py-20 px-6">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-4">
          <CalendarDays className="w-10 h-10 text-muted-foreground" data-testid="calendar-icon" />
        </div>
        <h3 className="text-lg font-semibold mb-1 text-center">
          {t('forecast.empty.title')}
        </h3>
        <p className="text-muted-foreground text-sm text-center mb-6">
          {t('forecast.empty.subtitle')}
        </p>
        <Link href="/home">
          <Button size="lg" data-testid="go-home-button">
            <Home className="w-5 h-5" />
            {t('forecast.empty.goHome')}
          </Button>
        </Link>
      </div>
    </section>
  )
}
