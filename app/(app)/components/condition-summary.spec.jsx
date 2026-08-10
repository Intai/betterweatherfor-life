import { render, screen } from '@testing-library/react'

import ConditionSummary from './condition-summary'

describe('ConditionSummary', () => {
  it('should use neutral styling for ideal condition', () => {
    render(
      <ConditionSummary condition="ideal" data-testid="summary">
        Great conditions today.
      </ConditionSummary>,
    )

    const box = screen.getByTestId('summary')
    expect(box).toHaveClass('bg-secondary')

    const text = box.querySelector('p')
    expect(text).toHaveTextContent('Great conditions today.')
    expect(text).toHaveClass('text-sm', 'text-muted-foreground', 'leading-relaxed')
  })

  it('should use neutral styling for acceptable condition', () => {
    render(
      <ConditionSummary condition="acceptable" data-testid="summary">
        Workable conditions today.
      </ConditionSummary>,
    )

    const box = screen.getByTestId('summary')
    expect(box).toHaveClass('bg-secondary')
    expect(box.querySelector('p')).toHaveClass('text-muted-foreground')
  })

  it('should tint the box and the text for marginal condition', () => {
    render(
      <ConditionSummary condition="marginal" data-testid="summary">
        Choppy by the afternoon.
      </ConditionSummary>,
    )

    const box = screen.getByTestId('summary')
    expect(box).not.toHaveClass('bg-secondary')
    expect(box).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-marginal) 10%, transparent)',
    })

    const text = box.querySelector('p')
    expect(text).toHaveStyle({ color: 'var(--condition-marginal)' })
    expect(text).not.toHaveClass('text-muted-foreground')
  })

  it('should tint the box and the text for unsuitable condition', () => {
    render(
      <ConditionSummary condition="unsuitable" data-testid="summary">
        Stay ashore today.
      </ConditionSummary>,
    )

    const box = screen.getByTestId('summary')
    expect(box).not.toHaveClass('bg-secondary')
    expect(box).toHaveStyle({
      backgroundColor: 'color-mix(in srgb, var(--condition-unsuitable) 10%, transparent)',
    })

    const text = box.querySelector('p')
    expect(text).toHaveStyle({ color: 'var(--condition-unsuitable)' })
    expect(text).not.toHaveClass('text-muted-foreground')
  })

  it('should render one paragraph per child with spacing between them', () => {
    render(
      <ConditionSummary condition="marginal" data-testid="summary">
        {['First paragraph.', 'Second paragraph.', 'Third paragraph.']}
      </ConditionSummary>,
    )

    const paragraphs = screen.getByTestId('summary').querySelectorAll('p')
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toHaveTextContent('First paragraph.')
    expect(paragraphs[0]).toHaveClass('mb-3')
    expect(paragraphs[1]).toHaveTextContent('Second paragraph.')
    expect(paragraphs[1]).toHaveClass('mb-3')
    expect(paragraphs[2]).toHaveTextContent('Third paragraph.')
    expect(paragraphs[2]).not.toHaveClass('mb-3')
  })

  it('should tint every paragraph when there are multiple', () => {
    render(
      <ConditionSummary condition="marginal" data-testid="summary">
        {['First paragraph.', 'Second paragraph.']}
      </ConditionSummary>,
    )

    const paragraphs = screen.getByTestId('summary').querySelectorAll('p')
    paragraphs.forEach(paragraph => {
      expect(paragraph).toHaveStyle({ color: 'var(--condition-marginal)' })
      expect(paragraph).not.toHaveClass('text-muted-foreground')
    })
  })

  it('should not add spacing to a single paragraph', () => {
    render(
      <ConditionSummary condition="ideal" data-testid="summary">
        Only paragraph.
      </ConditionSummary>,
    )

    expect(screen.getByTestId('summary').querySelector('p')).not.toHaveClass('mb-3')
  })

  it('should apply the given class name to the box', () => {
    render(
      <ConditionSummary condition="ideal" className="rounded-2xl p-4" data-testid="summary">
        Great conditions today.
      </ConditionSummary>,
    )

    expect(screen.getByTestId('summary')).toHaveClass('rounded-2xl', 'p-4')
  })

  it('should use neutral styling for an unknown condition', () => {
    render(
      <ConditionSummary condition={undefined} data-testid="summary">
        No rating yet.
      </ConditionSummary>,
    )

    const box = screen.getByTestId('summary')
    expect(box).toHaveClass('bg-secondary')
    expect(box.querySelector('p')).toHaveClass('text-muted-foreground')
  })
})
