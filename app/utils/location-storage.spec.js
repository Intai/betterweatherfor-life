import { addLocation, addLocations, buildLocationKey, getLocations, removeLocation } from './location-storage'

describe('location-storage', () => {
  const locationA = {
    name: 'Beach A',
    area: 'Coast',
    latitude: 51.5,
    longitude: -0.1,
    timeZone: 'Europe/London',
  }

  const locationB = {
    name: 'Beach B',
    area: 'Bay',
    latitude: 34.0,
    longitude: -118.5,
    timeZone: 'America/Los_Angeles',
  }

  beforeEach(() => {
    localStorage.clear()
  })

  describe('buildLocationKey', () => {
    it('should return a "lat,lng" string', () => {
      expect(buildLocationKey(51.5, -0.1)).toBe('51.5,-0.1')
    })

    it('should preserve a coordinate of 0', () => {
      expect(buildLocationKey(0, 0)).toBe('0,0')
    })
  })

  describe('getLocations', () => {
    it('should return an empty object when no locations are stored', () => {
      expect(getLocations()).toEqual({})
    })

    it('should return stored locations', () => {
      localStorage.setItem('locations', JSON.stringify({ '51.5,-0.1': locationA }))
      expect(getLocations()).toEqual({ '51.5,-0.1': locationA })
    })
  })

  describe('addLocation', () => {
    it('should add a location to an empty store', () => {
      addLocation(locationA)
      expect(getLocations()).toEqual({ '51.5,-0.1': locationA })
    })

    it('should add a second location', () => {
      addLocation(locationA)
      addLocation(locationB)
      expect(getLocations()).toEqual({
        '51.5,-0.1': locationA,
        '34,-118.5': locationB,
      })
    })

    it('should replace an existing location with the same coordinates', () => {
      addLocation(locationA)
      const updated = { ...locationA, name: 'Updated Beach' }
      addLocation(updated)
      expect(getLocations()).toEqual({ '51.5,-0.1': updated })
    })

    it('should only persist the specified fields', () => {
      addLocation({ ...locationA, extra: 'ignored' })
      expect(getLocations()).toEqual({ '51.5,-0.1': locationA })
    })
  })

  describe('addLocations', () => {
    it('should save locations to an empty store', () => {
      addLocations({ '1,2': locationA })
      expect(getLocations()).toEqual({ '1,2': locationA })
    })

    it('should merge with existing locations', () => {
      addLocation(locationA)
      addLocations({ '34,-118.5': locationB })
      expect(getLocations()).toEqual({
        '51.5,-0.1': locationA,
        '34,-118.5': locationB,
      })
    })

    it('should overwrite matching coordinate keys with new values', () => {
      addLocation(locationA)
      const updated = { ...locationA, name: 'Updated' }
      addLocations({ '51.5,-0.1': updated })
      expect(getLocations()).toEqual({ '51.5,-0.1': updated })
    })
  })

  describe('removeLocation', () => {
    it('should remove the location with the matching key', () => {
      addLocation(locationA)
      addLocation(locationB)
      removeLocation('51.5,-0.1')
      expect(getLocations()).toEqual({ '34,-118.5': locationB })
    })

    it('should leave the store unchanged when the key does not exist', () => {
      addLocation(locationA)
      removeLocation('nonexistent')
      expect(getLocations()).toEqual({ '51.5,-0.1': locationA })
    })
  })
})
