import { createStatusManager } from '@digitalcredentials/status-list-manager-git';
import { getConfig } from './config.js';
import { DidMethod } from './types.js';

const {
  credStatusService,
  credStatusRepoName,
  credStatusMetaRepoName,
  credStatusRepoOrgName,
  credStatusRepoVisibility,
  credStatusAccessToken,
  credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER = null;

// creates or retrieves status list manager
export async function getStatusManager() {
  if (!STATUS_LIST_MANAGER) {
    STATUS_LIST_MANAGER = await createStatusManager({
      service: credStatusService,
      repoName: credStatusRepoName,
      metaRepoName: credStatusMetaRepoName,
      repoOrgName: credStatusRepoOrgName,
      repoVisibility: credStatusRepoVisibility,
      accessToken: credStatusAccessToken,
      didMethod: DidMethod.Key,
      didSeed: credStatusDidSeed,
      signUserCredential: false,
      signStatusCredential: true
    });
  }
  return STATUS_LIST_MANAGER;
}
