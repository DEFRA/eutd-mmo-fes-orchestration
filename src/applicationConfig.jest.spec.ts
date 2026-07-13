import ApplicationConfig from './applicationConfig';

describe('applicationConfig.getReferenceServiceUrl', () => {
  const originalHost = ApplicationConfig._referenceServiceHost;
  const originalUser = ApplicationConfig._refServiceBasicAuthUser;
  const originalPassword = ApplicationConfig._refServiceBasicAuthPassword;

  afterEach(() => {
    ApplicationConfig._referenceServiceHost = originalHost;
    ApplicationConfig._refServiceBasicAuthUser = originalUser;
    ApplicationConfig._refServiceBasicAuthPassword = originalPassword;
  });

  it('returns empty string when host is not set', () => {
    ApplicationConfig._referenceServiceHost = undefined as any;

    const url = ApplicationConfig.getReferenceServiceUrl();

    expect(url).toBe('');
  });

  it('uses URL parser and strips trailing slashes', () => {
    ApplicationConfig._referenceServiceHost = 'https://reference.service.local///';
    ApplicationConfig._refServiceBasicAuthUser = 'user';
    ApplicationConfig._refServiceBasicAuthPassword = 'pass';

    const url = ApplicationConfig.getReferenceServiceUrl();

    expect(url).toBe('https://user:pass@reference.service.local');
  });

  it('falls back to raw host trimming when host is not an absolute URL', () => {
    ApplicationConfig._referenceServiceHost = 'reference-service///';
    ApplicationConfig._refServiceBasicAuthUser = 'ignored';
    ApplicationConfig._refServiceBasicAuthPassword = 'ignored';

    const url = ApplicationConfig.getReferenceServiceUrl();

    expect(url).toBe('reference-service');
  });
});
