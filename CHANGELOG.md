# signing-service Changelog

## 1.0.0 - 2024-10-09

### Changed
- updating semver to reflect breaking change
- updated all libs to digitalcredentials to make use of fine grained logging
- **BREAKING**: The libs that were updated now require that the top level id on a verifiable credential must be a uri. Any old (or new) clients calling the endpoints on this service with a vc that doesn't have a uri id will fail.
- new libs support both VC1 and VC2 as well as bistring status list

## 0.4.0 - 2024-09-01
### Changed
- switch all libs to most recent versions of digitalbazaar, rather than digitalcredentials
- fix incompatabilities with newer digitalbazaar libs
- move IssuerInstance class directly into this repo from former npm package
- update tests to include VC2 and bistring status list
- add healthcheck.js for use with docker HEALTHCHECK

## 0.3.0 - 2024-04-22
### Changed
- add healthz endpoint for use with docker HEALTHCHECK
- update README
- update .dockerignore
- update Dockerfile with multistage production build
- removed unused status package
- update issuer-core import to instead use issuer-instance from npm
- added CHANGELOG

For previous history, see Git commits.