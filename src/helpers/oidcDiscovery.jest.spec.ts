import axios from 'axios';
import { clearOidcDiscoveryCache, getJwksUriForIssuer, getOidcIssuerMetadata } from './oidcDiscovery';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

type DiscoveryResponse = Awaited<ReturnType<typeof axios.get>>;

const discoveryResponse = (data?: { jwks_uri?: string; issuer?: string }): DiscoveryResponse =>
  ({ data } as DiscoveryResponse);

describe('oidcDiscovery', () => {
  const issuer = 'https://example.com/tenant';
  const jwksUri = 'https://example.com/tenant/keys';
  const discoveredIssuer = 'https://example.com/real-issuer';

  beforeEach(() => {
    jest.clearAllMocks();
    clearOidcDiscoveryCache();
  });

  describe('getOidcIssuerMetadata', () => {
    it('should fetch and return the issuer and jwks_uri from OIDC discovery', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      const result = await getOidcIssuerMetadata(issuer);

      expect(result).toEqual({ issuer: discoveredIssuer, jwksUri });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${issuer}/.well-known/openid-configuration`,
        { timeout: 5000 },
      );
    });

    it('should return the cached metadata without calling axios again while the cache is fresh', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getOidcIssuerMetadata(issuer);
      const result = await getOidcIssuerMetadata(issuer);

      expect(result).toEqual({ issuer: discoveredIssuer, jwksUri });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch once the cache entry has expired', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getOidcIssuerMetadata(issuer, 10);

      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11);
      await getOidcIssuerMetadata(issuer, 10);
      nowSpy.mockRestore();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw when the discovery response has no issuer', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ jwks_uri: jwksUri }));

      await expect(getOidcIssuerMetadata(issuer)).rejects.toThrow(
        `OIDC discovery did not return issuer for issuer: ${issuer}`,
      );
    });

    it('should throw when the discovery response has no jwks_uri', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer }));

      await expect(getOidcIssuerMetadata(issuer)).rejects.toThrow(
        `OIDC discovery did not return jwks_uri for issuer: ${issuer}`,
      );
    });
  });

  describe('getJwksUriForIssuer', () => {
    it('should fetch and return the jwks_uri from OIDC discovery', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      const result = await getJwksUriForIssuer(issuer);

      expect(result).toBe(jwksUri);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${issuer}/.well-known/openid-configuration`,
        { timeout: 5000 },
      );
    });

    it('should strip one or more trailing slashes from the issuer before building the discovery URL', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getJwksUriForIssuer(`${issuer}///`);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${issuer}/.well-known/openid-configuration`,
        { timeout: 5000 },
      );
    });

    it('should handle an issuer consisting only of slashes', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getJwksUriForIssuer('///');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/.well-known/openid-configuration',
        { timeout: 5000 },
      );
    });

    it('should return the cached jwks_uri without calling axios again while the cache is fresh', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getJwksUriForIssuer(issuer);
      const result = await getJwksUriForIssuer(issuer);

      expect(result).toBe(jwksUri);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch once the cache entry has expired', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getJwksUriForIssuer(issuer, 10);

      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 11);
      await getJwksUriForIssuer(issuer, 10);
      nowSpy.mockRestore();

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should throw when the discovery response itself is missing', async () => {
      mockedAxios.get.mockResolvedValue(undefined as unknown as DiscoveryResponse);

      await expect(getJwksUriForIssuer(issuer)).rejects.toThrow(
        `OIDC discovery did not return jwks_uri for issuer: ${issuer}`,
      );
    });

    it('should throw when the discovery response has no data', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse(undefined));

      await expect(getJwksUriForIssuer(issuer)).rejects.toThrow(
        `OIDC discovery did not return jwks_uri for issuer: ${issuer}`,
      );
    });

    it('should throw when the discovery response has no jwks_uri', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer }));

      await expect(getJwksUriForIssuer(issuer)).rejects.toThrow(
        `OIDC discovery did not return jwks_uri for issuer: ${issuer}`,
      );
    });

    it('should throw when the discovery response has no issuer', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ jwks_uri: jwksUri }));

      await expect(getJwksUriForIssuer(issuer)).rejects.toThrow(
        `OIDC discovery did not return issuer for issuer: ${issuer}`,
      );
    });

    it('should propagate errors from the discovery request', async () => {
      mockedAxios.get.mockRejectedValue(new Error('network error'));

      await expect(getJwksUriForIssuer(issuer)).rejects.toThrow('network error');
    });
  });

  describe('clearOidcDiscoveryCache', () => {
    it('should clear cached entries so the next lookup re-fetches', async () => {
      mockedAxios.get.mockResolvedValue(discoveryResponse({ issuer: discoveredIssuer, jwks_uri: jwksUri }));

      await getJwksUriForIssuer(issuer);
      clearOidcDiscoveryCache();
      await getJwksUriForIssuer(issuer);

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});
