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
