import logger from '../utils/logger.js'

const errorLogger = (error, request, response, next) => {
  const logEntry = { originalError: error }
  logEntry.message = 'An error occurred in the signing-service.'
  const logEntrySummary = `Error for route: ${request.originalUrl} - ${request.method} - IP: ${request.ip} - `

  // Note that the logEntry here is what Winston calls a 'meta' object.
  // Winston simply prints the logEntry to the log as provided - JSON in this case.
  logger.error(logEntrySummary, logEntry)

  next(error) // done logging, so call the next middleware that deals with errors
}

export default errorLogger
