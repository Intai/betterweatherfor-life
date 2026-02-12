import { curry, identity } from 'ramda'

/**
 * Capitalize the first character of a string
 * @param {string} str
 * @returns {string}
 */
export function upperFirst(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Converts a kebab-case string to camelCase.
 * @param {string} str - The kebab-case input string.
 * @returns {string} The string converted to camelCase.
 */
export const kebabToCamel = str => str.replace(/-[a-zA-Z]/g, s => s[1].toUpperCase()).replace(/-/g, '')


/**
 * Convert URL slug to display name (e.g., "new-plymouth" → "New Plymouth")
 * @param {string} slug
 * @returns {string}
 */
export function deslugify(slug) {
  if (!slug) return slug
  return slug.split('-').map(upperFirst).join(' ')
}

/**
 * Join an array of strings with a separator, using a different separator before the last item.
 * Falsy values are filtered out before joining.
 * @param {string} separator - Separator between items except the last.
 * @param {string} lastSeparator - Separator before the last item.
 * @param {string[]} strings - Array of strings to join.
 * @returns {string}
 */
export const joinBySeparators = curry((separator, lastSeparator, strings) => {
  if (!strings || !Array.isArray(strings)) {
    return ''
  }
  const filtered = strings.filter(identity)
  return filtered.length <= 2
    ? filtered.join(lastSeparator)
    : `${filtered.slice(0, - 1).join(separator)}${lastSeparator}${filtered[filtered.length - 1]}`
})

export const joinByDot = joinBySeparators('.', '.')
export const joinBySemicolon = joinBySeparators(';', ';')
export const joinBySlash = joinBySeparators('/', '/')
export const joinBySpace = joinBySeparators(' ', ' ')
