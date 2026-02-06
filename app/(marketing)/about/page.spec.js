import AboutPage, { metadata } from './page'

describe('AboutPage', () => {
  it('should render null', () => {
    expect(AboutPage()).toBe(null)
  })
})

describe('metadata', () => {
  it('should have correct title and description', () => {
    expect(metadata.title).toBe('About Us')
    expect(metadata.description).toBe('Learn how Better Weather For Life helps outdoor enthusiasts find the perfect conditions for their activities.')
  })
})
