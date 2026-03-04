'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Search } from 'lucide-react'
import { prop } from 'ramda'
import { useForecastStore } from '@/app/(app)/stores/forecast-store'
import { DebounceAbortError } from '@/app/utils/errors'
import { debounce } from '@/app/utils/function'
import { findCityComponent, loadPlacesLibrary } from '@/app/utils/google-places'
import { slugify } from '@/app/utils/string'
import { Button } from '@/shadcn/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shadcn/components/ui/dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/shadcn/components/ui/input-group'

export default function AddLocationModal() {
  const { t } = useTranslation()
  const router = useRouter()
  const citySlug = useForecastStore(prop('citySlug'))
  const addLocation = useForecastStore(prop('addLocation'))
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState(null)
  const placesRef = useRef(null)
  const sessionTokenRef = useRef(null)
  const debouncedSearchRef = useRef(null)
  const inputRef = useRef(null)
  const firstSuggestionRef = useRef(null)

  const initPlaces = useCallback(async () => {
    if (placesRef.current) {
      return
    }
    const lib = await loadPlacesLibrary()
    placesRef.current = lib
    sessionTokenRef.current = new lib.AutocompleteSessionToken()

    const service = new lib.AutocompleteService()
    debouncedSearchRef.current = debounce(async input => {
      const response = await service.getPlacePredictions({
        input,
        sessionToken: sessionTokenRef.current,
      })
      return response.predictions
    }, 300)
  }, [])

  const handleOpenChange = useCallback(async nextOpen => {
    if (nextOpen) {
      setInputValue('')
      setSuggestions([])
      setError(null)
      setIsSearching(false)
      await initPlaces()
    } else if (debouncedSearchRef.current) {
      debouncedSearchRef.current.cancel()
    }
    setOpen(nextOpen)
  }, [initPlaces])

  const handleInputChange = useCallback(async e => {
    const value = e.target.value
    setInputValue(value)
    setError(null)

    if (!value.trim()) {
      setSuggestions([])
      setIsSearching(false)
      debouncedSearchRef.current?.cancel()
      return
    }

    setIsSearching(true)
    try {
      const predictions = await debouncedSearchRef.current(value)
      setSuggestions(predictions)
      setIsSearching(false)
    } catch (err) {
      if (err instanceof DebounceAbortError) {
        return
      }
      setError(t('home.locations.searchError'))
      setIsSearching(false)
    }
  }, [t])

  const handleInputKeyDown = useCallback(e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      firstSuggestionRef.current?.focus()
    }
  }, [])

  const handleSuggestionKeyDown = useCallback(e => {
    if (e.key === 'ArrowDown') {
      // Move focus to the next suggestion in the list.
      e.preventDefault()
      e.currentTarget.nextElementSibling?.focus()
    } else if (e.key === 'ArrowUp') {
      // Move focus to the previous suggestion, or back to the search input
      // when already at the first suggestion.
      e.preventDefault()
      const prev = e.currentTarget.previousElementSibling
      if (prev) {
        prev.focus()
      } else {
        inputRef.current.focus()
      }
    }
  }, [])

  const handleSelect = useCallback(async prediction => {
    const { Place } = placesRef.current
    const place = new Place({ id: prediction.place_id })
    const { place: details } = await place.fetchFields({
      fields: ['addressComponents', 'displayName', 'formattedAddress', 'location'],
    })

    const cityComponent = findCityComponent(details.addressComponents)
    const addressCitySlug = cityComponent && slugify(cityComponent.longText)
    await addLocation({
      name: details.displayName,
      area: details.formattedAddress.replace(new RegExp(`${details.displayName}[\\s,]*`), ''),
      citySlug: addressCitySlug,
      latitude: details.location.lat(),
      longitude: details.location.lng(),
    })

    sessionTokenRef.current = new placesRef.current.AutocompleteSessionToken()
    if (citySlug) {
      // On a city page, locations are server-defined.
      // Navigate to /home where it shows the user's own saved locations.
      router.push('/home')
    } else {
      setOpen(false)
    }
  }, [addLocation, citySlug, router])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={t('home.locations.addLocation')}
          data-testid="add-location-button"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-[50vh] max-h-[80vh]" data-testid="add-location-modal">
        <DialogHeader>
          <DialogTitle>{t('home.locations.addLocation')}</DialogTitle>
        </DialogHeader>
        <div className="px-4">
          <InputGroup className="h-auto px-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              type="text"
              placeholder={t('home.locations.searchPlaceholder')}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              className="h-auto py-3"
              data-testid="location-search-input"
            />
            {isSearching && (
              <InputGroupAddon align="inline-end">
                <Loader2 className="animate-spin" />
              </InputGroupAddon>
            )}
          </InputGroup>
        </div>
        <div className="px-4 pb-4 overflow-y-auto" data-testid="search-results">
          {error && (
            <p className="text-sm text-destructive text-center py-4" data-testid="search-error">
              {error}
            </p>
          )}
          {!error && !isSearching && inputValue.trim() && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="no-results">
              {t('home.locations.noResults')}
            </p>
          )}
          {!error && suggestions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              ref={index === 0 ? firstSuggestionRef : undefined}
              className="w-full text-left px-4 py-3 hover:bg-accent rounded-xl transition-colors"
              onClick={() => handleSelect(prediction)}
              onKeyDown={handleSuggestionKeyDown}
              data-testid="suggestion-item"
            >
              <p className="font-medium text-sm">
                {prediction.structured_formatting.main_text}
              </p>
              <p className="text-xs text-muted-foreground">
                {prediction.structured_formatting.secondary_text}
              </p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
