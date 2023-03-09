
import { Ed25519VerificationKey2020 } from '@digitalbazaar/ed25519-verification-key-2020';
import { Ed25519Signature2020 } from '@digitalbazaar/ed25519-signature-2020';
import { driver } from '@digitalcredentials/did-method-key';
import { securityLoader } from '@digitalcredentials/security-document-loader';
import { issue as sign } from '@digitalbazaar/vc';
import { getConfig, getDIDSeed } from "./config.js";
import { createStatusListManager } from '@digitalcredentials/status-list-manager-git' 

const { credStatusClientDidSeed,
    credStatusClientType,
    credStatusClientAccessToken, 
    credStatusRepoName, 
    credStatusMetaRepoName, 
    credStatusRepoOrgName, 
    credStatusRepoVisibility } = getConfig();

let suite;

const documentLoader = securityLoader().build()

 const credStatusClient = await createStatusListManager({
    clientType: credStatusClientType,
    repoName: credStatusRepoName,
    metaRepoName: credStatusMetaRepoName,
    repoOrgName: credStatusRepoOrgName,
    repoVisibility: credStatusRepoVisibility,
    accessToken: credStatusClientAccessToken,
    didMethod: "key",
    didSeed: credStatusClientDidSeed,    
    //didWebUrl: URL for did:web (required if didMethod = web)
    signUserCredential: false,
    signStatusCredential: true 
}); 


const buildSuite = async () => {
    const seed = await getDIDSeed()
    const didKeyDriver = driver();
    const { didDocument, methodFor } = await didKeyDriver.generate({ seed });
    const assertionMethod = methodFor({ purpose: 'assertionMethod' });
    const key = new Ed25519VerificationKey2020(assertionMethod);
    const suite = new Ed25519Signature2020({ key });
    const signingDID = didDocument.id;
    return { suite, signingDID };
}

const getSuite = async () => {
    if (!suite) {
        suite = await buildSuite()
    }
    return suite
}



const signVerifiableCredential = async (credential, suite) => {
    try {
        const signedVC = await sign({credential,suite,documentLoader});
        return signedVC
    } catch (e) {
        console.log("Error in the signing try block:")
        console.log(e)
    }
}


// MAYBE RETURN THE QRCODE TOO?  SO RETURN AN OBJECT CONTAINING THE VC, THE QR, MAYBE EVEN A LINK TO VERIFIERPLUS (IF REQUESTD)
// COULD ALSO RETURN a PDF.
// OH, and want to return the revocation position, or even the revocation url to hit, although this is in the 
// returned VC itself

const issue = async (unsignedVerifiableCredential) => {
    const {suite, signingDID} = await getSuite()
    unsignedVerifiableCredential.issuer.id = signingDID
    const vcWithStatusAllocated = await credStatusClient.allocateStatus(unsignedVerifiableCredential)
    const signedCredential = await signVerifiableCredential(vcWithStatusAllocated, suite)
    return signedCredential
}

export default issue