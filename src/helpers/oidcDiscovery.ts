import axios from 'axios';

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
    return cachedValue.jwksUri;
  }

  const configUrl = getOpenIdConfigurationUrl(normalizedIssuer);
  const response = await axios.get<OpenIdConfiguration>(configUrl, { timeout: 5000 });
  const jwksUri = response?.data?.jwks_uri;

  if (!jwksUri) {
    throw new Error(`OIDC discovery did not return jwks_uri for issuer: ${normalizedIssuer}`);
  }

  discoveryCache.set(normalizedIssuer, {
    jwksUri,
    expiresAtMs: Date.now() + cacheTtlMs,
  });

  return jwksUri;
};
