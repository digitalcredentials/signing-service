import { createStatusListManager } from '@digitalcredentials/status-list-manager-git';
import { getConfig } from './config';
import { DidMethod } from './types';

const { credStatusClientDidSeed,
    credStatusClientType,
    credStatusClientAccessToken,
    credStatusRepoName,
    credStatusMetaRepoName,
    credStatusRepoOrgName,
    credStatusRepoVisibility } = getConfig();

let STATUS_LIST_MANAGER = null;

// creates or retrieves status list manager
export async function getStatusListManager() {
    if (!STATUS_LIST_MANAGER) {
      STATUS_LIST_MANAGER = await createStatusListManager({
          clientType: credStatusClientType,
          repoName: credStatusRepoName,
          metaRepoName: credStatusMetaRepoName,
          repoOrgName: credStatusRepoOrgName,
          repoVisibility: credStatusRepoVisibility,
          accessToken: credStatusClientAccessToken,
          didMethod: DidMethod.Key,
          didSeed: credStatusClientDidSeed,
          signUserCredential: false,
          signStatusCredential: true
      });
    }
    return STATUS_LIST_MANAGER;
}
