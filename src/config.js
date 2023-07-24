import { generateSecretKeySeed, decodeSecretKeySeed } from '@digitalcredentials/bnid';

let CONFIG;
const defaultPort = 4006
const testSeed = "z1AeiPT496wWmo9BG2QYXeTusgFSZPNG3T9wNeTtjrQ3rCB"
const testTenantName = "test"
const DID_SEEDS = {};

export function setConfig() {
  CONFIG = parseConfig();
}

async function parseTenantSeeds() {
  const allEnvVars = process.env;
  const didSeedKeys = Object.getOwnPropertyNames(allEnvVars)
    .filter(key => key.toUpperCase().startsWith('TENANT_SEED_')) 
  for(const key of didSeedKeys) {
    let value = allEnvVars[key]
    if (value === 'generate') {
      value = await generateSecretKeySeed(); 
    } 
    const tenantName = key.slice(12).toLowerCase()
    DID_SEEDS[tenantName] = await decodeSeed(value)
  }
  // add in the default test key
  DID_SEEDS[testTenantName] = await decodeSeed(testSeed)
}

function parseConfig() {
  const env = process.env
  const config = Object.freeze({
    enableHttpsForDev: env.ENABLE_HTTPS_FOR_DEV?.toLowerCase() === 'true',
    port: env.PORT ? parseInt(env.PORT) : defaultPort,
  });
  return config
}

export function getConfig() {
  if (!CONFIG) {
     setConfig()
  }
  return CONFIG;
}

export function resetConfig() {
  CONFIG = null;
}

export async function getTenantSeed(tenantName) {
  if (! Object.keys(DID_SEEDS).length) {
    await parseTenantSeeds()
  }
  if (DID_SEEDS.hasOwnProperty(tenantName)) {
    return DID_SEEDS[tenantName];
  } else {
    return null
  }
}


const decodeSeed = async (secretKeySeed) => {
    let secretKeySeedBytes // Uint8Array;
    if (secretKeySeed.startsWith('z')) {
        // This is a multibase-decoded key seed, like those generated by @digitalcredentials/did-cli
        secretKeySeedBytes = decodeSecretKeySeed({ secretKeySeed });
    } else if (secretKeySeed.length >= 32) {
        secretKeySeedBytes = (new TextEncoder()).encode(secretKeySeed).slice(0, 32);
    } else {
        throw TypeError('"secretKeySeed" must be at least 32 bytes, preferably multibase-encoded.');
    }
    return secretKeySeedBytes;
}