# Digital Credentials Consortium Verifiable Credentials Issuer

[![Build status](https://img.shields.io/github/actions/workflow/status/digitalcredentials/issuer/main.yml?branch=main)](https://github.com/digitalcredentials/issuer/actions?query=workflow%3A%22Node.js+CI%22)


## Table of Contents

- [Summary](#summary)
- [Easy Start](#easy-start)
  - [Learner Credential Wallet](#learner-credential-wallet)
- [Usage](#usage)
  - [Environment Variables](#environment-variables)
  - [Tenants](#tenants)
  - [Signing Key](#signing-key)
  - [DID Registries](#did-registries)
  - [did:key](#did-key)
  - [did:web](#did-web)
  - [Protecting Tenant Endpoints](#protecting-tenant-endpoints)
  - [Revocation](#revocation)
- [Development](#development)
  - [Testing](#testing)
- [Contribute](#contribute)
- [License](#license)


## Summary

Use this server to issue [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) that can optionally include a [revocation status](https://www.w3.org/TR/vc-status-list/) that can in turn later be used to revoke the credential.

Implements two [VC-API](https://w3c-ccg.github.io/vc-api/) http endpoints:

 * [POST /credentials/issue](https://w3c-ccg.github.io/vc-api/#issue-credential)
 * [POST /credentials/status](https://w3c-ccg.github.io/vc-api/#update-status)

## Easy Start

We've tried hard to make this as simple as possible to install and maintain, but also easy to evaluate and understand as you consider whether digital credentials are useful for your project, and whether this issuer would work for you. 

You can run the issuer locally in two simple steps that typically take 4 minutes total:

1.  Install Docker.

Docker have made this very easy, with [installers for Windows, Mac, and Linux](https://docs.docker.com/engine/install/) that make it as easy to install as any other application.

2. Open a terminal and run this command, which will pull down the issuer image from DockerHub and run it for you in Docker:

```
docker run -dp 3000:4007 digitalcredentials/issuer 
```

That's it!

You can now issue cryptographically signed credentials.  Try it out with this CURL command, which you simply paste into the terminal:

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

NOTE: this easy-start version does not allow for revocation. Read on to see how you can configure it for revocation.

NOTE: CURL can get a bit clunky if you want to experiment, so you might consider trying [Postman](https://www.postman.com/downloads/) which makes it very easy to construct and send http calls.

### Learner Credential Wallet

You might now consider importing your new credential into the [Learner Credential Wallet](https://lcw.app) to see how credentials can be managed and shared from an app based wallet.  Simply copy the verifiable credential you just generated and paste it into the text box on the 'add credential' screen of the wallet.

## Usage

Typical use would be to run this in a docker container, and most likely in combination with something like nginx-proxy and acme-companion (for the automated creation, renewal and use of SSL certificates) using docker-compose.  A Docker file and a sample docker-compose file are provided.  The Docker image for this issuer is also published in DockerHub.  As described in the Easy Start section, the DockerHub image can be invoked directly.  

In the easy start section we used default settings, but you will want to set your own values for things like signing key.  You'll set those in a .env file that is passed into the docker-run command:

```
docker run --env-file .env -dp 3000:4007 digitalcredentials/issuer 
```

### Environment Variables

There is a sample .env file provided called .env.example to help you get started with your own .env file. The supported fields:

| Key | Description | Default | Required |
| --- | --- | --- | --- |
| `PORT` | http port on which to run the express app | 4007 | no |
| `ENABLE_HTTPS_FOR_DEV` | runs the dev server over https - ONLY FOR DEV - typically to allow CORS calls from a browser | false | no |
| `ENABLE_STATUS_ALLOCATION` | enables the allocation of a StatusList2021 position.  If true, then the CRED_STATUS_* values must also be set | false | no |
| `CRED_STATUS_OWNER` | name of the owner account (personal or organization) in the source control service that will host the credential status resources | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_REPO_NAME` | name of the credential status repository | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_META_REPO_NAME` | name of the credential status metadata repository | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_ACCESS_TOKEN` | Github access token for the credential status repositories | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `CRED_STATUS_DID_SEED` | seed used to deterministically generate DID | no | yes if ENABLE_STATUS_ALLOCATION is true |
| `TENANT_TOKEN_{TENANT_NAME}` | see [tenants](#tenants) section for instructions | no | at least one must be set |
| `TENANT_SEED_{TENANT_NAME}` | see [tenants](#tenants) section for instructions | no | no |


### Tenants

You might want to allow more than one signing key/DID to be used with the issuer. For example, you might want to sign university/college degree diplomas with a DID that is only used by the registrar, but then also allow certificates for individual courses to be signed by by different DIDS that are owned by the faculty or department that teaches the course.

We're calling these differents signing authorities 'tenants'.  You can set up as many tenants as you like by including a `TENANT_SEED_{TENANT_NAME}` environment variable for every 'tenant', and optionally a `TENANT_TOKEN_{TENANT_NAME}` environment variable for whichever tenants you want to secure with a simple bearer auth token.

So, if you wanted to set up two tenants, one for degrees and one for completion of the Econ101 course, and you wanted to secure the degrees tenant but not the Econ101, then you could create the tenants by setting the following in the .env file:

```
TENANT_SEED_DEGREES=z1AoLPRWHSKasPH1unbY1A6ZFF2Pdzzp7D2CkpK6YYYdKTN
TENANT_SEED_ECON101=Z1genK82erz1AoLPRWHSKZFF2Pdzzp7D2CkpK6YYYdKTNat

TENANT_TOKEN_DEGREE=988DKLAJH93KDSFV
```

The tenant names can then be specified in the issuing invocation like so:

```
http://myhost.org/instance/degrees/credentials/issue
http://myhost.org/instance/econ101/credentials/issue
```

And since you set a token for the degrees tenant, you'll have to include that token in the auth header as a Bearer token.  A curl command to issue on the degrees endpoint would then look like:


```
curl --location 'http://localhost:4007/instance/degrees/credentials/issue' \
--header 'Authorization: Bearer 988DKLAJH93KDSFV' \
--header 'Content-Type: application/json' \
--data-raw '{ 
  VC goes here
}'
```


### Signing key

The issuer is configured with a default signing key that can only be used for testing and evaluation. Any credentials signed with this key are meaningless because anyone else can use it to sign credentials. So could for example create a fake version of one of your credentials which would appear to be properly signed. There would be no way to know that it was fake.

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

## Protecting Tenant Endpoints

The endpoints are open by default.  If you run this locally where only local applications can access the endpoints you could leave them that way.  You may, though, want to expose them more broadly, particularly because the issuer allows for the idea of 'multi-tenancy' which simply means that different signing keys can be made available at different endpoints on the issuer.  This allows for scenarios like signing different course credentials with different keys.  If, though, the endpoints are now exposed, you'll want to secure them.  We suggest a two-pronged approach:

1. IP filtering - only allow set IPs to access the issuer.  Set filtering in your nginx or similar.
2. authentication token - as explained above in [Tenants](#tenants), set a token per tenant in your .env

## Revocation

The issuer provides an optional revocation (or 'status') mechanism that implements the [StatusList2021 specification](https://www.w3.org/TR/vc-status-list/), using Github to store the access list. So to use the list you'll have to create two new github repositories that will be used exclusively to manage the status.  Full details of the implementation are [here](https://github.com/digitalcredentials/status-list-manager-git)

For this MVP implementation of the issuer we've only exposed the github options, but if you would like to use gitlab instead, just let us know and we can expose those options.

Revocation is more fully explained in the StatusList2021 specifivation and the git status repo implemenation but amounts to POSTing an object to the revocation endpoint, like so:

```
{credentialId: '23kdr', credentialStatus: [{type: 'StatusList2021Credential', status: 'revoked'}]}
```

Fundamentally, you are just posting up the id of the credential.

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
