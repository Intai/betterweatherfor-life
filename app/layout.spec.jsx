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

describe('RootLayout', () => {
  it('should render html with lang attribute', () => {
    const result = RootLayout({ children: <div>Test</div> })
    expect(result.type).toBe('html')
    expect(result.props.lang).toBe('en')
  })

  it('should render body with font classes', () => {
    const result = RootLayout({ children: <div>Test</div> })
    const body = result.props.children
    expect(body.type).toBe('body')
    expect(body.props.className).toContain('--font-geist-sans')
    expect(body.props.className).toContain('--font-geist-mono')
    expect(body.props.className).toContain('antialiased')
  })

  it('should render children inside body wrapped in I18nProvider', () => {
    const children = <div>Test Content</div>
    const result = RootLayout({ children })
    const body = result.props.children
    const i18nProvider = body.props.children
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
