# Digital Credentials Consortium Verifiable Credentials Signing Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/signing-service/main.yml?branch=main)](https://github.com/digitalcredentials/signing-service/actions?query=workflow%3A%22Node.js+CI%22)

## Table of Contents

- [Summary](#summary)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Tenants](#tenants)
  - [Signing Key](#signing-key)
  - [DID Registries](#did-registries)
  - [did:key](#didkey)
  - [did:web](#didweb)
  - [Revocation](#revocation)
- [Usage](#usage)
  - [Sign a credential](#sign-a-credential)
  - [Learner Credential Wallet](#learner-credential-wallet)
- [Versioning](#versioning)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

Use this express server to sign [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/).

Implements two http endpoints:

 * POST /instance/:instanceId/credentials/sign

Which signs and returns a verifiable credential that has been posted to it.
   
 * GET /seedgen

Which is a convenience method for generating a new signing key.
  
The service is meant to be called as a RESTful service from any software wanting to sign a credential, and in particular is so used by the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator) and the  [DCC workflow-coordinator](https://github.com/digitalcredentials/worfklow-coordinator) from within a Docker Compose network.

The service supports multiple signing keys, identified by the `:instanceId` in the endpoint path. An `instance` is analagous to a `tenant`.

You may also want to take a look at the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator), as it provides bearer token security over tenant endpoints, and combines both signing and status revocation as a single service. It also describes a model for composing DCC services within a Docker Compose network.

## Quick Start

You can try this signing-service in about three minutes:

1. Install Docker, which is made very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

2. From a terminal prompt, run:

``` 
docker run -dp 4006:4006 digitalcredentials/signing-service:0.1.0
```

You can now issue test credentials as explained in the [Sign a Credential](#sign-a-credential) section.

IMPORTANT: this quick start version uses a test signing key that is not registered as belonging to an actual issuer. To use this in production you'll have to generate your own signing key, and register it publicly. To do so, read on...

## Configuration

### Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | http port on which to run the express app | 4006 | no |
| `ENABLE_HTTPS_FOR_DEV` | runs the dev server over https - ONLY FOR DEV - typically to allow CORS calls from a browser | false | no |
| `TENANT_SEED_{TENANT_NAME}` | see [tenants](#tenants) section for instructions | no | no |

### Tenants

You might want to allow more than one signing key/DID to be used with the issuer. For example, you might want to sign university/college degree diplomas with a DID that is only used by the registrar, but then also allow certificates for individual courses to be signed by by different DIDS that are owned by the faculty or department that teaches the course.

We're calling these differents signing authorities 'tenants'.  You can set up as many tenants as you like by including a `TENANT_SEED_{TENANT_NAME}={seed}` environment variable for every 'tenant'.

NOTE: the `seed` is explained below in the [Signing key section](#signing-key).

So, if you wanted to set up two tenants, one for degrees and one for completion of the Econ101 course then you could create the tenants by setting the following in the .env file:

```
TENANT_SEED_DEGREES=z1AoLPRWHSKasPH1unbY1A6ZFF2Pdzzp7D2CkpK6YYYdKTN
TENANT_SEED_ECON101=Z1genK82erz1AoLPRWHSKZFF2Pdzzp7D2CkpK6YYYdKTNat
```

The tenant names can then be specified in the issuing invocation like so:

```
http://myhost.org/instance/degrees/credentials/issue
http://myhost.org/instance/econ101/credentials/issue
```

Note that these are unsecured calls. You can choose to implement security as best suits your needs. For one example, take a look at the [DCC Issuer Coordinator](https://github.com/digitalcredentials/issuer-coordinator) which uses a bearer token.

Read on to generate your seeds...

### Signing key

The issuer is by default configured with a signing key that can only be used for testing and evaluation.

To issue your own credentials you must generate your own signing key and keep it private.  We've tried to make that a little easier, and provide a convenience endpoint in the issuer that you can use to generate a brand new key.  You can hit the endpoint with the following CURL command:

`curl --location 'http://localhost:4006/seedgen'`

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

The two important properties there are the `seed` and the `did`.

Copy the `seed` value and add it as described in the [Tenant](#tenants) section above, basically like so:

`TENANT_SEED_{tenant name here}=seed`

For example,

`TENANT_SEED_CHEMISTRY101=z1AjQUBZCNoiyPUC8zbbF29gLdZtHRqT6yPdFGtqJa5VfQ6`

The signing-service uses the seed to deterministically generate the signing key.

The did:key is meant to be shared with others, typically by publishing it in a public registry for use by verifiers.  So about registries... 

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

  `docker run -dp 4006:4006 digitalcredentials/signing-service:0.1.0`

To run it with your own configuration (like with your own signing keys):

``docker run --env-file .env -dp 4006:4006 digitalcredentials/signing-service:0.1.0`

where the `.env` file contains your environment variables. See [.env.example](./.env.example).

#### With Docker Compose

See how we do that in the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Sign a credential

Try it out with this CURL command, which you simply paste into the terminal (once you've got your issuer running on your computer, as described above):

```
curl --location 'http://localhost:4006/instance/test/credentials/sign' \
--header 'Content-Type: application/json' \
--data-raw '{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json"
  ],
  "id": "urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c",
  "type": [
    "VerifiableCredential",
    "OpenBadgeCredential"
  ],
  "name": "DCC Test Credential",
  "issuer": {
    "type": [
      "Profile"
    ],
    "id": "did:key:z6MkhVTX9BF3NGYX6cc7jWpbNnR7cAjH8LUffabZP8Qu4ysC",
    "name": "Digital Credentials Consortium Test Issuer",
    "url": "https://dcconsortium.org",
    "image": "https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png"
  },
  "issuanceDate": "2023-08-02T17:43:32.903Z",
  "credentialSubject": {
    "type": [
      "AchievementSubject"
    ],
    "achievement": {
      "id": "urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922",
      "type": [
        "Achievement"
      ],
      "achievementType": "Diploma",
      "name": "Badge",
      "description": "This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.",
      "criteria": {
        "type": "Criteria",
        "narrative": "This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**."
      },
      "image": {
        "id": "https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png",
        "type": "Image"
      }
    },
    "name": "Jane Doe"
  }
}'
```

This should return a fully formed and signed credential printed to the terminal, that should look something like this (it may be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):


```
{
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json",
        "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    "id": "urn:uuid:2fe53dc9-b2ec-4939-9b2c-0d00f6663b6c",
    "type": [
        "VerifiableCredential",
        "OpenBadgeCredential"
    ],
    "name": "DCC Test Credential",
    "issuer": {
        "type": [
            "Profile"
        ],
        "id": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
        "name": "Digital Credentials Consortium Test Issuer",
        "url": "https://dcconsortium.org",
        "image": "https://user-images.githubusercontent.com/752326/230469660-8f80d264-eccf-4edd-8e50-ea634d407778.png"
    },
    "issuanceDate": "2023-08-02T17:43:32.903Z",
    "credentialSubject": {
        "type": [
            "AchievementSubject"
        ],
        "achievement": {
            "id": "urn:uuid:bd6d9316-f7ae-4073-a1e5-2f7f5bd22922",
            "type": [
                "Achievement"
            ],
            "achievementType": "Diploma",
            "name": "Badge",
            "description": "This is a sample credential issued by the Digital Credentials Consortium to demonstrate the functionality of Verifiable Credentials for wallets and verifiers.",
            "criteria": {
                "type": "Criteria",
                "narrative": "This credential was issued to a student that demonstrated proficiency in the Python programming language that occurred from **February 17, 2023** to **June 12, 2023**."
            },
            "image": {
                "id": "https://user-images.githubusercontent.com/752326/214947713-15826a3a-b5ac-4fba-8d4a-884b60cb7157.png",
                "type": "Image"
            }
        },
        "name": "Jane Doe"
    },
    "proof": {
        "type": "Ed25519Signature2020",
        "created": "2023-10-05T11:17:41Z",
        "verificationMethod": "did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q#z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q",
        "proofPurpose": "assertionMethod",
        "proofValue": "z5fk6gq9upyZvcFvJdRdeL5KmvHr69jxEkyDEd2HyQdyhk9VnDEonNSmrfLAcLEDT9j4gGdCG24WHhojVHPbRsNER"
    }
}
```

NOTE: CURL can get a bit clunky if you want to experiment, so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it very easy to construct and send http calls.


### Learner Credential Wallet

You might now consider importing your new credential into the [Learner Credential Wallet](https://lcw.app) to see how credentials can be managed and shared from an app based wallet.  Simply copy the verifiable credential you just generated and paste it into the text box on the 'add credential' screen of the wallet.

## Revocation

The signing-service doesn't on its own provide a revocation mechanism. To enable revocation, you'll want to combine the signing-service with a revocation system like the [DCC status-service](https://github.com/digitalcredentials/status-service), but we've already done exactly that with the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

## Versioning

The signing-service is primarily intended to run as a docker image within a docker compose network, typically as part of a flow that is orchestrated by the [DCC Issuer Coordinator](https://github.com/digitalcredentials/issuer-coordinator) and the [DCC Workflow Coordinator](https://github.com/digitalcredentials/workflow-coordinator). 

For convenience we've published the images for the signing-service and the other services used by the coordinators, as well as for the coordinators themselves, to Docker Hub so that you don't have to build them locally yourself from the github repositories.

The images on Docker Hub will of course at times be updated to add new functionality and fix bugs. Rather than overwrite the default (`latest`) version on Docker Hub for each update, we've adopted the [Semantic Versioning Guidelines](https://semver.org) with our docker image tags.

We DO NOT provide a `latest` tag so you must provide a tag name (i.e, the version number) for the images in your docker compose file.

To ensure you've got compatible versions of the services and the coordinator, the `major` number for each should match. At the time of writing, the versions for each are at 0.1.0, and the `major` number (the leftmost number) agrees across all three.

If you do ever want to work from the source code in the repository and build your own images, we've tagged the commits in Github that were used to build the corresponding Docker image. So a github tag of v0.1.0 coresponds to a docker image tag of 0.1.0

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
