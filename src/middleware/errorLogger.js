import logger from '../utils/logger.js'

const errorLogger = (error, request, response, next) => {
  const stackTrace = error.stack || 'no stack trace available'
  const logEntry = { stackTrace }

  const message = `An error occurred in the signing-service: ${
    error.message || 'unknown error'
  }`
  const logEntrySummary = `Error for route: ${request.originalUrl} - ${request.method} - IP: ${request.ip} - ${message}`

  // Note that the logEntry here is what Winston calls a 'meta' object.
  // Winston simply prints the logEntry to the log as provided - JSON in this case.
  // the logEntrySummary is, on the hand, formatted
  logger.error(logEntrySummary, logEntry)

  next(error) // done logging, so call the next middleware that deals with errors
}

export default errorLogger
