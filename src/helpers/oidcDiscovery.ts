import axios from 'axios';

interface OpenIdConfiguration {
  issuer: string;
  jwks_uri: string;
}

interface DiscoveryCacheEntry {
  issuer: string;
  jwksUri: string;
  expiresAtMs: number;
}

export interface OidcIssuerMetadata {
  issuer: string;
  jwksUri: string;
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

export const getOidcIssuerMetadata = async (
  issuer: string,
  cacheTtlMs = DEFAULT_DISCOVERY_CACHE_TTL_MS,
): Promise<OidcIssuerMetadata> => {
  const normalizedIssuer = normalizeIssuer(issuer);
  const cachedValue = discoveryCache.get(normalizedIssuer);

  if (cachedValue && cachedValue.expiresAtMs > Date.now()) {
    return { issuer: cachedValue.issuer, jwksUri: cachedValue.jwksUri };
  }

  const configUrl = getOpenIdConfigurationUrl(normalizedIssuer);
  const response = await axios.get<OpenIdConfiguration>(configUrl, { timeout: 5000 });
  const discoveredIssuer = response?.data?.issuer;
  const jwksUri = response?.data?.jwks_uri;

  if (!jwksUri) {
    throw new Error(`OIDC discovery did not return jwks_uri for issuer: ${normalizedIssuer}`);
  }
  if (!discoveredIssuer) {
    throw new Error(`OIDC discovery did not return issuer for issuer: ${normalizedIssuer}`);
  }

  discoveryCache.set(normalizedIssuer, {
    issuer: discoveredIssuer,
    jwksUri,
    expiresAtMs: Date.now() + cacheTtlMs,
  });

  return { issuer: discoveredIssuer, jwksUri };
};

export const getJwksUriForIssuer = async (
  issuer: string,
  cacheTtlMs = DEFAULT_DISCOVERY_CACHE_TTL_MS,
): Promise<string> => {
  const metadata = await getOidcIssuerMetadata(issuer, cacheTtlMs);
  return metadata.jwksUri;
};
