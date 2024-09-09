import express from 'express'
import cors from 'cors'
import axios from 'axios'
import issue from './issue.js'
import generateSeed from './generate.js'
import accessLogger from './middleware/accessLogger.js'
import errorHandler from './middleware/errorHandler.js'
import errorLogger from './middleware/errorLogger.js'
import invalidPathHandler from './middleware/invalidPathHandler.js'
import SigningException from './SigningException.js'
import { getUnsignedVC } from './test-fixtures/vc.js'
import { TEST_TENANT_NAME } from './config.js'

export async function build() {
  var app = express()

  // Add middleware to write http access logs
  app.use(accessLogger())
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cors())

  app.get('/healthz', async function (req, res) {
    try {
      const { data } = await axios.post(
        `${req.protocol}://${req.headers.host}/instance/${TEST_TENANT_NAME}/credentials/sign`,
        getUnsignedVC()
      )
      if (!data.proof)
        throw new SigningException(503, 'signing-service healthz failed')
    } catch (e) {
      console.log(`exception in healthz: ${JSON.stringify(e)}`)
      return res.status(503).json({
        error: `signing-service healthz check failed with error: ${e}`,
        healthy: false
      })
    }
    res.send({ message: 'signing-service server status: ok.', healthy: true })
  })

  app.get('/', function (req, res) {
    res.send({ message: 'signing-service server status: ok.' })
  })

  app.post('/instance/:instanceId/credentials/sign', async (req, res, next) => {
    try {
      const instanceId = req.params.instanceId //the issuer instance/tenant with which to sign
      const unSignedVC = req.body
      if (!req.body || !Object.keys(req.body).length) {
        throw new SigningException(
          400,
          'A verifiable credential must be provided in the body.'
        )
      }
      const signedVC = await issue(unSignedVC, instanceId)
      return res.json(signedVC)
    } catch (e) {
      // catch the async errors and pass them to the error logger and handler
      next(e)
    }
  })

  app.get('/did-key-generator', async (req, res, next) => {
    try {
      const newSeed = await generateSeed({})
      res.json(newSeed)
    } catch (e) {
      next(e)
    }
  })

  app.post('/did-web-generator', async (req, res, next) => {
    try {
      const { url } = req.body
      const newSeed = await generateSeed({ url })
      res.json(newSeed)
    } catch (e) {
      next(e)
    }
  })

  // Attach the error handling middleware calls, in the order that they should run
  app.use(errorLogger)
  app.use(errorHandler)
  app.use(invalidPathHandler)

  return app
}
