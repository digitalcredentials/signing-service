# Digital Credentials Consortium Verifiable Credentials Signing Service

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/signing-service/main.yml?branch=main)](https://github.com/digitalcredentials/signing-service/actions?query=workflow%3A%22Node.js+CI%22)

IMPORTANT NOTE ABOUT VERSIONING: If you are using a Docker Hub image of this repository, make sure you are reading the version of this README that corresponds to your Docker Hub version. If, for example, you are using the image `digitalcredentials/status-service-db:0.1.0` then you'll want to use the corresponding tagged repo: [https://github.com/digitalcredentials/status-service-db/tree/v0.1.0](https://github.com/digitalcredentials/status-service-db/tree/v0.1.0). If you are new here, then just read on...

## Table of Contents

- [Summary](#summary)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Tenants](#tenants)
  - [Signing Key](#signing-key)
    - [did:key generator](#didkey-generator)
    - [did:web generator](#didweb-generator)
    - [Random tenant key](#random-tenant-key)
  - [did:key](#didkey)
  - [did:web](#didweb)
  - [DID Registries](#did-registries)
- [Usage](#usage)
  - [Sign a credential](#sign-a-credential)
  - [Learner Credential Wallet](#learner-credential-wallet)
  - [Revocation and Suspension](#revocation-and-suspension)
- [Versioning](#versioning)
- [Logging](#logging)
- [Development](#development)
  - [Installation](#installation)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)

## Summary

Use this express server to sign [Verifiable Credentials](https://www.w3.org/TR/vc-data-model-2.0/).

Implements three HTTP endpoints:

 * `POST /instance/:instanceId/credentials/sign`

This endpoint signs and returns a [Verifiable Credential](https://www.w3.org/TR/vc-data-model-2.0/) that has been posted to it.

 * `GET /did-key-generator`

This is a convenience endpoint for generating a new signing key, encoded as a [Decentralized Identifier (DID)](https://www.w3.org/TR/did-core/) and specifically using the [did:key method](https://w3c-ccg.github.io/did-method-key/). Read about how to use it in the [did:key generator section](#didkey-generator).

* `POST /did-web-generator`

This is a convenience endpoint for generating a new signing key, encoded as a [Decentralized Identifier (DID)](https://www.w3.org/TR/did-core/), specifically using the [did:web method](https://w3c-ccg.github.io/did-method-web/). Read about how to use it in the [did:web generator section](#didweb-generator).

The signing endpoint is meant to be called as a RESTful service from any software wanting to sign a credential, and in particular is so used by the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator) and the  [DCC workflow-coordinator](https://github.com/digitalcredentials/worfklow-coordinator) from within a Docker Compose network.

This service supports multiple signing keys ([DIDs](https://www.w3.org/TR/did-core/)), identified by the `:instanceId` in the signing endpoint's path. An `instance` is analagous to a `tenant`.

You may also want to take a look at the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator), as it provides bearer token security over tenant endpoints, and combines both signing and status updates (e.g., revocation and suspension) as a single service. It also describes a model for composing DCC services within a Docker Compose network.

## Quick Start

You can try this signing-service in about three minutes:

1. Install Docker, which is made very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

2. From a terminal prompt, run:

```bash
docker run -dp 4006:4006 digitalcredentials/signing-service:0.3.0
```

You can now issue test credentials as explained in the [Sign a Credential](#sign-a-credential) section.

IMPORTANT: this quick start version uses a test signing key that is not registered as belonging to an actual issuer. To use this in production you'll have to generate your own signing key, and register it publicly. To do so, read on...

## Configuration

### Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | HTTP port on which to run the express app | 4006 | no |
| `ENABLE_HTTPS_FOR_DEV` | runs the dev server over HTTPS - ONLY FOR DEV - typically to allow CORS calls from a browser | false | no |
| `TENANT_SEED_{TENANT_NAME}` | see [tenants](#tenants) section for instructions | no | no |
|`TENANT_DID_METHOD_{TENANT_NAME}` | did method (`key` or `web`) to use for signing on this tenant | `key` | no |
| `TENANT_DID_URL_{TENANT_NAME}` | url to use for did:web | | no |
| `ERROR_LOG_FILE` | log file for all errors - see [Logging](#logging) | no | no |
| `ALL_LOG_FILE` | log file for everything - see [Logging](#logging) | no | no |
| `CONSOLE_LOG_LEVEL` | console log level - see [Logging](#logging) | silly | no |
| `LOG_LEVEL` | log level for application - see [Logging](#logging) | silly | no |

### Tenants

You might want to allow more than one signing key ([DID](https://www.w3.org/TR/did-core/)) to be used with the issuer. For example, you might want to sign university/college degree diplomas with a key ([DID](https://www.w3.org/TR/did-core/)) that is only used by the registrar, but then also allow certificates for individual courses to be signed by by different keys ([DIDs](https://www.w3.org/TR/did-core/)) that are owned by the faculty or department that teaches the course.

We're calling these differents signing authorities 'tenants' (or 'instances').  You can set up as many tenants as you like by including a `TENANT_SEED_{TENANT_NAME}={seed}` environment variable for every 'tenant'. (NOTE: if you are using a did:web key, you must additinally specify `TENANT_DID_METHOD_{TENANT_NAME}=web` and `TENANT_DID_URL_{TENANT_NAME}={the url for your did:web}`) for each did:web tenant. Read more in the [did:web generator section](#didweb-generator).

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

Note that these are all unsecured calls. You can choose to implement security as best suits your needs. For one example of a bearer token approach, take a look at the [DCC Issuer Coordinator](https://github.com/digitalcredentials/issuer-coordinator).

#### Default Tenants

There are two tenants setup by default:

 * instance/test/credentials/issue
 * instance/random/credentials/issue

The `test` tenant uses this seed and corresponding [DID](https://www.w3.org/TR/did-core/):

 * seed - `z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB`
 * did - `did:key:z6MknNQD1WHLGGraFi6zcbGevuAgkVfdyCdtZnQTGWVVvR5Q`

That [DID](https://www.w3.org/TR/did-core/) for the `test` tenant is currently registered in the [DCC Sandbox Registry](https://github.com/digitalcredentials/sandbox-registry) so that any credentials generated with that tenant will, when verified, show as having originated from the DCC test issuer.

See the [Sign a credential](#sign-a-credential) section for a working cURL example of how to sign with the `test` tenant.

The `random` tenant generates a random signing key every time the server is started. This is strictly meant for testing and experimenting. For production use, you must generate your own signing keys.

Read on to generate your signing keys...

### Signing key

The issuer is by default configured with a signing key that can only be used for testing and evaluation.

To issue your own credentials you must generate your own signing key and keep it private.  We've tried to make that a little easier by providing two convenience endpoints in the issuer that you can use to generate a brand new key.  One generates a new [did:key](https://w3c-ccg.github.io/did-method-key/) and the other a new [did:web](https://w3c-ccg.github.io/did-method-web/). 

#### did:key generator

You can generate a new did:key by hitting the convenience endpoint with the following cURL command:

```bash
curl --location 'http://localhost:4006/did-key-generator'
```

This will return a json document with:

- a seed
- the corresponding [DID](https://www.w3.org/TR/did-core/)
- the corresponding [DID](https://www.w3.org/TR/did-core/) Document

The returned result will look something like this:

<details> 
<summary>Show output</summary>
  
```json
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
</details>

The two important properties for our purposes are the `seed` and the `did`.

Copy the `seed` value and add it as described in the [Tenant](#tenants) section above, basically like so:

`TENANT_SEED_{tenant name here}=seed`

For example,

`TENANT_SEED_CHEMISTRY101=z1AjQUBZCNoiyPUC8zbbF29gLdZtHRqT6yPdFGtqJa5VfQ6`

The signing-service uses the seed to deterministically generate the signing key.

The `did` value is meant to be shared with others, typically by publishing it in a public registry for use by verifiers.  Read about registries in the [registries section](#did-registries).

#### did:web generator

Setting up a did:web is a bit more complicated because - unlike a did:key - a did `document` has to be publicly available and in particular for a did:web, must be hosted at a public url.

So you can generate a did:web document using our other convenience endpoint:

`POST /did-web-generator`

In this case you'll need to POST a JSON document to the endpoint. Here is a cURL command that will do exactly that, assuming you are running the `signing-service` on localhost with the default port of 4006:

```bash
curl --location 'localhost:4006/did-web-generator' \
--header 'Content-Type: application/json' \
--data-raw '{
  "url": "https://raw.githubusercontent.com/jchartrand/didWebTest/main"
}'
```

The value of 'url' property should be the url at which you will host your `did:web` document.
For the url above, the document will actually need to be hosted at the following URL:

`https://raw.githubusercontent.com/jchartrand/didWebTest/main/.well-known/did.json`

But, when generating the did, leave off the '.well-known/did.json' part. That bit is assumed, according to the `did:web` specification.

This cURL command will return a document like the following:

<details> 
<summary>Show output</summary>

```json
{
    "seed": "z1AcNXDnko1P6QMiZ3bxsraNvVtRbpXKeE8GNLDXjBJ5UHz",
    "decodedSeed": {
        "0": 89,
        "1": 128,
        "2": 252,
        "3": 66,
        "4": 213,
        "5": 112,
        "6": 253,
        "7": 4,
        "8": 191,
        "9": 207,
        "10": 205,
        "11": 80,
        "12": 127,
        "13": 53,
        "14": 58,
        "15": 35,
        "16": 154,
        "17": 249,
        "18": 38,
        "19": 97,
        "20": 31,
        "21": 129,
        "22": 54,
        "23": 213,
        "24": 196,
        "25": 25,
        "26": 214,
        "27": 6,
        "28": 217,
        "29": 134,
        "30": 93,
        "31": 21
    },
    "did": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main",
    "didDocument": {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
            "https://w3id.org/security/suites/x25519-2020/v1"
        ],
        "id": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main",
        "assertionMethod": [
            {
                "id": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main#z6MkfGZKFTyxiH9HgFUHbPQigEWh8PtFaRkESt9oQLiTvhVq",
                "type": "Ed25519VerificationKey2020",
                "controller": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main",
                "publicKeyMultibase": "z6MkfGZKFTyxiH9HgFUHbPQigEWh8PtFaRkESt9oQLiTvhVq"
            }
        ]
    }
}
```
</details>

Again, as with a did:key, you'll need to set the `seed` and the `did` as described in the previous section.

You will additionally need to copy the value of the `didDocument` property, i.e., from the example above:

```json
{
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1",
            "https://w3id.org/security/suites/x25519-2020/v1"
        ],
        "id": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main",
        "assertionMethod": [
            {
                "id": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main#z6MkfGZKFTyxiH9HgFUHbPQigEWh8PtFaRkESt9oQLiTvhVq",
                "type": "Ed25519VerificationKey2020",
                "controller": "did:web:raw.githubusercontent.com:jchartrand:didWebTest:main",
                "publicKeyMultibase": "z6MkfGZKFTyxiH9HgFUHbPQigEWh8PtFaRkESt9oQLiTvhVq"
            }
        ]
    }
```

and save that in a file called `did.json` at the URL where you'll host the document. For our example, this would be the following:

`https://raw.githubusercontent.com/jchartrand/didWebTest/main/.well-known/did.json`

You must also set `TENANT_DID_METHOD_{TENANT_NAME}=web` and set `TENANT_DID_URL_{TENANT_NAME}` to the URL where your `.well-known/did.json` did-document is hosted, which for this example would be:

`https://raw.githubusercontent.com/jchartrand/didWebTest/main`

#### Random tenant key

There is also an option to set the seed value for a tenant to `generate`. The system will generate a random did:key for any tenants so configured. This is really only useful for testing and experimenting since the keys are lost on restart, and the associated [DID](https://www.w3.org/TR/did-core/) for each is not registered in any public registry.

### did:key

The issuer is by default set up to use the `did:key` implemenation of a [DID](https://www.w3.org/TR/did-core/) which is one of the simpler implementations and doesn't require that the [DID](https://www.w3.org/TR/did-core/) document be hosted anywhere.

### did:web

The `did:web` implementation is preferable for production becuase it allows you to rotate (change) your signing keys whithout having to update every document that points at the old keys.

To use it set `TENANT_DID_METHOD_{TENANT_NAME}=web` and set `TENANT_DID_URL_{TENANT_NAME}` to the url where your `.well-known/did.json` DID document is hosted.

### DID Registries

So that a verifier knows that a credential was signed by a key that is really owned by the claimed issuer, the key (encoded as a [DID](https://www.w3.org/TR/did-core/)) has to be confirmed as really belonging to that issuer.  This is typically done by adding the DID to a well known registry that the verifier checks when verifying a credential.

The DCC provides a number of registries that work with the verifiers in the Learner Credential Wallet and in the online web based [Verifier Plus](https://verifierplus.org). The DCC registries use Github for storage. To request that your [DID](https://www.w3.org/TR/did-core/) be added to a registry, submit a pull request in which you've added your [DID](https://www.w3.org/TR/did-core/) to the registry file.

## Usage

This express app can be run a few different ways:

#### NPM

You can start the script using NPM, like is done with the `start` script in package.json

#### Directly from DockerHub

You can directly from the DockerHub image, using a default configuration, with:

```bash
docker run -dp 4006:4006 digitalcredentials/signing-service:0.1.0
```

To run it with your own configuration (like with your own signing keys):

```bash
docker run --env-file .env -dp 4006:4006 digitalcredentials/signing-service:0.1.0
```

where the `.env` file contains your environment variables. See [.env.example](./.env.example).

#### With Docker Compose

See how we do that in the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator)

Note that to run this with Docker, you'll of course need to install Docker, which is very easy with the [Docker installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/).

### Sign a credential

Try it out with this cURL command, which you simply paste into the terminal (once you've got your issuer running on your computer, as described above):

<details> 
<summary>Show command</summary>
  
```bash
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
</details>

This should return a fully formed and signed credential printed to the terminal, that should look something like this (it may be all smushed up, but you can format it in something like [json lint](https://jsonlint.com):

<details> 
<summary>Show output</summary>
  
```json
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
</details>

NOTE: cURL can get a bit clunky if you want to experiment, so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it very easy to construct and send HTTP calls.

### Learner Credential Wallet

You might now consider importing your new credential into the [Learner Credential Wallet](https://lcw.app) to see how credentials can be managed and shared from an app based wallet. Simply copy the verifiable credential you just generated and paste it into the text box on the `Add credential` screen of the wallet.

### Revocation and Suspension

The `signing-service` doesn't on its own provide a status update (e.g., revocation and suspension) mechanism. To enable this feature, you'll want to combine the `signing-service` with a status service, like one of DCC's status services ([database implementation](https://github.com/digitalcredentials/status-service-db); [Git implementation](https://github.com/digitalcredentials/status-service-git)), but we've already done exactly that with the [DCC issuer-coordinator](https://github.com/digitalcredentials/issuer-coordinator).

## Versioning

The `signing-service` is primarily intended to run as a Docker image within a Docker Compose network, typically as part of a flow that is orchestrated by the [DCC Issuer Coordinator](https://github.com/digitalcredentials/issuer-coordinator) and the [DCC Workflow Coordinator](https://github.com/digitalcredentials/workflow-coordinator).

For convenience we've published the images for the `signing-service` and the other services used by the coordinators, as well as for the coordinators themselves, to Docker Hub so that you don't have to build them locally yourself from the GitHub repositories.

The images on Docker Hub will of course at times be updated to add new functionality and fix bugs. Rather than overwrite the default (`latest`) version on Docker Hub for each update, we've adopted the [Semantic Versioning Guidelines](https://semver.org) with our Docker image tags.

We DO NOT provide a `latest` tag so you must provide a tag name (i.e, the version number) for the images in your Docker Compose file.

To ensure you've got compatible versions of the services and the coordinator, the `major` number for each should match. At the time of writing, the versions for each are at 0.1.0, and the `major` number (the leftmost number) agrees across all three.

If you do ever want to work from the source code in the repository and build your own images, we've tagged the commits in GitHub that were used to build the corresponding Docker image. So a GitHub tag of v0.1.0 coresponds to a Docker image tag of 0.1.0

## Logging

We support the following log levels:

```
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
```

Logging is configured with environment variables, as defined in the [Environment Variables](#environment-variables) section.

By default, everything is logged to the console (log level `silly`).

You may set the log level for the application as a whole. For example:

```
LOG_LEVEL=http
```

Which would only log messages with severity `http` and all below it (`info`, `warn`, `error`).

The default is to log everything (level `silly`).

You can also set the log level for console logging. For example:

```
CONSOLE_LOG_LEVEL=debug
```

This would log everything for severity `debug` and lower (i.e., `verbose`, `http`, `info`, `warn`, `error`). This of course assumes that you've set the log level for the application as a whole to at least the same level.

The default log level for the console is `silly`, which logs everything.

There are also two log files that can be enabled:

- errors (only logs errors)
- all (logs everything - all log levels)

Enable each log by setting an environment variable for each, indicating the path to the appropriate file, like this example:

```
ERROR_LOG_FILE=logs/error.log
ALL_LOG_FILE=logs/all.log
```

If you don't set the path, the log is disabled.

## Development

### Installation

Clone code then cd into directory and:

```bash
npm install
npm run dev
```

If for whatever reason you need to run the server over https, you can set the `ENABLE_HTTPS_FOR_DEV` environment variable to true.  Note, though, that this should ONLY be used for development.

### Testing

Testing uses `supertest`, `mocha`, and `nock` to test the endpoints. To run tests:

```bash
npm run test
```

Note that when testing we don't actually want to make live HTTP calls to the services, so we've used Nock to intercept the HTTP calls and return precanned data.

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2023 Digital Credentials Consortium.
