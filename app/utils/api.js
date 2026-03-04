import { ApiError } from './errors'

/**
 * Fetches a URL and parses the JSON response.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<*>} parsed JSON
 * @throws {ApiError} when response.ok is false
 */
export async function fetchJson(url, options) {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body)
  }
  return response.json()
}

/**
 * POSTs JSON to a URL and parses the JSON response.
 * @param {string} url
 * @param {*} body - request body (will be JSON-stringified)
 * @returns {Promise<*>} parsed JSON
 * @throws {ApiError} when response.ok is false
 */
export async function postJson(url, body) {
  return fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
