'use client'

import { useTranslation } from 'react-i18next'

export default function LocationDetailAnalysis({ analysis, condition }) {
  const { t } = useTranslation()
  const paragraphs = analysis.split('\n\n')

  return (
    <section className="px-4 pb-4" data-testid="location-detail-analysis">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {t('locationDetail.aiAnalysis')}
      </h2>
      <div
        className="rounded-2xl p-4"
        style={{ backgroundColor: `color-mix(in srgb, var(--condition-${condition}) 10%, var(--background))` }}
        data-testid="analysis-card"
      >
        {paragraphs.map((paragraph, index) => (
          <p
            key={index}
            className={`text-sm text-muted-foreground leading-relaxed ${
              index < paragraphs.length - 1 ? 'mb-3' : ''
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  )
}
