import { render, screen } from '@testing-library/react'

import LocationDetailFactorCard from './location-detail-factor-card'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

describe('LocationDetailFactorCard', () => {
  const defaultProps = {
    icon: <svg data-testid="test-icon" />,
    title: 'Wind',
    data: [
      { label: 'Speed', value: '8 km/h' },
      { label: 'Direction', value: 'NE' },
      { label: 'Gusts', value: '12 km/h' },
    ],
    summary: 'Light onshore breeze. Ideal for paddling.',
    condition: 'ideal',
  }

  it('should render icon, title, data grid, and summary', () => {
    render(<LocationDetailFactorCard {...defaultProps} />)

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
    expect(screen.getByText('Wind')).toBeInTheDocument()
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('8 km/h')).toBeInTheDocument()
    expect(screen.getByText('Direction')).toBeInTheDocument()
    expect(screen.getByText('NE')).toBeInTheDocument()
    expect(screen.getByText('Gusts')).toBeInTheDocument()
    expect(screen.getByText('12 km/h')).toBeInTheDocument()
    expect(screen.getByText('Light onshore breeze. Ideal for paddling.')).toBeInTheDocument()
    expect(screen.queryByTestId('condition-badge')).not.toBeInTheDocument()
  })

  it('should not render data grid when data is empty', () => {
    render(<LocationDetailFactorCard {...defaultProps} data={[]} />)

    expect(screen.queryByTestId('data-grid')).not.toBeInTheDocument()
  })

  it('should not render data grid when data is undefined', () => {
    render(<LocationDetailFactorCard {...defaultProps} data={undefined} />)

    expect(screen.queryByTestId('data-grid')).not.toBeInTheDocument()
  })

  it('should not render summary when summary is undefined', () => {
    render(<LocationDetailFactorCard {...defaultProps} summary={undefined} />)

    expect(screen.queryByTestId('factor-summary')).not.toBeInTheDocument()
  })

  it('should apply orange border and show badge for marginal condition', () => {
    render(<LocationDetailFactorCard {...defaultProps} condition="marginal" />)

    const card = screen.getByTestId('factor-card')
    expect(card).toHaveClass('border-2', 'border-condition-marginal')
    const badge = screen.getByTestId('condition-badge')
    expect(badge).toHaveClass('bg-condition-marginal')
    expect(badge).toHaveTextContent('marginal')
  })

  it('should not show badge and not apply colored border for acceptable condition', () => {
    render(<LocationDetailFactorCard {...defaultProps} condition="acceptable" />)

    const card = screen.getByTestId('factor-card')
    expect(card).not.toHaveClass('border-2')
    expect(screen.queryByTestId('condition-badge')).not.toBeInTheDocument()
  })

  it('should apply red border and show badge for unsuitable condition', () => {
    render(<LocationDetailFactorCard {...defaultProps} condition="unsuitable" />)

    const card = screen.getByTestId('factor-card')
    expect(card).toHaveClass('border-2', 'border-condition-unsuitable')
    const badge = screen.getByTestId('condition-badge')
    expect(badge).toHaveClass('bg-condition-unsuitable')
    expect(badge).toHaveTextContent('unsuitable')
  })

  it('should not show badge and not apply colored border for ideal condition', () => {
    render(<LocationDetailFactorCard {...defaultProps} condition="ideal" />)

    const card = screen.getByTestId('factor-card')
    expect(card).not.toHaveClass('border-2')
    expect(screen.queryByTestId('condition-badge')).not.toBeInTheDocument()
  })

  it('should not show badge and not apply colored border for undefined condition', () => {
    render(<LocationDetailFactorCard {...defaultProps} condition={undefined} />)

    const card = screen.getByTestId('factor-card')
    expect(card).not.toHaveClass('border-2')
    expect(screen.queryByTestId('condition-badge')).not.toBeInTheDocument()
  })

  it('should apply color style to icon container when color prop is provided', () => {
    render(
      <LocationDetailFactorCard
        {...defaultProps}
        color="green"
      />,
    )

    const icon = screen.getByTestId('factor-icon')
    expect(icon).toHaveStyle({ color: 'green' })
    expect(icon).not.toHaveClass('bg-secondary')
  })

  it('should use bg-secondary on icon container when no color prop', () => {
    render(<LocationDetailFactorCard {...defaultProps} />)

    const icon = screen.getByTestId('factor-icon')
    expect(icon).toHaveClass('bg-secondary')
  })

  it('should apply condition color to summary text for marginal condition', () => {
    render(
      <LocationDetailFactorCard
        {...defaultProps}
        condition="marginal"
      />,
    )

    const summary = screen.getByTestId('factor-summary')
    expect(summary).not.toHaveClass('bg-secondary')
    const text = summary.querySelector('p')
    expect(text).toHaveStyle({ color: 'var(--condition-marginal)' })
    expect(text).not.toHaveClass('text-muted-foreground')
  })

  it('should use custom data-testid when provided', () => {
    render(<LocationDetailFactorCard {...defaultProps} data-testid="factor-card-wind" />)

    expect(screen.getByTestId('factor-card-wind')).toBeInTheDocument()
    expect(screen.queryByTestId('factor-card')).not.toBeInTheDocument()
  })

  it('should use default summary styling for ideal condition even with color', () => {
    render(
      <LocationDetailFactorCard
        {...defaultProps}
        color="green"
        condition="ideal"
      />,
    )

    const summary = screen.getByTestId('factor-summary')
    expect(summary).toHaveClass('bg-secondary')
    const text = summary.querySelector('p')
    expect(text).toHaveClass('text-muted-foreground')
  })
})
