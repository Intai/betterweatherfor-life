import { getPreferences, parsePreferences, setPreference } from './preferences-storage'

describe('preferences-storage', () => {
  beforeEach(() => {
    document.cookie.split('; ').forEach(c => {
      const name = c.split('=')[0]
      if (name) document.cookie = `${name}=; max-age=0; path=/`
    })
  })

  describe('getPreferences', () => {
    it('should return an empty object when nothing is stored', () => {
      expect(getPreferences()).toEqual({})
    })

    it('should return valid selectedActivity', () => {
      document.cookie = 'selectedActivity=kayaking; path=/'
      expect(getPreferences()).toEqual({ selectedActivity: 'kayaking' })
    })

    it('should drop invalid selectedActivity', () => {
      document.cookie = 'selectedActivity=flying; path=/'
      expect(getPreferences()).toEqual({})
    })

    it('should return valid selectedDay', () => {
      document.cookie = 'selectedDay=tomorrow; path=/'
      expect(getPreferences()).toEqual({ selectedDay: 'tomorrow' })
    })

    it('should drop invalid selectedDay', () => {
      document.cookie = 'selectedDay=next-week; path=/'
      expect(getPreferences()).toEqual({})
    })

    it('should return valid selectedTimeRange', () => {
      document.cookie = 'selectedTimeRange=morning; path=/'
      expect(getPreferences()).toEqual({ selectedTimeRange: 'morning' })
    })

    it('should drop invalid selectedTimeRange', () => {
      document.cookie = 'selectedTimeRange=midnight; path=/'
      expect(getPreferences()).toEqual({})
    })

    it('should deserialize selectedDate from ISO string to Date', () => {
      document.cookie = 'selectedDate=2026-03-15T00%3A00%3A00.000Z; path=/'
      const prefs = getPreferences()
      expect(prefs.selectedDate).toBeInstanceOf(Date)
      expect(prefs.selectedDate.toISOString()).toBe('2026-03-15T00:00:00.000Z')
    })

    it('should drop invalid selectedDate string', () => {
      document.cookie = 'selectedDate=not-a-date; path=/'
      expect(getPreferences()).toEqual({})
    })

    it('should reset selectedDay to today when pick-date but no valid selectedDate', () => {
      document.cookie = 'selectedDay=pick-date; path=/'
      expect(getPreferences()).toEqual({ selectedDay: 'today' })
    })

    it('should keep pick-date when selectedDate is valid', () => {
      document.cookie = 'selectedDay=pick-date; path=/'
      document.cookie = 'selectedDate=2026-03-15T00%3A00%3A00.000Z; path=/'
      const prefs = getPreferences()
      expect(prefs.selectedDay).toBe('pick-date')
      expect(prefs.selectedDate).toBeInstanceOf(Date)
    })

    it('should round-trip all preferences', () => {
      document.cookie = 'selectedActivity=snorkelling; path=/'
      document.cookie = 'selectedDay=tomorrow; path=/'
      document.cookie = 'selectedTimeRange=afternoon; path=/'
      expect(getPreferences()).toEqual({
        selectedActivity: 'snorkelling',
        selectedDay: 'tomorrow',
        selectedTimeRange: 'afternoon',
      })
    })
  })

  describe('parsePreferences', () => {
    it('should return empty object for empty list', () => {
      expect(parsePreferences([])).toEqual({})
    })

    it('should pick known preference keys', () => {
      expect(parsePreferences([
        { name: 'selectedActivity', value: 'kayaking' },
        { name: 'selectedDay', value: 'tomorrow' },
      ])).toEqual({
        selectedActivity: 'kayaking',
        selectedDay: 'tomorrow',
      })
    })

    it('should drop unknown keys', () => {
      expect(parsePreferences([
        { name: 'unknownKey', value: 'something' },
      ])).toEqual({})
    })

    it('should pick only known keys from mixed list', () => {
      expect(parsePreferences([
        { name: 'selectedActivity', value: 'cycling' },
        { name: 'unknownKey', value: 'something' },
      ])).toEqual({
        selectedActivity: 'cycling',
      })
    })

    it('should handle all four preference keys', () => {
      const result = parsePreferences([
        { name: 'selectedActivity', value: 'sup' },
        { name: 'selectedDay', value: 'today' },
        { name: 'selectedDate', value: '2026-03-15' },
        { name: 'selectedTimeRange', value: 'morning' },
      ])
      expect(result).toEqual({
        selectedActivity: 'sup',
        selectedDay: 'today',
        selectedDate: new Date('2026-03-15'),
        selectedTimeRange: 'morning',
      })
    })

    it('should pass through selectedDate that is already a Date', () => {
      const date = new Date('2026-03-15')
      const result = parsePreferences([
        { name: 'selectedDate', value: date },
      ])
      expect(result.selectedDate).toBe(date)
    })
  })

  describe('setPreference', () => {
    it('should persist a preference value', () => {
      setPreference('selectedActivity', 'cycling')
      expect(document.cookie).toContain('selectedActivity=cycling')
    })

    it('should overwrite an existing preference', () => {
      setPreference('selectedActivity', 'cycling')
      setPreference('selectedActivity', 'kayaking')
      expect(document.cookie).toContain('selectedActivity=kayaking')
      expect(document.cookie).not.toMatch(/selectedActivity=cycling/)
    })

    it('should convert Date to formatted string for selectedDate', () => {
      const date = new Date(2026, 2, 15)
      setPreference('selectedDate', date)
      expect(document.cookie).toContain('selectedDate=2026-03-15T00%3A00%3A00.000')
      const prefs = getPreferences()
      expect(prefs.selectedDate).toBeInstanceOf(Date)
      expect(prefs.selectedDate).toEqual(date)
    })

    it('should ignore unknown preference keys', () => {
      setPreference('unknownKey', 'value')
      expect(document.cookie).not.toContain('unknownKey')
    })
  })
})
