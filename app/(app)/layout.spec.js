import AppLayout from './layout'

describe('AppLayout', () => {
  it('should render children', () => {
    const children = <div>Test Content</div>
    const result = AppLayout({ children })
    expect(result).toEqual(children)
  })
})
