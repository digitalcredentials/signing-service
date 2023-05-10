import { createStatusManager } from '@digitalcredentials/status-list-manager-git';
import { getConfig } from './config.js';

const {
    credStatusRepoName,
    credStatusMetaRepoName,
    credStatusRepoOrgName,
    credStatusAccessToken,
    credStatusDidSeed
} = getConfig();

let STATUS_LIST_MANAGER;

export async function initializeStatusManager() {
    if (!STATUS_LIST_MANAGER) {
        STATUS_LIST_MANAGER = await createStatusManager({
            service: 'github',
            repoName: credStatusRepoName,
            metaRepoName: credStatusMetaRepoName,
            ownerAccountName: credStatusRepoOrgName,
            repoAccessToken: credStatusAccessToken,
            metaRepoAccessToken: credStatusAccessToken,
            didMethod: 'key',
            didSeed: credStatusDidSeed,
            signUserCredential: false,
            signStatusCredential: true
        });
      }
}

export function getStatusManager() {
    return STATUS_LIST_MANAGER;
}
