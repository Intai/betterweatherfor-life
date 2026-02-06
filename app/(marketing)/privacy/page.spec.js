import PrivacyPage, { metadata } from './page'

describe('PrivacyPage', () => {
  it('should render null', () => {
    expect(PrivacyPage()).toBe(null)
  })
})

describe('metadata', () => {
  it('should have correct title and description', () => {
    expect(metadata.title).toBe('Privacy Policy')
    expect(metadata.description).toBe('How Better Weather For Life collects, uses, and protects your personal information.')
  })
})
