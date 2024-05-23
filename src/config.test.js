import { expect } from 'chai'
import { resetConfig, getTenantSeed } from './config.js'

const tenantName = 'configtest'

describe('Config', () => {
  before(async () => {})

  after(async () => {})

  beforeEach(async () => {
    resetConfig()
    delete process.env[`TENANT_SEED_${tenantName}`]
    delete process.env[`TENANT_DID_METHOD_${tenantName}`]
  })

  afterEach(async () => {})

  describe('DID Method', () => {
    it('defaults to use DID:key', async () => {
      process.env[`TENANT_SEED_${tenantName}`] =
        'z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB'
      const seed = await getTenantSeed('configtest')
      expect(seed.didMethod).to.eql('key')
    })

    it('uses DID:key when requested', async () => {
      process.env[`TENANT_SEED_${tenantName}`] =
        'z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB'
      process.env[`TENANT_DID_METHOD_${tenantName}`] = 'key'
      const seed = await getTenantSeed('configtest')
      expect(seed.didMethod).to.eql('key')
    })

    it('uses DID:web when requested', async () => {
      process.env[`TENANT_SEED_${tenantName}`] =
        'z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB'
      process.env[`TENANT_DID_METHOD_${tenantName}`] = 'web'
      const seed = await getTenantSeed('configtest')
      expect(seed.didMethod).to.eql('web')
    })
  })

  describe('DID Seed', () => {
    it('decodes multibase did seeds', async () => {
      process.env[`TENANT_SEED_${tenantName}`] =
        'z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB'
      const seed = await getTenantSeed('configtest')
      expect(seed.didSeed).to.eql(
        new Uint8Array([
          124, 79, 48, 59, 76, 20, 241, 121, 145, 117, 234, 181, 147, 37, 42,
          31, 235, 183, 82, 94, 9, 47, 29, 125, 59, 97, 120, 135, 61, 248, 40,
          204
        ])
      )
    })

    it('decodes non-multibase seeds', async () => {
      process.env[`TENANT_SEED_${tenantName}`] =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ'
      const seed = await getTenantSeed('configtest')
      expect(seed.didSeed).to.eql(
        new Uint8Array([
          97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
          111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 65, 66,
          67, 68, 69, 70
        ])
      )
    })

    it('throws an error when the seed is less than 32 bytes', async () => {
      process.env[`TENANT_SEED_${tenantName}`] = 'tooShort'
      try {
        getTenantSeed('configtest')
      } catch (err) {
        expect(err).to.eql(
          TypeError(
            '"secretKeySeed" must be at least 32 bytes, preferably multibase-encoded.'
          )
        )
      }
    })
  })
})
