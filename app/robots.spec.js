import robots from './robots'

describe('robots', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('should return correct rules structure', () => {
    const result = robots()
    expect(result.rules.userAgent).toBe('*')
    expect(result.rules.allow).toBe('/')
    expect(result.rules.disallow).toEqual(['/home', '/forecast', '/location/'])
  })

  it('should use NEXT_PUBLIC_BASE_URL when set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
    const result = robots()
    expect(result.sitemap).toBe('https://example.com/sitemap.xml')
  })

  it('should fall back to default URL when env variable not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL
    const result = robots()
    expect(result.sitemap).toBe('https://betterweatherfor.life/sitemap.xml')
  })
})
