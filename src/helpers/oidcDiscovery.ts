import axios from 'axios';
import logger from '../logger';

interface OpenIdConfiguration {
  jwks_uri: string;
}

interface DiscoveryCacheEntry {
  jwksUri: string;
  expiresAtMs: number;
}

const DEFAULT_DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;

const discoveryCache = new Map<string, DiscoveryCacheEntry>();

const normalizeIssuer = (issuer: string): string => {
  let end = issuer.length;
  while (end > 0 && issuer.charAt(end - 1) === '/') {
    end -= 1;
  }
  return issuer.slice(0, end);
};

const getOpenIdConfigurationUrl = (issuer: string): string =>
  `${normalizeIssuer(issuer)}/.well-known/openid-configuration`;

export const clearOidcDiscoveryCache = (): void => {
  discoveryCache.clear();
};

export const getJwksUriForIssuer = async (
  issuer: string,
  cacheTtlMs = DEFAULT_DISCOVERY_CACHE_TTL_MS,
): Promise<string> => {
  const normalizedIssuer = normalizeIssuer(issuer);
  const cachedValue = discoveryCache.get(normalizedIssuer);

  if (cachedValue && cachedValue.expiresAtMs > Date.now()) {
    // TEMP-DEBUG: verify OIDC cached JWKS uri usage, remove after diagnosing JWT-AUTH 404
    logger.info(`[TEMP-DEBUG][OIDC-DISCOVERY-CACHE-HIT][issuer:${normalizedIssuer}][jwksUri:${cachedValue.jwksUri}]`);
    return cachedValue.jwksUri;
  }

  const configUrl = getOpenIdConfigurationUrl(normalizedIssuer);
  // TEMP-DEBUG: verify OIDC discovery endpoint URL, remove after diagnosing JWT-AUTH 404
  logger.info(`[TEMP-DEBUG][OIDC-DISCOVERY-REQUEST][configUrl:${configUrl}]`);
  const response = await axios.get<OpenIdConfiguration>(configUrl, { timeout: 5000 });
  const jwksUri = response?.data?.jwks_uri;

  if (!jwksUri) {
    throw new Error(`OIDC discovery did not return jwks_uri for issuer: ${normalizedIssuer}`);
  }

  discoveryCache.set(normalizedIssuer, {
    jwksUri,
    expiresAtMs: Date.now() + cacheTtlMs,
  });

  // TEMP-DEBUG: verify discovered JWKS uri value, remove after diagnosing JWT-AUTH 404
  logger.info(`[TEMP-DEBUG][OIDC-DISCOVERY-RESULT][issuer:${normalizedIssuer}][jwksUri:${jwksUri}]`);

  return jwksUri;
};
