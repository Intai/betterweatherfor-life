import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { DebounceAbortError } from '@/app/utils/errors'
import AddLocationModal from './add-location-modal'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockUseForecastStore = jest.fn()
jest.mock('@/app/(app)/stores/forecast-store', () => ({
  useForecastStore: selector => mockUseForecastStore(selector),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key.split('.').pop() }),
}))

jest.mock('lucide-react', () => ({
  Loader2: props => <svg data-testid="loader-icon" {...props} />,
  Plus: props => <svg data-testid="plus-icon" {...props} />,
  Search: props => <svg data-testid="search-icon" {...props} />,
}))

const dialogRef = { onOpenChange: null }
jest.mock('@/shadcn/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }) => {
    dialogRef.onOpenChange = onOpenChange
    return <div data-testid="dialog-root" data-open={String(open)}>{children}</div>
  },
  // eslint-disable-next-line no-unused-vars
  DialogTrigger: ({ asChild, children, ...props }) => (
    <div data-testid="dialog-trigger" {...props}>{children}</div>
  ),
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogContent: ({ children, ...props }) => (
    <div data-testid="dialog-content" {...props}>{children}</div>
  ),
}))

jest.mock('@/shadcn/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

jest.mock('@/shadcn/components/ui/input-group', () => ({
  InputGroup: ({ children, ...props }) => <div data-testid="input-group" {...props}>{children}</div>,
  InputGroupAddon: ({ children, ...props }) => <div data-testid="input-group-addon" {...props}>{children}</div>,
  InputGroupInput: props => <input {...props} />,
}))

const mockLoadPlacesLibrary = jest.fn()
const mockFindCityComponent = jest.fn()
jest.mock('@/app/utils/google-places', () => ({
  loadPlacesLibrary: (...args) => mockLoadPlacesLibrary(...args),
  findCityComponent: (...args) => mockFindCityComponent(...args),
}))

const mockDebounce = jest.fn()
jest.mock('@/app/utils/function', () => ({
  debounce: (...args) => mockDebounce(...args),
}))

describe('AddLocationModal', () => {
  const makePrediction = (id, main, secondary) => ({
    place_id: id,
    structured_formatting: {
      main_text: main,
      secondary_text: secondary,
    },
  })

  async function openDialog() {
    await act(async () => {
      dialogRef.onOpenChange(true)
    })
  }

  async function closeDialog() {
    await act(async () => {
      dialogRef.onOpenChange(false)
    })
  }

  let mockAddLocation
  let mockDebouncedFn

  beforeEach(() => {
    dialogRef.onOpenChange = null
    mockAddLocation = jest.fn().mockResolvedValue()
    mockDebouncedFn = jest.fn()
    mockDebouncedFn.cancel = jest.fn()

    mockFindCityComponent.mockReset()
    mockFindCityComponent.mockReturnValue({ longText: 'Auckland', types: ['locality', 'political'] })
    mockPush.mockReset()

    mockUseForecastStore.mockReset()
    mockUseForecastStore.mockImplementation(selector => {
      const state = {
        addLocation: mockAddLocation,
        citySlug: null,
      }
      return selector(state)
    })

    mockDebounce.mockReset()
    mockDebounce.mockReturnValue(mockDebouncedFn)

    mockLoadPlacesLibrary.mockReset()
    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: jest.fn(() => ({
        getPlacePredictions: jest.fn(),
      })),
      AutocompleteSessionToken: jest.fn(),
      Place: jest.fn(),
    })
  })

  it('should render the trigger button with plus icon, aria-label, and dialog title', () => {
    render(<AddLocationModal />)

    const button = screen.getByTestId('add-location-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-label', 'addLocation')
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('addLocation')
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('searchPlaceholder')).toBeInTheDocument()
  })

  it('should lazy-load Google Places library and create session token when dialog opens', async () => {
    const mockTokenInstance = { token: 'mock-session-token' }
    const mockSessionToken = jest.fn(() => mockTokenInstance)
    const mockGetPredictions = jest.fn().mockResolvedValue({
      predictions: [makePrediction('p1', 'Test', 'Area')],
    })
    const mockAutocompleteSvc = jest.fn(() => ({
      getPlacePredictions: mockGetPredictions,
    }))

    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: mockAutocompleteSvc,
      AutocompleteSessionToken: mockSessionToken,
      Place: jest.fn(),
    })

    render(<AddLocationModal />)
    expect(mockLoadPlacesLibrary).not.toHaveBeenCalled()

    await openDialog()
    expect(mockLoadPlacesLibrary).toHaveBeenCalledTimes(1)
    expect(mockSessionToken).toHaveBeenCalled()
    expect(mockAutocompleteSvc).toHaveBeenCalled()
    expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 300)

    const debouncedCallback = mockDebounce.mock.calls[0][0]
    const result = await debouncedCallback('test query')
    expect(mockGetPredictions).toHaveBeenCalledWith({
      input: 'test query',
      sessionToken: mockTokenInstance,
    })
    expect(result).toEqual([makePrediction('p1', 'Test', 'Area')])
  })

  it('should not reload Places library if already loaded', async () => {
    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: jest.fn(() => ({ getPlacePredictions: jest.fn() })),
      AutocompleteSessionToken: jest.fn(),
      Place: jest.fn(),
    })

    render(<AddLocationModal />)

    await openDialog()
    expect(mockLoadPlacesLibrary).toHaveBeenCalledTimes(1)
    await closeDialog()
    await openDialog()
    expect(mockLoadPlacesLibrary).toHaveBeenCalledTimes(1)
  })

  it('should debounce search input and display results', async () => {
    const predictions = [
      makePrediction('p1', 'Mission Bay', 'Beach, Auckland Central'),
      makePrediction('p2', 'Takapuna Beach', 'Beach, North Shore'),
    ]
    mockDebouncedFn.mockResolvedValue(predictions)

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'Mission' },
    })
    await waitFor(() => {
      expect(screen.getByText('Mission Bay')).toBeInTheDocument()
    })
    expect(mockDebouncedFn).toHaveBeenCalledWith('Mission')
    expect(screen.getByText('Beach, Auckland Central')).toBeInTheDocument()
    expect(screen.getByText('Takapuna Beach')).toBeInTheDocument()
    expect(screen.getByText('Beach, North Shore')).toBeInTheDocument()
    expect(screen.getAllByTestId('suggestion-item')).toHaveLength(2)
  })

  it('should show no results message when search returns empty', async () => {
    mockDebouncedFn.mockResolvedValue([])

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'zzzzz' },
    })
    await waitFor(() => {
      expect(screen.getByTestId('no-results')).toHaveTextContent('noResults')
    })
  })

  it('should show error message when search fails', async () => {
    mockDebouncedFn.mockRejectedValue(new Error('Network error'))

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'fail' },
    })
    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toHaveTextContent('searchError')
    })
  })

  it('should silently catch DebounceAbortError', async () => {
    mockDebouncedFn.mockRejectedValue(new DebounceAbortError())

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'fast' },
    })
    await waitFor(() => {
      expect(mockDebouncedFn).toHaveBeenCalledWith('fast')
    })
    expect(screen.queryByTestId('search-error')).not.toBeInTheDocument()
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
  })

  it('should clear suggestions and cancel debounce when input is emptied', async () => {
    mockDebouncedFn.mockResolvedValue([
      makePrediction('p1', 'Mission Bay', 'Beach'),
    ])

    render(<AddLocationModal />)
    await openDialog()

    const input = screen.getByTestId('location-search-input')
    fireEvent.change(input, { target: { value: 'Mission' } })
    await waitFor(() => expect(screen.getByText('Mission Bay')).toBeInTheDocument())

    fireEvent.change(input, { target: { value: '' } })
    expect(screen.queryByText('Mission Bay')).not.toBeInTheDocument()
    expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument()
    expect(mockDebouncedFn.cancel).toHaveBeenCalled()
  })

  it('should clear suggestions and cancel debounce when input is only whitespace', async () => {
    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: '   ' },
    })
    expect(screen.queryByTestId('no-results')).not.toBeInTheDocument()
    expect(mockDebouncedFn.cancel).toHaveBeenCalled()
  })

  it('should select a prediction, fetch place details, call addLocation, and close dialog', async () => {
    const predictions = [
      makePrediction('p1', 'Mission Bay', 'Beach, Auckland Central'),
    ]
    mockDebouncedFn.mockResolvedValue(predictions)

    const mockFetchFields = jest.fn().mockResolvedValue({
      place: {
        addressComponents: [
          { longText: 'Mission Bay', types: ['sublocality', 'political'] },
          { longText: 'Auckland', types: ['locality', 'political'] },
        ],
        displayName: 'Mission Bay',
        formattedAddress: 'Beach, Auckland Central',
        location: {
          lat: () => -36.8547,
          lng: () => 174.8317,
        },
      },
    })
    const MockPlace = jest.fn(() => ({ fetchFields: mockFetchFields }))
    const mockSessionToken = jest.fn()

    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: jest.fn(() => ({ getPlacePredictions: jest.fn() })),
      AutocompleteSessionToken: mockSessionToken,
      Place: MockPlace,
    })

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'Mission' },
    })
    await waitFor(() => expect(screen.getByText('Mission Bay')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByTestId('suggestion-item'))
    })
    expect(MockPlace).toHaveBeenCalledWith({ id: 'p1' })
    expect(mockFetchFields).toHaveBeenCalledWith({
      fields: ['addressComponents', 'displayName', 'formattedAddress', 'location'],
    })
    expect(mockFindCityComponent).toHaveBeenCalledWith([
      { longText: 'Mission Bay', types: ['sublocality', 'political'] },
      { longText: 'Auckland', types: ['locality', 'political'] },
    ])
    expect(mockAddLocation).toHaveBeenCalledWith({
      name: 'Mission Bay',
      area: 'Beach, Auckland Central',
      citySlug: 'auckland',
      latitude: -36.8547,
      longitude: 174.8317,
    })
    expect(mockSessionToken).toHaveBeenCalledTimes(2)
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByTestId('dialog-root')).toHaveAttribute('data-open', 'false')
  })

  it('should pass citySlug as null when findCityComponent returns null', async () => {
    mockFindCityComponent.mockReturnValue(null)
    const predictions = [makePrediction('p1', 'Remote Beach', 'Somewhere')]
    mockDebouncedFn.mockResolvedValue(predictions)

    const mockFetchFields = jest.fn().mockResolvedValue({
      place: {
        addressComponents: [
          { longText: 'Remote Beach', types: ['natural_feature'] },
        ],
        displayName: 'Remote Beach',
        formattedAddress: 'Somewhere',
        location: {
          lat: () => -40.123,
          lng: () => 175.456,
        },
      },
    })
    const MockPlace = jest.fn(() => ({ fetchFields: mockFetchFields }))
    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: jest.fn(() => ({ getPlacePredictions: jest.fn() })),
      AutocompleteSessionToken: jest.fn(),
      Place: MockPlace,
    })

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'Remote' },
    })
    await waitFor(() => expect(screen.getByText('Remote Beach')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByTestId('suggestion-item'))
    })
    expect(mockAddLocation).toHaveBeenCalledWith({
      name: 'Remote Beach',
      area: 'Somewhere',
      citySlug: null,
      latitude: -40.123,
      longitude: 175.456,
    })
  })

  it('should cancel debounce when dialog closes', async () => {
    render(<AddLocationModal />)
    await openDialog()
    await closeDialog()

    expect(mockDebouncedFn.cancel).toHaveBeenCalled()
  })

  it('should redirect to /home after adding a location when citySlug is set', async () => {
    mockUseForecastStore.mockImplementation(selector => {
      const state = { addLocation: mockAddLocation, citySlug: 'auckland' }
      return selector(state)
    })

    const predictions = [makePrediction('p1', 'Mission Bay', 'Beach')]
    mockDebouncedFn.mockResolvedValue(predictions)

    const mockFetchFields = jest.fn().mockResolvedValue({
      place: {
        addressComponents: [{ longText: 'Auckland', types: ['locality'] }],
        displayName: 'Mission Bay',
        formattedAddress: 'Beach',
        location: { lat: () => -36.85, lng: () => 174.83 },
      },
    })
    const MockPlace = jest.fn(() => ({ fetchFields: mockFetchFields }))
    mockLoadPlacesLibrary.mockResolvedValue({
      AutocompleteService: jest.fn(() => ({ getPlacePredictions: jest.fn() })),
      AutocompleteSessionToken: jest.fn(),
      Place: MockPlace,
    })

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'Mission' },
    })
    await waitFor(() => expect(screen.getByText('Mission Bay')).toBeInTheDocument())
    await act(async () => {
      fireEvent.click(screen.getByTestId('suggestion-item'))
    })
    expect(mockPush).toHaveBeenCalledWith('/home')
  })

  it('should reset input value and error when dialog reopens', async () => {
    mockDebouncedFn.mockRejectedValueOnce(new Error('fail'))
    mockDebouncedFn.mockResolvedValueOnce([])

    render(<AddLocationModal />)
    await openDialog()

    fireEvent.change(screen.getByTestId('location-search-input'), {
      target: { value: 'fail' },
    })
    await waitFor(() => expect(screen.getByTestId('search-error')).toBeInTheDocument())
    await closeDialog()
    await openDialog()
    expect(screen.getByTestId('location-search-input')).toHaveValue('')
    expect(screen.queryByTestId('search-error')).not.toBeInTheDocument()
  })
})
