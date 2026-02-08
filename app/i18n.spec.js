const mockI18n = {
  use: jest.fn().mockReturnThis(),
  init: jest.fn(),
}

jest.mock('i18next', () => mockI18n)
jest.mock('react-i18next', () => ({
  initReactI18next: 'initReactI18next-stub',
}))
jest.mock('@/app/locales/en/translation.json', () => ({
  greeting: 'Hello',
}))

const { initReactI18next } = require('react-i18next')
const en = require('@/app/locales/en/translation.json')

describe('i18n', () => {
  let i18n

  beforeAll(() => {
    i18n = require('./i18n').default
  })

  it('should call init with correct configuration', () => {
    expect(mockI18n.use).toHaveBeenCalledWith(initReactI18next)
    expect(mockI18n.init).toHaveBeenCalledWith({
      lng: 'en',
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
      },
      interpolation: {
        escapeValue: false,
      },
    })
    expect(i18n).toBe(mockI18n)
  })
})
