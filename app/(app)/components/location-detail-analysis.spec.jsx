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
    expect(card).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-ideal) 10%, var(--background))',
    })

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
    expect(card).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-marginal) 10%, var(--background))',
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
