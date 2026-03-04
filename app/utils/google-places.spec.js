const mockSetOptions = jest.fn()
const mockImportLibrary = jest.fn()

jest.mock('@googlemaps/js-api-loader', () => ({
  setOptions: mockSetOptions,
  importLibrary: mockImportLibrary,
}))

describe('findCityComponent', () => {
  let findCityComponent

  beforeEach(async () => {
    jest.resetModules()
    const mod = await import('./google-places')
    findCityComponent = mod.findCityComponent
  })

  it('should return the locality component when present', () => {
    const components = [
      { longText: 'Mission Bay', types: ['sublocality', 'political'] },
      { longText: 'Auckland', types: ['locality', 'political'] },
      { longText: 'Auckland', types: ['administrative_area_level_1'] },
    ]
    expect(findCityComponent(components)).toEqual({
      longText: 'Auckland',
      types: ['locality', 'political'],
    })
  })

  it('should fall back to administrative_area_level_1 when no locality exists', () => {
    const components = [
      { longText: 'Waiheke Island', types: ['sublocality'] },
      { longText: 'Auckland', types: ['administrative_area_level_1'] },
    ]
    expect(findCityComponent(components)).toEqual({
      longText: 'Auckland',
      types: ['administrative_area_level_1'],
    })
  })

  it('should fall back to administrative_area_level_2 when no locality or admin level 1 exists', () => {
    const components = [
      { longText: 'Waiheke Island', types: ['sublocality'] },
      { longText: 'Auckland', types: ['administrative_area_level_2'] },
    ]
    expect(findCityComponent(components)).toEqual({
      longText: 'Auckland',
      types: ['administrative_area_level_2'],
    })
  })

  it('should fall back to country when no other matching types exist', () => {
    const components = [
      { longText: 'Waiheke Island', types: ['sublocality'] },
      { longText: 'New Zealand', types: ['country'] },
    ]
    expect(findCityComponent(components)).toEqual({
      longText: 'New Zealand',
      types: ['country'],
    })
  })

  it('should return undefined when no matching component exists', () => {
    const components = [{ longText: '1234', types: ['postal_code'] }]
    expect(findCityComponent(components)).toBeUndefined()
  })
})

describe('loadPlacesLibrary', () => {
  let loadPlacesLibrary
  let originalApiKey

  beforeEach(async () => {
    originalApiKey = process.env.GOOGLE_MAPS_API_KEY
    process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'

    jest.resetModules()
    mockSetOptions.mockReset()
    mockImportLibrary.mockReset()

    const mod = await import('./google-places')
    loadPlacesLibrary = mod.loadPlacesLibrary
  })

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.GOOGLE_MAPS_API_KEY
    } else {
      process.env.GOOGLE_MAPS_API_KEY = originalApiKey
    }
  })

  it('should load the places library and return AutocompleteService, AutocompleteSessionToken, and Place', async () => {
    const mockAutocompleteSvc = jest.fn()
    const mockSessionToken = jest.fn()
    const mockPlace = jest.fn()
    mockImportLibrary.mockResolvedValue({
      AutocompleteService: mockAutocompleteSvc,
      AutocompleteSessionToken: mockSessionToken,
      Place: mockPlace,
    })

    const result = await loadPlacesLibrary()

    expect(mockSetOptions).toHaveBeenCalledWith({
      key: 'test-api-key',
      v: 'weekly',
    })
    expect(mockImportLibrary).toHaveBeenCalledWith('places')
    expect(result).toEqual({
      AutocompleteService: mockAutocompleteSvc,
      AutocompleteSessionToken: mockSessionToken,
      Place: mockPlace,
    })
  })
})
