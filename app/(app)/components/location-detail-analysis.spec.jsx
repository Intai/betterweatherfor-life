import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

import LocationDetailAnalysis from './location-detail-analysis'

describe('LocationDetailAnalysis', () => {
  it('should render heading and single paragraph analysis', () => {
    render(
      <LocationDetailAnalysis
        analysis="Great conditions today."
        condition="ideal"
      />,
    )

    const heading = screen.getByText('aiAnalysis')
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveClass('text-lg', 'font-semibold')

    const card = screen.getByTestId('analysis-card')
    expect(card).toHaveClass('bg-secondary', 'rounded-2xl', 'p-4')

    const paragraph = screen.getByText('Great conditions today.')
    expect(paragraph.tagName).toBe('P')
    expect(paragraph).toHaveClass('text-sm', 'text-muted-foreground', 'leading-relaxed')
    expect(paragraph).not.toHaveClass('mb-3')
  })

  it('should split analysis into multiple paragraphs with spacing between them', () => {
    render(
      <LocationDetailAnalysis
        analysis={'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'}
        condition="marginal"
      />,
    )

    const card = screen.getByTestId('analysis-card')
    expect(card).not.toHaveClass('bg-secondary')
    expect(card).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-marginal) 10%, transparent)',
    })

    const paragraphs = card.querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toHaveTextContent('First paragraph.')
    expect(paragraphs[0]).toHaveClass('mb-3')
    expect(paragraphs[1]).toHaveTextContent('Second paragraph.')
    expect(paragraphs[1]).toHaveClass('mb-3')
    expect(paragraphs[2]).toHaveTextContent('Third paragraph.')
    expect(paragraphs[2]).not.toHaveClass('mb-3')
  })

  it('should colour the analysis text to match a marginal condition', () => {
    render(
      <LocationDetailAnalysis
        analysis={'First paragraph.\n\nSecond paragraph.'}
        condition="marginal"
      />,
    )

    const paragraphs = screen.getByTestId('analysis-card').querySelectorAll('p')
    paragraphs.forEach(paragraph => {
      expect(paragraph).toHaveStyle({ color: 'var(--condition-marginal)' })
      expect(paragraph).not.toHaveClass('text-muted-foreground')
    })
  })

  it('should colour the analysis text to match an unsuitable condition', () => {
    render(
      <LocationDetailAnalysis
        analysis="Stay ashore today."
        condition="unsuitable"
      />,
    )

    const card = screen.getByTestId('analysis-card')
    expect(card).not.toHaveClass('bg-secondary')
    expect(card).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-unsuitable) 10%, transparent)',
    })

    const paragraph = card.querySelector('p')
    expect(paragraph).toHaveStyle({ color: 'var(--condition-unsuitable)' })
    expect(paragraph).not.toHaveClass('text-muted-foreground')
  })

  it('should use neutral styling for an acceptable condition', () => {
    render(
      <LocationDetailAnalysis
        analysis="Workable conditions today."
        condition="acceptable"
      />,
    )

    const card = screen.getByTestId('analysis-card')
    expect(card).toHaveClass('bg-secondary')
    expect(card.querySelector('p')).toHaveClass('text-muted-foreground')
  })

  it('should split analysis containing literal escaped newlines into paragraphs', () => {
    render(
      <LocationDetailAnalysis
        analysis={'First paragraph.\\n\\nSecond paragraph.\\n\\nThird paragraph.'}
        condition="ideal"
      />,
    )

    const card = screen.getByTestId('analysis-card')
    const paragraphs = card.querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toHaveTextContent('First paragraph.')
    expect(paragraphs[0]).toHaveClass('mb-3')
    expect(paragraphs[1]).toHaveTextContent('Second paragraph.')
    expect(paragraphs[1]).toHaveClass('mb-3')
    expect(paragraphs[2]).toHaveTextContent('Third paragraph.')
    expect(paragraphs[2]).not.toHaveClass('mb-3')
  })
})
