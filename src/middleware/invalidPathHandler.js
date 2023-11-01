import logger from '../utils/logger.js'

// Fallback middleware for undefined paths
const invalidPathHandler = (req, res) => {
  res.status(404).send({
    code: 404,
    message: `Route Not Found in signing-service: ${req.originalUrl}`
  })
  logger.error(
    `404 || ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  )
}

export default invalidPathHandler
