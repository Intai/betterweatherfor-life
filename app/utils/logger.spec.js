/* eslint-disable no-console */

describe('logger', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = process.env.LOGGING_LEVEL
    jest.resetModules()
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'info').mockImplementation()
    jest.spyOn(console, 'warn').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    process.env.LOGGING_LEVEL = originalEnv
    jest.restoreAllMocks()
  })

  const importLogger = async () => {
    const mod = await import('./logger')
    return mod
  }

  it('should route trace to console.log', async () => {
    process.env.LOGGING_LEVEL = 'trace'
    const { trace } = await importLogger()
    trace('msg')
    expect(console.log).toHaveBeenCalledWith('[TRACE]', 'msg')
  })

  it('should route debug to console.log', async () => {
    const { debug } = await importLogger()
    debug('msg')
    expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'msg')
  })

  it('should route info to console.info', async () => {
    const { info } = await importLogger()
    info('msg')
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'msg')
  })

  it('should route warn to console.warn', async () => {
    const { warn } = await importLogger()
    warn('msg')
    expect(console.warn).toHaveBeenCalledWith('[WARN]', 'msg')
  })

  it('should route error to console.error', async () => {
    const { error } = await importLogger()
    error('msg')
    expect(console.error).toHaveBeenCalledWith('[ERROR]', 'msg')
  })

  it('should route fatal to console.error', async () => {
    const { fatal } = await importLogger()
    fatal('msg')
    expect(console.error).toHaveBeenCalledWith('[FATAL]', 'msg')
  })

  it('should suppress trace at default debug level', async () => {
    const { trace } = await importLogger()
    trace('msg')
    expect(console.log).not.toHaveBeenCalled()
  })

  it('should log debug and above at default level', async () => {
    const { debug, info, warn, error, fatal } = await importLogger()
    debug('d')
    info('i')
    warn('w')
    error('e')
    fatal('f')
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.info).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('should only log error and fatal when LOGGING_LEVEL=error', async () => {
    process.env.LOGGING_LEVEL = 'error'
    const { debug, info, warn, error, fatal } = await importLogger()
    debug('d')
    info('i')
    warn('w')
    error('e')
    fatal('f')
    expect(console.log).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('should default to debug level for invalid LOGGING_LEVEL', async () => {
    process.env.LOGGING_LEVEL = 'invalid'
    const { trace, debug } = await importLogger()
    trace('t')
    debug('d')
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('[DEBUG]', 'd')
  })

  it('should log with level prefix, message, and context', async () => {
    const { info } = await importLogger()
    info('hello', { key: 'value' })
    expect(console.info).toHaveBeenCalledWith('[INFO]', 'hello', { key: 'value' })
  })
})
