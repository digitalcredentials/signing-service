import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020'
import { Ed25519VerificationKey2020 } from '@digitalcredentials/ed25519-verification-key-2020'
import { CryptoLD } from 'crypto-ld'
import { driver as keyDriver } from '@digitalcredentials/did-method-key'
import { driver as webDriver } from '@interop/did-web-resolver'
import { securityLoader } from '@digitalcredentials/security-document-loader'
import { IssuerInstance } from '@digitalcredentials/issuer-instance'
import { getTenantSeed } from './config.js'
import SigningException from './SigningException.js'

let ISSUER_INSTANCES = {}
const documentLoader = securityLoader().build()

const cryptoLd = new CryptoLD()
cryptoLd.use(Ed25519VerificationKey2020)

/* FOR TESTING */
export const clearIssuerInstances = () => {
  ISSUER_INSTANCES = {}
}

const buildIssuerInstance = async (seed, method, url) => {
  const didDriver = method === 'web' ? webDriver({ cryptoLd }) : keyDriver()
  const { didDocument, methodFor } = await didDriver.generate({
    seed,
    ...(url ? { url } : null)
  })
  // const issuerDid = didDocument.id
  const signingKeyPair = methodFor({ purpose: 'assertionMethod' })
  const signingSuite = new Ed25519Signature2020({ key: signingKeyPair })
  const issuerInstance = new IssuerInstance({ documentLoader, signingSuite })
  return { issuerInstance, didDocument }
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

const issue = async (unsignedVerifiableCredential, issuerId) => {
  const { issuerInstance, didDocument } = await getIssuerInstance(issuerId)
  unsignedVerifiableCredential.issuer.id = didDocument.id
  const signedCredential = await issuerInstance.issueCredential({
    credential: unsignedVerifiableCredential
  })
  return signedCredential
}

export default issue
