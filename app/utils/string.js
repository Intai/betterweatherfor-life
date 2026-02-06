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
 * Convert URL slug to display name (e.g., "new-plymouth" → "New Plymouth")
 * @param {string} slug
 * @returns {string}
 */
export function deslugify(slug) {
  if (!slug) return slug
  return slug.split('-').map(upperFirst).join(' ')
}
