const usignedVCv2 = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    'https://w3id.org/security/suites/ed25519-2020/v1'
  ],
  id: 'urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  name: 'DCC Test Credential',
  issuer: {
    type: ['Profile'],
    id: 'did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC',
    name: 'Digital Credentials Consortium Test Issuer',
    url: 'https://dcconsortium.org',
    image:
      'https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png'
  },
  validFrom: '2023-08-02T17:43:32.903Z',
  credentialSubject: {
    type: ['AchievementSubject'],
    achievement: {
      id: 'urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922',
      type: ['Achievement'],
      achievementType: 'Diploma',
      name: 'Badge',
      description:
        'This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.',
      criteria: {
        type: 'Criteria',
        narrative:
          'This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**.'
      },
      image: {
        id: 'https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png',
        type: 'Image'
      }
    },
    name: 'Jane Doe'
  }
}
const unsignedVC = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1'
  ],
  id: 'urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  issuer: {
    id: 'did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC',
    type: 'Profile',
    name: 'Izzy the Issuer',
    description: 'Issue Issue Issue',
    url: 'https://izzy.iz/',
    image: {
      id: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Blank_2018.png',
      type: 'Image'
    }
  },
  issuanceDate: '2020-01-01T00:00:00Z',
  name: 'Introduction to Digital Credentialing',
  credentialSubject: {
    type: 'AchievementSubject',
    identifier: {
      type: 'IdentityObject',
      identityHash: 'jc.chartrand@gmail.com',
      hashed: 'false'
    },
    achievement: {
      id: 'http://izzy.iz',
      type: 'Achievement',
      criteria: {
        narrative: 'Completion of a credential.'
      },
      description: 'Well done you!',
      name: 'Introduction to Digital Credentialing'
    }
  }
}

// "credentialStatus":
const credentialStatus = {
  id: 'https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4#16',
  type: 'StatusList2021Entry',
  statusPurpose: 'revocation',
  statusListIndex: 16,
  statusListCredential:
    'https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4'
}

const credentialStatusBitString = {
  id: 'https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4#16',
  type: 'BitstringStatusListEntry',
  statusPurpose: 'revocation',
  statusListIndex: 16,
  statusListCredential:
    'https://digitalcredentials.github.io/credential-status-jc-test/XA5AAK1PV4'
}

const getUnsignedVC = () => JSON.parse(JSON.stringify(unsignedVC))

const getUnsignedVCv2 = () => JSON.parse(JSON.stringify(usignedVCv2))

const getUnsignedVCWithoutSuiteContext = () => {
  const vcCopy = JSON.parse(JSON.stringify(unsignedVC))
  const index = vcCopy['@context'].indexOf(ed25519_2020suiteContext)
  if (index > -1) {
    vcCopy['@context'].splice(index, 1)
  }
  return vcCopy
}
const getCredentialStatus = () => JSON.parse(JSON.stringify(credentialStatus))
const getCredentialStatusBitString = () =>
  JSON.parse(JSON.stringify(credentialStatusBitString))

const getUnsignedVCWithStatus = () => {
  const unsignedVCWithStatus = getUnsignedVC()
  unsignedVCWithStatus.credentialStatus = getCredentialStatus()
  return unsignedVCWithStatus
}

const getUnsignedVC2WithStatus = () => {
  const unsignedVC2WithStatus = getUnsignedVCv2()
  unsignedVC2WithStatus.credentialStatus = getCredentialStatusBitString()
  return unsignedVC2WithStatus
}

const ed25519_2020suiteContext =
  'https://w3id.org/security/suites/ed25519-2020/v1'

export {
  getUnsignedVC,
  getUnsignedVCWithoutSuiteContext,
  getCredentialStatus,
  getCredentialStatusBitString,
  getUnsignedVCWithStatus,
  getUnsignedVC2WithStatus,
  ed25519_2020suiteContext
}
