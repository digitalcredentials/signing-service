# Digital Credentials Consortium Verifiable Credentials Signing Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/signing-service/main.yml?branch=main)](https://github.com/digitalcredentials/signing-service/actions?query=workflow%3A%22Node.js+CI%22)

## Table of Contents

- [Summary](#summary)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Tenants](#tenants)
  - [Signing Key](#signing-key)
  - [DID Registries](#did-registries)
  - [did:key](#did-key)
  - [did:web](#did-web)
  - [Revocation](#revocation)
- [Usage](#usage)
  - [Sign a credential](#sign-a-credential)
  - [Learner Credential Wallet](#learner-credential-wallet)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

Use this express server to sign [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/).

Implements one http endpoint:

 * [POST /credentials/sign]

The service is meant to be called as a RESTful service from any software wanting to sign a credential, and in particular is thusly used by the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator) from within a Docker Compose network.

You may also want to take a look at the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator), as it provides both signing and status revocation as a single combined service. It also describes a model for composing DCC services within a Docker Compose network.

## Quick Start

You can try this signing-service in about three minutes:

1. Install Docker, which is made very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

2. From a terminal prompt, run:

``` 
docker run -dp 3000:4008 digitalcredentials/status-service
```

You can now issue test credentials as explained in the [Sign a Credential](#sign-a-credential) section.

IMPORTANT: this quick start version uses an ephemeral signing key that only lasts for as long as the process runs. To use this in production you'll have to generate your own signing. To do so, read on...

## Configuration

### Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | http port on which to run the express app | 4007 | no |
| `ENABLE_HTTPS_FOR_DEV` | runs the dev server over https - ONLY FOR DEV - typically to allow CORS calls from a browser | false | no |
| `TENANT_SEED_{TENANT_NAME}` | see [tenants](#tenants) section for instructions | no | no |

### Tenants

You might want to allow more than one signing key/DID to be used with the issuer. For example, you might want to sign university/college degree diplomas with a DID that is only used by the registrar, but then also allow certificates for individual courses to be signed by by different DIDS that are owned by the faculty or department that teaches the course.

We're calling these differents signing authorities 'tenants'.  You can set up as many tenants as you like by including a `TENANT_SEED_{TENANT_NAME}` environment variable for every 'tenant'.

So, if you wanted to set up two tenants, one for degrees and one for completion of the Econ101 course, and you wanted to secure the degrees tenant but not the Econ101, then you could create the tenants by setting the following in the .env file:

```
TENANT_SEED_DEGREES=z1AoLPRWHSKasPH1unbY1A6ZFF2Pdzzp7D2CkpK6YYYdKTN
TENANT_SEED_ECON101=Z1genK82erz1AoLPRWHSKZFF2Pdzzp7D2CkpK6YYYdKTNat
```

The tenant names can then be specified in the issuing invocation like so:

```
http://myhost.org/instance/degrees/credentials/issue
http://myhost.org/instance/econ101/credentials/issue
```

### Signing key

The issuer is by default configured with a signing key that can only be used for testing and evaluation. The key is randomly generated when you start the application and only lasts for the life of the process.

To issue your own credentials you must generate your own signing key and keep it private.  We've tried to make that a little easier, and provide a convenience endpoint in the issuer that you can use to generate a brand new key.  You can hit the endpoint with the following CURL command:

`curl --location 'http://localhost:4007/seedgen'`

This will return a json document with:

- a seed
- the corresponding DID
- the corresponding DID Document

The returned result will look something like this:

```
{
	"seed": "z1AjQUBZCNoiyPUC8zbbF29gLdZtHRqT6yPdFGtqJa5VfQ6",
	"did": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4",
	"didDocument": {
		"@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/suites/ed25519-2020/v1", "https://w3id.org/security/suites/x25519-2020/v1"],
		"id": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4",
		"verificationMethod": [{
			"id": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4",
			"type": "Ed25519VerificationKey2020",
			"controller": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4",
			"publicKeyMultibase": "z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4"
		}],
		"authentication": ["did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4"],
		"assertionMethod": ["did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4"],
		"capabilityDelegation": ["did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4"],
		"capabilityInvocation": ["did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4"],
		"keyAgreement": [{
			"id": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4#z6LSnYW9e4Q4EXTvdjDhKyr2D1ghBfSLa5dJGBfzjG6hyPEt",
			"type": "X25519KeyAgreementKey2020",
			"controller": "did:key:z6MkweTn1XVAiFfHjiH48oLknjNqRs43ayzguc8G8VbEAVm4",
			"publicKeyMultibase": "z6LSnYW9e4Q4EXTvdjDhKyr2D1ghBfSLa5dJGBfzjG6hyPEt"
		}]
	}
}
```

Copy the seed value and add it as described in the [Tenant](#tenants) section above, basically like so:

`TENANT_SEED_{tenant name here}=seed`

For example,

`TENANT_SEED_CHEMISTRY101=z1AjQUBZCNoiyPUC8zbbF29gLdZtHRqT6yPdFGtqJa5VfQ6`

The did:key is meant to be shared with others either directly by giving it to them or by publishing it in a public registry for use by verifiers.  So about registries... 

### DID Registries

So that a verifier knows that a credential was signed by a key that is really owned by the claimed issuer, the key (encoded as a DID) has to be confirmed as really belonging to that issuer.  This is typically done by adding the DID to a well known registry that the verifier checks when verifying a credential.

The DCC provides a number of registries that work with the verifiers in the Learner Credential Wallet and in the online web based [Verifier Plus](https://verifierplus.org).  The DCC registries use Github for storage.  To request that your DID be added to a registry, submit a pull request in which you've added your [DID](https://www.w3.org/TR/did-core/) to the registry file.

### did:key

For the moment, the issuer is set up to use the did:key implemenation of a DID which is one of the simpler implementations and doesn't require that the DID document be hosted anywhere.

### did:web

The did:web implementation is likely where most implementations will end up, and so you'll eventually want to move to becuase it allows you to rotate (change) your signing keys whithout having to update every document that points at the old keys.  We'll provide did:web support in time, but if you need it now just let us know.

## Usage

This express app can be run a few different ways:

#### NPM

You can start the script using NPM, like is done with the `start` script in package.json

#### Directly from DockerHub

You can directly from the DockerHub image, using a default configuration, with:

  `docker run -dp 3000:4006 digitalcredentials/signing-service`

  or by passing in a reference to your .env file, to set your own configuration:

``docker run --env-file .env -dp 3000:4006 digitalcredentials/signing-service`

#### With Docker Compose

See how we do that in the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Sign a credential

Try it out with this CURL command, which you simply paste into the terminal:

```
curl --location 'http://localhost:3000/instance/test/credentials/issue' \
--header 'Content-Type: application/json' \
--data-raw '{ 
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
  ],
  "id": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1", 
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential"
  ],
  "issuer": {
    "id": "the issuer code will set this as the issuing DID", 
    "type": "Profile",
    "name": "DCC Test Issuer",
    "description": "A test DID used to issue test credentials",
    "url": "https://digitalcredentials.mit.edu",
    "image": {
	    "id": "https://certificates.cs50.io/static/success.jpg",
	    "type": "Image"
	  }	
  },
  "issuanceDate": "2020-01-01T00:00:00Z", 
  "expirationDate": "2025-01-01T00:00:00Z",
  "name": "Successful Installation",
  "credentialSubject": {
      "type": "AchievementSubject",
     "name": "Me!",
     "achievement": {
      	"id": "http://digitalcredentials.mit.edu",
      	"type": "Achievement",
      	"criteria": {
        	"narrative": "Successfully installed the DCC issuer."
      	},
      	"description": "DCC congratulates you on your successful installation of the DCC Issuer.", 
      	"name": "Successful Installation",
      	"image": {
	    	"id": "https://certificates.cs50.io/static/success.jpg",
	    	"type": "Image"
	  	}
      }
  	}
}'
```

This should return a fully formed and signed credential printed to the terminal, that should look something like this (it will be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):


```
{
	"@context": ["https://www.w3.org/2018/credentials/v1", "https://purl.imsglobal.org/spec/ob/v3p0/context.json", "https://w3id.org/vc/status-list/2021/v1", "https://w3id.org/security/suites/ed25519-2020/v1"],
	"id": "urn:uuid:951b475e-b795-43bc-ba8f-a2d01efd2eb1",
	"type": ["VerifiableCredential", "OpenBadgeCredential"],
	"issuer": {
		"id": "did:key:z6Mkf2rgv7ef8FmLJ5Py87LMa7nofQgv6AstdkgsXiiCUJEy",
		"type": "Profile",
		"name": "DCC Test Issuer",
		"description": "A test DID used to issue test credentials",
		"url": "https://digitalcredentials.mit.edu",
		"image": {
			"id": "https://certificates.cs50.io/static/success.jpg",
			"type": "Image"
		}
	},
	"issuanceDate": "2020-01-01T00:00:00Z",
	"expirationDate": "2025-01-01T00:00:00Z",
	"name": "Successful Installation",
	"credentialSubject": {
		"type": "AchievementSubject",
		"name": "Me!",
		"achievement": {
			"id": "http://digitalcredentials.mit.edu",
			"type": "Achievement",
			"criteria": {
				"narrative": "Successfully installed the DCC issuer."
			},
			"description": "DCC congratulates you on your successful installation of the DCC Issuer.",
			"name": "Successful Installation",
			"image": {
				"id": "https://certificates.cs50.io/static/success.jpg",
				"type": "Image"
			}
		}
	},
	"proof": {
		"type": "Ed25519Signature2020",
		"created": "2023-05-19T14:47:25Z",
		"verificationMethod": "did:key:z6Mkf2rgv7ef8FmLJ5Py87LMa7nofQgv6AstdkgsXiiCUJEy#z6Mkf2rgv7ef8FmLJ5Py87LMa7nofQgv6AstdkgsXiiCUJEy",
		"proofPurpose": "assertionMethod",
		"proofValue": "zviQazCEMihts4e6BrhxkEu5VbCPFqTFLY5qBkiRztf3eq1vXYXUCQrTL6ohxmMrsAPEJpB9WGbN1NH5DsSDHsCU"
	}
}
```

NOTE: CURL can get a bit clunky if you want to experiment, so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it very easy to construct and send http calls.


### Learner Credential Wallet

You might now consider importing your new credential into the [Learner Credential Wallet](https://lcw.app) to see how credentials can be managed and shared from an app based wallet.  Simply copy the verifiable credential you just generated and paste it into the text box on the 'add credential' screen of the wallet.
In the easy start section we used default settings, but you will want to set your own values for things like signing key.  You'll set those in a .env file that is passed into the docker-run command:

```
docker run --env-file .env -dp 3000:4007 digitalcredentials/issuer 
```

## Revocation

The signing-service doesn't on its own provide a revocation mechanism. To enable revocation, you'll want to combine the signing-service with a revocation system like the [DCC status-service](https://github.com/digitalcredentials/status-service), but we've already done exactly that with the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

## Development

### Installation

Clone code then cd into directory and:

```
npm install
npm run dev
```

If for whatever reason you need to run the server over https, you can set the `ENABLE_HTTPS_FOR_DEV` environment variable to true.  Note, though, that this should ONLY be used for development.

### Testing

Testing uses supertest, jest, and nock to test the endpoints.  To run tests:

```npm run test```

Because the revocation (status) system uses github to store status, calls are made out to github during issuance.  Rather than have to make these calls for every test, and possibly in cases where outgoing http calls aren't ideal, we've used [nock](https://github.com/nock/nock) to mock out the http calls to the github api, so that the actual calls needn't be made - nock instead returns our precanned replies.  Creating mocks can be time consuming, though, so we've also opted to use the recording feature of nock which allows us to run the tests in 'record' mode which will make the real calls out to Github, and record the results so they can be used for future calls.

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2023 Digital Credentials Consortium.
