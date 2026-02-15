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
 * Converts a string into a URL-safe slug suitable for file names.
 * - Converts to lowercase
 * - Replaces spaces and underscores with hyphens
 * - Removes special characters (keeps only alphanumeric and hyphens)
 * - Removes leading/trailing hyphens
 * - Collapses multiple consecutive hyphens into a single hyphen
 *
 * @param {string} str - The input string to slugify.
 * @returns {string} A URL-safe slug suitable for file names.
 *
 * @example
 * slugify("My App Name!") // Returns: "my-app-name"
 * slugify("Hello World") // Returns: "hello-world"
 * slugify("  Test___App--Name  ") // Returns: "test-app-name"
 */
export const slugify = str =>  str
  .toLowerCase()
  .trim()
  .replace(/[\s_]+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/--+/g, '-')
  .replace(/^-+|-+$/g, '')

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

export const joinByComma = joinBySeparators(',', ',')
export const joinByDot = joinBySeparators('.', '.')
export const joinBySemicolon = joinBySeparators(';', ';')
export const joinBySlash = joinBySeparators('/', '/')
export const joinBySpace = joinBySeparators(' ', ' ')
