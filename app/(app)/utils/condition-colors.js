import {
  ACCEPTABLE,
  IDEAL,
  MARGINAL,
  UNSUITABLE,
} from '@/app/(app)/constants'

/**
 * Returns a Tailwind background color class for the given condition.
 * @param {string} condition - One of 'ideal', 'acceptable', 'marginal', 'unsuitable'.
 * @returns {string} A Tailwind CSS class name.
 */
export function getConditionBackgroundColor(condition) {
  switch (condition) {
  case IDEAL:
    return 'bg-condition-ideal'
  case ACCEPTABLE:
    return 'bg-condition-acceptable'
  case MARGINAL:
    return 'bg-condition-marginal'
  case UNSUITABLE:
    return 'bg-condition-unsuitable'
  default:
    return 'bg-condition-default'
  }
}

/**
 * Returns a Tailwind text color class for the given condition.
 * @param {string} condition - One of 'ideal', 'acceptable', 'marginal', 'unsuitable'.
 * @returns {string} A Tailwind CSS class name.
 */
export function getConditionTextColor(condition) {
  switch (condition) {
  case IDEAL:
    return 'text-condition-ideal'
  case ACCEPTABLE:
    return 'text-condition-acceptable'
  case MARGINAL:
    return 'text-condition-marginal'
  case UNSUITABLE:
    return 'text-condition-unsuitable'
  default:
    return 'text-condition-default'
  }
}

/**
 * Returns a CSS custom property value for condition colors.
 * @param {string} condition - One of 'ideal', 'acceptable', 'marginal', 'unsuitable'.
 * @returns {string} A CSS custom property reference.
 */
export function getConditionColor(condition) {
  switch (condition) {
  case IDEAL:
    return 'var(--condition-ideal)'
  case ACCEPTABLE:
    return 'var(--condition-acceptable)'
  case MARGINAL:
    return 'var(--condition-marginal)'
  case UNSUITABLE:
    return 'var(--condition-unsuitable)'
  default:
    return 'var(--condition-default)'
  }
}

/**
 * Returns a CSS custom property value for water quality colors.
 * @param {string} quality - One of 'Green', 'Orange', 'Red', 'Black'.
 * @returns {string} A CSS custom property reference.
 */
export function getWaterColor(quality) {
  switch (quality) {
  case 'Green':
    return 'var(--condition-ideal)'
  case 'Orange':
    return 'var(--condition-marginal)'
  case 'Red':
  case 'Black':
    return 'var(--condition-unsuitable)'
  default:
    return 'var(--condition-default)'
  }
}

/**
 * Returns a CSS custom property value for temperature colors.
 * @param {number} temp - Temperature value in degrees.
 * @returns {string} A CSS custom property reference.
 */
export function getTempColor(temp) {
  if (temp < 10) return 'var(--temp-cold)'
  if (temp < 15) return 'var(--temp-cool)'
  if (temp < 20) return 'var(--temp-mild)'
  if (temp < 25) return 'var(--temp-warm)'
  if (temp < 30) return 'var(--temp-hot)'
  return 'var(--temp-extreme)'
}
