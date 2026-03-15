import {
  getConditionBackgroundColor,
  getConditionColor,
  getConditionTextColor,
  getTempColor,
  getWaterColor,
  isWarningCondition,
} from './condition-colors'

describe('getConditionBackgroundColor', () => {
  it('should return bg-condition-ideal for ideal condition', () => {
    expect(getConditionBackgroundColor('ideal')).toBe('bg-condition-ideal')
  })

  it('should return bg-condition-acceptable for acceptable condition', () => {
    expect(getConditionBackgroundColor('acceptable')).toBe('bg-condition-acceptable')
  })

  it('should return bg-condition-marginal for marginal condition', () => {
    expect(getConditionBackgroundColor('marginal')).toBe('bg-condition-marginal')
  })

  it('should return bg-condition-unsuitable for unsuitable condition', () => {
    expect(getConditionBackgroundColor('unsuitable')).toBe('bg-condition-unsuitable')
  })

  it('should return bg-condition-default for unknown condition', () => {
    expect(getConditionBackgroundColor('unknown')).toBe('bg-condition-default')
  })
})

describe('getConditionTextColor', () => {
  it('should return text-condition-ideal for ideal condition', () => {
    expect(getConditionTextColor('ideal')).toBe('text-condition-ideal')
  })

  it('should return text-condition-acceptable for acceptable condition', () => {
    expect(getConditionTextColor('acceptable')).toBe('text-condition-acceptable')
  })

  it('should return text-condition-marginal for marginal condition', () => {
    expect(getConditionTextColor('marginal')).toBe('text-condition-marginal')
  })

  it('should return text-condition-unsuitable for unsuitable condition', () => {
    expect(getConditionTextColor('unsuitable')).toBe('text-condition-unsuitable')
  })

  it('should return text-condition-default for unknown condition', () => {
    expect(getConditionTextColor('unknown')).toBe('text-condition-default')
  })
})

describe('getConditionColor', () => {
  it('should return condition-ideal CSS variable for ideal condition', () => {
    expect(getConditionColor('ideal')).toBe('var(--condition-ideal)')
  })

  it('should return condition-acceptable CSS variable for acceptable condition', () => {
    expect(getConditionColor('acceptable')).toBe('var(--condition-acceptable)')
  })

  it('should return condition-marginal CSS variable for marginal condition', () => {
    expect(getConditionColor('marginal')).toBe('var(--condition-marginal)')
  })

  it('should return condition-unsuitable CSS variable for unsuitable condition', () => {
    expect(getConditionColor('unsuitable')).toBe('var(--condition-unsuitable)')
  })

  it('should return condition-default CSS variable for unknown condition', () => {
    expect(getConditionColor('unknown')).toBe('var(--condition-default)')
  })
})

describe('getWaterColor', () => {
  it('should return condition-ideal CSS variable for Green quality', () => {
    expect(getWaterColor('Green')).toBe('var(--condition-ideal)')
  })

  it('should return condition-marginal CSS variable for Orange quality', () => {
    expect(getWaterColor('Orange')).toBe('var(--condition-marginal)')
  })

  it('should return condition-unsuitable CSS variable for Red quality', () => {
    expect(getWaterColor('Red')).toBe('var(--condition-unsuitable)')
  })

  it('should return condition-unsuitable CSS variable for Black quality', () => {
    expect(getWaterColor('Black')).toBe('var(--condition-unsuitable)')
  })

  it('should return condition-default CSS variable for unknown quality', () => {
    expect(getWaterColor('unknown')).toBe('var(--condition-default)')
  })
})

describe('isWarningCondition', () => {
  it('should return true for marginal condition', () => {
    expect(isWarningCondition('marginal')).toBe(true)
  })

  it('should return true for unsuitable condition', () => {
    expect(isWarningCondition('unsuitable')).toBe(true)
  })

  it('should return false for ideal condition', () => {
    expect(isWarningCondition('ideal')).toBe(false)
  })

  it('should return false for acceptable condition', () => {
    expect(isWarningCondition('acceptable')).toBe(false)
  })

  it('should return false for unknown condition', () => {
    expect(isWarningCondition('unknown')).toBe(false)
  })
})

describe('getTempColor', () => {
  it('should return temp-cold CSS variable for temperatures below 10', () => {
    expect(getTempColor(5)).toBe('var(--temp-cold)')
  })

  it('should return temp-cool CSS variable for temperatures from 10 to 14', () => {
    expect(getTempColor(10)).toBe('var(--temp-cool)')
  })

  it('should return temp-mild CSS variable for temperatures from 15 to 19', () => {
    expect(getTempColor(15)).toBe('var(--temp-mild)')
  })

  it('should return temp-warm CSS variable for temperatures from 20 to 24', () => {
    expect(getTempColor(20)).toBe('var(--temp-warm)')
  })

  it('should return temp-hot CSS variable for temperatures from 25 to 29', () => {
    expect(getTempColor(25)).toBe('var(--temp-hot)')
  })

  it('should return temp-extreme CSS variable for temperatures 30 and above', () => {
    expect(getTempColor(30)).toBe('var(--temp-extreme)')
  })
})
