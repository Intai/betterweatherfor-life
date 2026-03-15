import RootLayout, { metadata } from './layout'

jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}))

jest.mock('@/app/components/i18n-provider', () => {
  return function MockI18nProvider({ children }) {
    return children
  }
})

jest.mock('@/app/components/locale-provider', () => {
  return function MockLocaleProvider({ locale, children }) {
    return <div data-locale={locale}>{children}</div>
  }
})

jest.mock('@/app/utils/request', () => ({
  getAcceptLanguage: jest.fn(() => Promise.resolve({ locale: 'en-NZ', lang: 'en' })),
}))

const { getAcceptLanguage } = require('@/app/utils/request')

describe('RootLayout', () => {
  beforeEach(() => {
    getAcceptLanguage.mockReset()
    getAcceptLanguage.mockResolvedValue({ locale: 'en-NZ', lang: 'en' })
  })

  it('should render html with lang from getAcceptLanguage', async () => {
    const result = await RootLayout({ children: <div>Test</div> })
    expect(result.type).toBe('html')
    expect(result.props.lang).toBe('en')
  })

  it('should render body with font classes', async () => {
    const result = await RootLayout({ children: <div>Test</div> })
    const body = result.props.children
    expect(body.type).toBe('body')
    expect(body.props.className).toContain('--font-geist-sans')
    expect(body.props.className).toContain('--font-geist-mono')
    expect(body.props.className).toContain('antialiased')
  })

  it('should pass parsed locale to LocaleProvider', async () => {
    const result = await RootLayout({ children: <div>Test</div> })
    const body = result.props.children
    const localeProvider = body.props.children
    expect(localeProvider.type.name).toBe('MockLocaleProvider')
    expect(localeProvider.props.locale).toBe('en-NZ')
  })

  it('should render children inside I18nProvider', async () => {
    const children = <div>Test Content</div>
    const result = await RootLayout({ children })
    const body = result.props.children
    const localeProvider = body.props.children
    const i18nProvider = localeProvider.props.children
    expect(i18nProvider.type.name).toBe('MockI18nProvider')
    expect(i18nProvider.props.children).toEqual(children)
  })
})

describe('metadata', () => {
  it('should have correct title and description', () => {
    expect(metadata.title.default).toBe('Better Weather For Life')
    expect(metadata.title.template).toBe('%s | Better Weather For Life')
    expect(metadata.description).toBe('Find the best places for outdoor activities like SUP, kayaking, snorkeling, and cycling based on weather, tide, and sea conditions.')
    expect(metadata.metadataBase).toBeInstanceOf(URL)
  })

  it('should have author information', () => {
    expect(metadata.authors[0].name).toBe('Intai')
    expect(metadata.creator).toBe('Intai')
  })

  it('should have openGraph configuration', () => {
    expect(metadata.openGraph.type).toBe('website')
    expect(metadata.openGraph.locale).toBe('en_NZ')
    expect(metadata.openGraph.siteName).toBe('Better Weather For Life')
  })

  it('should have twitter card configuration', () => {
    expect(metadata.twitter.card).toBe('summary_large_image')
  })
})
