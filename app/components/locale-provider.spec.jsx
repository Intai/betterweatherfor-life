import { render, screen } from '@testing-library/react'

import LocaleProvider, { useLocale } from './locale-provider'

function LocaleDisplay() {
  const locale = useLocale()
  return <span data-testid="locale">{locale}</span>
}

describe('LocaleProvider', () => {
  it('should provide locale from prop to children', () => {
    render(
      <LocaleProvider locale="en-NZ">
        <LocaleDisplay />
      </LocaleProvider>,
    )
    expect(screen.getByTestId('locale')).toHaveTextContent('en-NZ')
  })

  it('should fall back to "en" when navigator is not available', () => {
    const original = globalThis.navigator
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true })

    render(<LocaleDisplay />)
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    Object.defineProperty(globalThis, 'navigator', { value: original, configurable: true })
  })

  it('should fall back to navigator.language when no provider wraps the component', () => {
    const original = navigator.language
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true })

    render(<LocaleDisplay />)
    expect(screen.getByTestId('locale')).toHaveTextContent('fr-FR')
    Object.defineProperty(navigator, 'language', { value: original, configurable: true })
  })
})
