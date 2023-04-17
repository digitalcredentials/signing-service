
 

import { getStatusManager } from './status.js';

// retrieves status list manager
export async function getCredentialStatusManager(req, res, next) {
  try {
    req.statusManager = await getStatusManager();
    next();
  } catch (error) {
    return res.send('Failed to retrieve credential status list manager');
  }
}

// extracts access token from request header
function extractAccessToken(headers) {
  if (!headers.authorization) {
    return;
  }
  const [scheme, token] = headers.authorization.split(' ');
  if (scheme === 'Bearer') {
    return token;
  }
}

// verifies whether issuer has access to status repo
export async function verifyStatusRepoAccess(req, res, next) {
  const { headers } = req;
  // verify that access token was included in request
  const accessToken = extractAccessToken(headers);
  if (!accessToken) {
    return res.send('Failed to provide access token in request');
  }
  // check if issuer has access to status repo
  const hasAccess = await req.statusManager.hasStatusAuthority(accessToken);
  if (!hasAccess) {
    return res.send('Issuer is unauthorized to access status repo');
  }
  next();
}
