'use client'

import { useTranslation } from 'react-i18next'
import ConditionSummary from '@/app/(app)/components/condition-summary'

export default function LocationDetailAnalysis({ analysis, condition }) {
  const { t } = useTranslation()
  const paragraphs = analysis.split(/\\n\\n|\n\n/)

  return (
    <section className="px-4 pb-4" data-testid="location-detail-analysis">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {t('locationDetail.aiAnalysis')}
      </h2>
      <ConditionSummary
        condition={condition}
        className="rounded-2xl p-4"
        data-testid="analysis-card"
      >
        {paragraphs}
      </ConditionSummary>
    </section>
  )
}
