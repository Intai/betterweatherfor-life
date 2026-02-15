import { identity } from 'ramda'

const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

const currentLevel = LOG_LEVELS[process.env.LOGGING_LEVEL] || LOG_LEVELS.debug

const getConsoleMethod = level => {
  switch (level) {
  case 'info':
    return 'info'
  case 'warn':
    return 'warn'
  case 'error':
  case 'fatal':
    return 'error'
  default:
    return 'log'
  }
}

/**
 * Log a message to console if it meets the level threshold
 * @param level - Log level
 * @param msg - Message or object to log
 * @param context - Additional context
 */
const log = (level, msg, context) => {
  if (LOG_LEVELS[level] < currentLevel) return
  // eslint-disable-next-line no-console
  const consoleLog = console[getConsoleMethod(level)]
  consoleLog.apply(consoleLog, [`[${level.toUpperCase()}]`, msg, context].filter(identity))
}

/**
 * Log a trace message (most verbose)
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const trace = (msg, context) => {
  log('trace', msg, context)
}

/**
 * Log a debug message
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const debug = (msg, context) => {
  log('debug', msg, context)
}

/**
 * Log an info message
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const info = (msg, context) => {
  log('info', msg, context)
}

/**
 * Log a warning message
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const warn = (msg, context) => {
  log('warn', msg, context)
}

/**
 * Log an error message
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const error = (msg, context) => {
  log('error', msg, context)
}

/**
 * Log a fatal message (least verbose, most critical)
 * @param msg - Message or object to log
 * @param context - Additional context
 */
export const fatal = (msg, context) => {
  log('fatal', msg, context)
}
