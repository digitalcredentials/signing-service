import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020'
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020'
import { CryptoLD } from 'crypto-ld'
import { driver as keyDriver } from '@digitalbazaar/did-method-key'
import { driver as webDriver } from '@interop/did-web-resolver'
import { securityLoader } from '@digitalcredentials/security-document-loader'
import { getTenantSeed } from './config.js'
import SigningException from './SigningException.js'
import { issue as signVC } from '@digitalbazaar/vc'

let ISSUER_INSTANCES = {}
const documentLoader = securityLoader().build()

// Crypto library for linked data
const cryptoLd = new CryptoLD()
cryptoLd.use(Ed25519VerificationKey2020)

// DID drivers
const didWebDriver = webDriver({ cryptoLd })
const didKeyDriver = keyDriver()

didKeyDriver.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: Ed25519VerificationKey2020.from
})

/* FOR TESTING */
export const clearIssuerInstances = () => {
  ISSUER_INSTANCES = {}
}

const getIssuerInstance = async (instanceId) => {
  if (!ISSUER_INSTANCES[instanceId]) {
    const config = await getTenantSeed(instanceId)
    if (!config?.didSeed)
      throw new SigningException(404, "Tenant doesn't exist.")
    const { didSeed, didMethod, didUrl } = config
    ISSUER_INSTANCES[instanceId] = await buildIssuerInstance(
      didSeed,
      didMethod,
      didUrl
    )
  }
  return ISSUER_INSTANCES[instanceId]
}

const issue = async (unsignedVerifiableCredential, instanceId) => {
  const {
    issuerInstance,
    didDocument: { id: issuerId }
  } = await getIssuerInstance(instanceId)
  addIssuerId(unsignedVerifiableCredential, issuerId)
  const signedVerifiableCredential = await issuerInstance.issueCredential({
    credential: unsignedVerifiableCredential
  })
  return signedVerifiableCredential
}

const addIssuerId = (credential, issuerId) => {
  if (credential.issuer && typeof credential.issuer === 'string') {
    credential.issuer = issuerId
  } else {
    ;(credential.issuer ??= {}).id = issuerId
  }
}

const buildIssuerInstance = async (seed, method, url) => {
  const { didDocument, key } = await getSigningMaterial({ seed, method, url })
  const signingSuite = new Ed25519Signature2020({ key })
  const issuerInstance = new IssuerInstance({ documentLoader, signingSuite })
  return { issuerInstance, didDocument }
}

export async function getSigningMaterial({ method, seed, url }) {
  let did, key
  if (method === 'web') {
    did = await didWebDriver.generate({ seed, url })
    key = did.methodFor({ purpose: 'assertionMethod' })
  } else {
    const verificationKeyPair = await Ed25519VerificationKey2020.generate({
      seed
    })
    did = await didKeyDriver.fromKeyPair({ verificationKeyPair })
    const assertionMethod = did.methodFor({ purpose: 'assertionMethod' })
    key = await Ed25519VerificationKey2020.from({
      type: assertionMethod.type,
      controller: assertionMethod.controller,
      id: assertionMethod.id,
      publicKeyMultibase: assertionMethod.publicKeyMultibase,
      privateKeyMultibase: verificationKeyPair.privateKeyMultibase
    })
  }
  return { didDocument: did.didDocument, key }
}

export class IssuerInstance {
  constructor({ documentLoader, signingSuite }) {
    this.documentLoader = documentLoader
    this.signingSuite = signingSuite
  }
  async issueCredential({ credential, options }) {
    // this library attaches the signature on the original object, so make a copy
    const credCopy = JSON.parse(JSON.stringify(credential))
    try {
      return signVC({
        credential: credCopy,
        suite: this.signingSuite,
        documentLoader: this.documentLoader,
        ...options
      })
    } catch (e) {
      console.error(e)
      throw e
    }
  }
}

export default issue
