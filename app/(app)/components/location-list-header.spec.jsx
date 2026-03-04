import { render, screen } from '@testing-library/react'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('@/app/(app)/components/add-location-modal', () => {
  return function MockAddLocationModal() {
    return <button data-testid="add-location-button" />
  }
})

import LocationListHeader from './location-list-header'

describe('LocationListHeader', () => {
  it('should render the locations heading with translated text', () => {
    render(<LocationListHeader />)

    const heading = screen.getByTestId('locations-heading')
    expect(heading).toHaveTextContent('title')
    expect(heading.tagName).toBe('H2')
    const button = screen.getByTestId('add-location-button')
    expect(button).toBeInTheDocument()
  })
})
