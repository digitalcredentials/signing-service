import { Ed25519Signature2020 } from '@digitalcredentials/ed25519-signature-2020';
import { driver } from '@digitalcredentials/did-method-key';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { IssuerInstance } from '@digitalcredentials/issuer-core'
import { getTenantSeed } from "./config.js";
import { getStatusManager } from './status.js';
import { getConfig } from './config.js';

const { enableStatusAllocation } = getConfig();

const ISSUER_INSTANCES = {};
const documentLoader = securityLoader().build()

const buildIssuerInstance = async (seed) => {
    const didKeyDriver = driver();
    const { didDocument, methodFor } = await didKeyDriver.generate({ seed });
    const issuerDid = didDocument.id
    const signingKeyPair = methodFor({ purpose: 'assertionMethod' });
    const signingSuite = new Ed25519Signature2020({ key: signingKeyPair });
    const issuerInstance = new IssuerInstance({ documentLoader, signingSuite })
    return { issuerInstance, didDocument };
}

const getIssuerInstance = async (instanceId) => {
    if (!ISSUER_INSTANCES[instanceId]) {
        const didSeed = await getTenantSeed(instanceId)
        ISSUER_INSTANCES[instanceId] = await buildIssuerInstance(didSeed)
    }
    return ISSUER_INSTANCES[instanceId]
}

const issue = async (unsignedVerifiableCredential, issuerId, options) => {
    const { issuerInstance, didDocument } = await getIssuerInstance(issuerId)
    unsignedVerifiableCredential.issuer.id = didDocument.id
    let credential
    if (unsignedVerifiableCredential.credentialStatus || ! enableStatusAllocation ) {
        credential = unsignedVerifiableCredential;
    } else {
        const statusManager = getStatusManager()
        credential = await statusManager.allocateStatus(unsignedVerifiableCredential)
    }
    const signedCredential = await issuerInstance.issueCredential({ credential })
    return signedCredential
}

export default issue