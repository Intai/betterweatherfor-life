import { render, screen } from '@testing-library/react'
import I18nProvider from '@/app/components/i18n-provider'
import LocationDetailConditions from './location-detail-conditions'

// Render inside the app's real, initialized i18n instance (app/i18n.js) so t()
// resolves against the actual en/translation.json strings and interpolation.
const renderWithI18n = ui => render(ui, { wrapper: I18nProvider })

describe('LocationDetailConditions', () => {
  const windData = {
    speed: '8km/h',
    direction: 'NE',
    gust: '12km/h',
    condition: 'ideal',
    summary: 'Light breeze.',
  }
  const tideData = {
    state: 'Rising',
    percentage: 70,
    condition: 'ideal',
    summary: 'Rising tide.',
  }
  const waterData = {
    quality: 'Green',
    lastCheck: '6:00 AM',
    condition: 'ideal',
    summary: 'Clean water.',
  }
  const tempData = {
    air: '22°C',
    feelsLike: '24°C',
    water: '20°C',
    condition: 'ideal',
    summary: 'Comfortable.',
  }
  const precipitationData = {
    current: '0mm',
    forecast: '2mm',
    chance: '10%',
    condition: 'ideal',
    summary: 'Dry conditions.',
  }
  const uvData = {
    index: 4,
    condition: 'ideal',
    summary: 'Moderate UV.',
  }
  const humidityData = {
    percentage: '65%',
    condition: 'ideal',
    summary: 'Comfortable humidity.',
  }
  const visibilityData = {
    estimate: '10km',
    condition: 'ideal',
    summary: 'Clear visibility.',
  }
  const daylightData = {
    sunset: '7:45 PM',
    condition: 'ideal',
  }

  it('should name the selected activity in the conditions heading', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="sup"
        wind={windData}
        tide={null}
        water={null}
        temp={null}
        precipitation={null}
        uv={null}
        humidity={null}
        visibility={null}
        daylight={null}
      />,
    )

    const heading = screen.getByText('Conditions for SUP')
    expect(heading.tagName).toBe('H2')
    expect(heading).toHaveClass('text-lg', 'font-semibold')
  })

  it('should name a different selected activity in the conditions heading', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="kayaking"
        wind={windData}
        tide={null}
        water={null}
        temp={null}
        precipitation={null}
        uv={null}
        humidity={null}
        visibility={null}
        daylight={null}
      />,
    )

    expect(screen.getByText('Conditions for Kayaking')).toBeInTheDocument()
  })

  it('should render factor cards for all non-null factors', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="sup"
        wind={windData}
        tide={tideData}
        water={waterData}
        temp={tempData}
        precipitation={null}
        uv={null}
        humidity={null}
        visibility={null}
        daylight={daylightData}
      />,
    )

    const cards = screen.getAllByTestId(/^factor-card/)
    expect(cards).toHaveLength(5)
  })

  it('should skip null factors and only render non-null ones', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="sup"
        wind={windData}
        tide={null}
        water={null}
        temp={tempData}
        precipitation={null}
        uv={null}
        humidity={null}
        visibility={null}
        daylight={null}
      />,
    )

    const cards = screen.getAllByTestId(/^factor-card/)
    expect(cards).toHaveLength(2)
  })

  it('should render no factor cards when all factors are null', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="sup"
        wind={null}
        tide={null}
        water={null}
        temp={null}
        precipitation={null}
        uv={null}
        humidity={null}
        visibility={null}
        daylight={null}
      />,
    )

    expect(screen.getByText('Conditions for SUP')).toBeInTheDocument()
    expect(screen.queryAllByTestId('factor-card')).toHaveLength(0)
  })

  it('should render all nine factor cards when all factors are provided', () => {
    renderWithI18n(
      <LocationDetailConditions
        activity="sup"
        wind={windData}
        tide={tideData}
        water={waterData}
        temp={tempData}
        precipitation={precipitationData}
        uv={uvData}
        humidity={humidityData}
        visibility={visibilityData}
        daylight={daylightData}
      />,
    )

    const cards = screen.getAllByTestId(/^factor-card/)
    expect(cards).toHaveLength(9)
  })
})
