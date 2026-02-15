/* eslint-disable no-console */

import '@testing-library/jest-dom'

const originalError = console.error
console.error = jest.fn((...args) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '')

  if (message.includes('[ERROR]')) {
    return // Suppress error logs
  }
  originalError(...args)
})

const originalWarn = console.warn
console.warn = jest.fn((...args) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '')

  if (message.includes('[WARN]')) {
    return // Suppress warn logs
  }
  originalWarn(...args)
})

const originalInfo = console.info
console.info = jest.fn((...args) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '')

  if (message.includes('[INFO]')) {
    return // Suppress info logs
  }
  originalInfo(...args)
})

const originalLog = console.log
console.log = jest.fn((...args) => {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0] || '')

  if (message.includes('[DEBUG]') || message.includes('[TRACE]')) {
    return // Suppress debug and trace logs
  }
  originalLog(...args)
})
