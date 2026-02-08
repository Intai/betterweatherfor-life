import { render, screen } from '@testing-library/react'
import I18nProvider from './i18n-provider'

jest.mock('react-i18next', () => ({
  I18nextProvider: ({ i18n, children }) => (
    <div data-testid="i18next-provider" data-i18n={JSON.stringify(i18n)}>
      {children}
    </div>
  ),
}))

jest.mock('@/app/i18n', () => ({ language: 'en' }))

describe('I18nProvider', () => {
  it('should pass i18n instance to I18nextProvider', () => {
    render(
      <I18nProvider>
        <span>child</span>
      </I18nProvider>,
    )
    const provider = screen.getByTestId('i18next-provider')
    expect(JSON.parse(provider.dataset.i18n)).toEqual({ language: 'en' })
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
