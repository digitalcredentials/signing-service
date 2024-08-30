import { generateSecretKeySeed } from 'bnid'
import decodeSeed from './utils/decodeSeed.js'
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020'
import { CryptoLD } from 'crypto-ld'

import { driver as keyDriver } from '@digitalbazaar/did-method-key'
import { driver as webDriver } from '@interop/did-web-resolver'
const cryptoLd = new CryptoLD()
cryptoLd.use(Ed25519VerificationKey2020)
const didDriver = webDriver({ cryptoLd })

export default async function generateSeed({ url = false }) {
  const encodedSeed = await generateSecretKeySeed()
  const seed = await decodeSeed(encodedSeed)
  let didDocument
  if (url) {
    ;({ didDocument } = await didDriver.generate({ seed, url }))
  } else {
    const didKeyDriver = keyDriver()
    didKeyDriver.use({
      multibaseMultikeyHeader: 'z6Mk',
      fromMultibase: Ed25519VerificationKey2020.from
    })
    const verificationKeyPair = await Ed25519VerificationKey2020.generate({
      seed
    })
    ;({ didDocument } = await didKeyDriver.fromKeyPair({ verificationKeyPair }))
  }
  const did = didDocument.id
  return { seed: encodedSeed, decodedSeed: seed, did, didDocument }
}
