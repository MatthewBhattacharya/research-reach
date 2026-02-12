const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = (typeof LOG_LEVELS)[number]

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(currentLevel)
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message), ...args)
  },
  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) console.info(formatMessage('info', message), ...args)
  },
  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message), ...args)
  },
  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) console.error(formatMessage('error', message), ...args)
  }
}
