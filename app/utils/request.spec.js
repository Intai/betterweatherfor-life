import { getAcceptLanguage } from './request'

const mockGet = jest.fn()
jest.mock('next/headers', () => ({
  headers: () => Promise.resolve({ get: mockGet }),
}))

describe('getAcceptLanguage', () => {
  beforeEach(() => {
    mockGet.mockReset()
  })

  it('should parse locale and lang from Accept-Language header', async () => {
    mockGet.mockReturnValue('en-NZ,en;q=0.9')
    const result = await getAcceptLanguage()
    expect(result).toEqual({ locale: 'en-NZ', lang: 'en' })
  })

  it('should parse non-English locale', async () => {
    mockGet.mockReturnValue('fr-FR,fr;q=0.9')
    const result = await getAcceptLanguage()
    expect(result).toEqual({ locale: 'fr-FR', lang: 'fr' })
  })

  it('should fall back to en when Accept-Language is absent', async () => {
    mockGet.mockReturnValue('')
    const result = await getAcceptLanguage()
    expect(result).toEqual({ locale: 'en', lang: 'en' })
  })

  it('should fall back to en when Accept-Language is null', async () => {
    mockGet.mockReturnValue(null)
    const result = await getAcceptLanguage()
    expect(result).toEqual({ locale: 'en', lang: 'en' })
  })
})
