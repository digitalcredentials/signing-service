import { generateSecretKeySeed } from 'bnid'
import decodeSeed from './utils/decodeSeed.js'
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020'

import { driver as keyDriver } from '@digitalbazaar/did-method-key'
import { driver as webDriver } from '@digitalbazaar/did-method-web'

export default async function generateSeed({ url = false }) {
  const encodedSeed = await generateSecretKeySeed()
  const seed = await decodeSeed(encodedSeed)
  const didDriver = url ? webDriver() : keyDriver()
  didDriver.use({
    multibaseMultikeyHeader: 'z6Mk',
    fromMultibase: Ed25519VerificationKey2020.from
  })
  const verificationKeyPair = await Ed25519VerificationKey2020.generate({
    seed
  })
  const { didDocument } = await didDriver.fromKeyPair({
    verificationKeyPair,
    ...(url && { url })
  })
  const did = didDocument.id
  return { seed: encodedSeed, decodedSeed: seed, did, didDocument }
}
