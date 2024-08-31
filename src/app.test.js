import { driver } from '@digitalbazaar/did-method-key'
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020'
import decodeSeed from './utils/decodeSeed.js'
import { expect } from 'chai'
import request from 'supertest'
import { clearIssuerInstances } from './issue.js'
import {
  resetConfig,
  deleteSeed,
  TEST_TENANT_NAME,
  getTenantSeed
} from './config.js'
import {
  ed25519_2020suiteContext,
  getCredentialStatus,
  getCredentialStatusBitString,
  getUnsignedVC,
  getUnsignedVCWithStatus,
  getUnsignedVC2WithStatus,
  getUnsignedVCWithoutSuiteContext
} from './test-fixtures/vc.js'

import { build } from './app.js'

const didKeyDriver = driver()
didKeyDriver.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: Ed25519VerificationKey2020.from
})

let testDIDSeed
let didDocument
let verificationMethod
let signingDID
let app

describe('api', () => {
  before(async () => {
    testDIDSeed = await decodeSeed(process.env.TENANT_SEED_TESTING)
    const verificationKeyPair = await Ed25519VerificationKey2020.generate({
      seed: testDIDSeed
    })
    ;({ didDocument } = await didKeyDriver.fromKeyPair({ verificationKeyPair }))
    verificationMethod = didKeyDriver.publicMethodFor({
      didDocument,
      purpose: 'assertionMethod'
    }).id
    signingDID = didDocument.id
  })

  after(() => {})

  beforeEach(async () => {
    app = await build()
  })

  afterEach(async () => {})

  describe('GET /', () => {
    it('GET / => hello', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect(/{"message":"signing-service server status: ok."}/, done)
    })
  })

  describe('GET /unknown', () => {
    it('unknown endpoint returns 404', (done) => {
      request(app).get('/unknown').expect(404, done)
    }, 10000)
  })

  describe('POST /instance/:instanceId/credentials/sign', () => {
    it('returns 400 if no body', (done) => {
      request(app)
        .post('/instance/testing/credentials/sign')
        .expect('Content-Type', /json/)
        .expect(400, done)
    })

    it('returns 404 if no seed for tenant name', async () => {
      const unSignedVC = getUnsignedVC()
      const response = await request(app)
        .post('/instance/wrongTenantName/credentials/sign')
        .send(unSignedVC)

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(404)
    })

    it('returns the submitted vc version 2, signed with test key', async () => {
      const sentCred = getUnsignedVC2WithStatus()
      const response = await request(app)
        .post('/instance/testing/credentials/sign')
        .send(sentCred)

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(200)

      const returnedCred = JSON.parse(JSON.stringify(response.body))
      const proof = returnedCred.proof
      delete returnedCred.proof
      sentCred.issuer.id = signingDID
      expect(sentCred).to.eql(returnedCred)
      expect(proof.type).to.eql('Ed25519Signature2020')
      expect(proof.verificationMethod).to.eql(verificationMethod)
    })

    it('returns the submitted vc, signed with test key', async () => {
      const sentCred = getUnsignedVCWithStatus()
      const response = await request(app)
        .post('/instance/testing/credentials/sign')
        .send(sentCred)

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(200)

      const returnedCred = JSON.parse(JSON.stringify(response.body))
      const proof = returnedCred.proof
      delete returnedCred.proof
      sentCred.issuer.id = signingDID
      expect(sentCred).to.eql(returnedCred)
      expect(proof.type).to.eql('Ed25519Signature2020')
      expect(proof.verificationMethod).to.eql(verificationMethod)
    })

    it('sets the issuer.id to signing DID', (done) => {
      request(app)
        .post('/instance/testing/credentials/sign')
        .send(getUnsignedVCWithStatus())
        .expect('Content-Type', /json/)
        .expect((res) => expect(res.body.issuer.id).to.eql(signingDID))
        .expect(200, done)
    })

    it('adds the suite context', async () => {
      const response = await request(app)
        .post('/instance/testing/credentials/sign')
        .send(getUnsignedVCWithoutSuiteContext())

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(200)

      expect(response.body['@context']).to.include(ed25519_2020suiteContext)
    })

    it('leaves an existing credential status as-is', async () => {
      const statusBeforeSigning = getCredentialStatus()
      const response = await request(app)
        .post('/instance/testing/credentials/sign')
        .send(getUnsignedVCWithStatus())

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(200)
      expect(response.body.credentialStatus).to.eql(statusBeforeSigning)
    })

    it('leaves an existing bitstring credential status as-is with v2', async () => {
      const statusBeforeSigning = getCredentialStatusBitString()
      const response = await request(app)
        .post('/instance/testing/credentials/sign')
        .send(getUnsignedVC2WithStatus())

      expect(response.header['content-type']).to.have.string('json')
      expect(response.status).to.eql(200)
      expect(response.body.credentialStatus).to.eql(statusBeforeSigning)
    })
  })

  describe('DID:web', () => {
    const tenantName = 'apptest'

    before(() => {
      resetConfig()
      process.env[`TENANT_SEED_${tenantName}`] =
        'z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB'
      process.env[`TENANT_DIDMETHOD_${tenantName}`] = 'web'
      process.env[`TENANT_DID_URL_${tenantName}`] = 'https://example.com'
    })

    after(() => {
      delete process.env[`TENANT_SEED_${tenantName}`]
      delete process.env[`TENANT_DIDMETHOD_${tenantName}`]
      delete process.env[`TENANT_DID_URL_${tenantName}`]
    })

    it('signs with a did:web', async () => {
      await request(app)
        .post(`/instance/${tenantName}/credentials/sign`)
        .send(getUnsignedVCWithStatus())
        .expect('Content-Type', /json/)
        .expect((res) =>
          expect(res.body.issuer.id).to.eql('did:web:example.com')
        )
        .expect(200)
    })
  })

  describe('/did-web-generator', () => {
    it('returns a new did:web', async () => {
      await request(app)
        .post(`/did-web-generator`)
        .send({
          url: 'https://raw.githubusercontent.com/jchartrand/didWebTest/main'
        })
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body.seed).to.exist
          expect(res.body.didDocument.id).to.eql(
            'did:web:raw.githubusercontent.com:jchartrand:didWebTest:main'
          )
          expect(res.body.did).to.eql(
            'did:web:raw.githubusercontent.com:jchartrand:didWebTest:main'
          )
        })
        .expect(200)
    })
  })

  describe('/did-key-generator', () => {
    it('returns a new did:key', async () => {
      await request(app)
        .get(`/did-key-generator`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body.seed).to.exist
          expect(res.body.didDocument.id).to.contain('did:key')
          expect(res.body.did).to.contain('did:key')
        })
        .expect(200)
    })
  })

  describe('/did-key-generator', () => {
    it('returns a new did:key', async () => {
      await request(app)
        .get(`/seedgen`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body.seed).to.exist
          expect(res.body.didDocument.id).to.contain('did:key')
          expect(res.body.did).to.contain('did:key')
        })
        .expect(200)
    })
  })

  describe('/healthz', () => {
    it('returns 200 when healthy', async () => {
      await request(app)
        .get(`/healthz`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body.message).to.contain('ok')
        })
        .expect(200)
    })
  })

  describe('/healthz fail', () => {
    // to force an error with the health check, we remove the
    // test issuer instance and it's signing seed

    beforeEach(async () => {
      // make sure all seeds have been loaded before we remove the test seed
      await getTenantSeed(TEST_TENANT_NAME)
      deleteSeed(TEST_TENANT_NAME)
      clearIssuerInstances()
    })

    after(async () => {
      resetConfig()
    })

    it('returns 503 when not healthy', async () => {
      await request(app)
        .get(`/healthz`)
        .expect('Content-Type', /json/)
        .expect((res) => {
          console.log('the body:')
          console.log(res.body)
          expect(res.body.error).to.contain('error')
        })
        .expect(503)
    })
  })
})
