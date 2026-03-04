/**
 * Read a value from localStorage, parsing it as JSON.
 * @param key - The localStorage key to read.
 * @param fallback - Value returned when the key is missing or parsing fails.
 * @returns The parsed value, or fallback.
 */
export const getItem = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * Write a JSON-serialised value to localStorage.
 * @param key - The localStorage key to write.
 * @param value - The value to serialise and store.
 */
export const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Silently handle errors (e.g. quota exceeded, unavailable storage).
  }
}
