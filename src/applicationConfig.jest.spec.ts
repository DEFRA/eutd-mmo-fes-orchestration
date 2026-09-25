import ApplicationConfig from './applicationConfig';
import logger from './logger';

describe('ApplicationConfig', () => {
  let mockErrorLogger: jest.SpyInstance;

  beforeAll(() => {
    ApplicationConfig.loadProperties();
    ApplicationConfig._referenceServiceHost = 'http://localhost:9000';
    ApplicationConfig.eventHubNamespace = 'insights-application-logs';
    ApplicationConfig.eventHubConnectionString = 'Endpoint=sb://fake-namespace.servicebus.windows.net/;SharedAccessKeyName=FAKE_KEY_NAME;SharedAccessKey=ZmFrZS1zaGFyZWQtYWNjZXNzLWtleQ==;EntityPath=fake-entity-path';
    ApplicationConfig._refServiceBasicAuthUser = 'REF-SERVICE-BASIC-AUTH-USER';
    ApplicationConfig._identityAppUrl = 'http://fesidp';
    ApplicationConfig._identityAppAudience = 'b2c-audience';
    ApplicationConfig._identityDefaultPolicy = 'B2C_1A_test_policy';
    ApplicationConfig._aadTenantId = '6f504113-6b64-43f2-ade9-242e05780007';
    ApplicationConfig._aadClientId = 'admin-audience';
    ApplicationConfig._fesApiMasterPassword = 'foobar';
  });

  beforeEach(() => {
    mockErrorLogger = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockErrorLogger.mockRestore();
  });

  it('getReferenceServiceUrl() should return parsed URL', () => {
    expect(ApplicationConfig.getReferenceServiceUrl()).toContain('REF-SERVICE-BASIC-AUTH-USER');
  });

  it('getEventHubNamespace() should return eventHubNamespace', () => {
    const expectedEventHubNamespace = 'insights-application-logs';
    expect(ApplicationConfig.getEventHubNamespace()).toBe(expectedEventHubNamespace);
  });

  it('getEventHubConnectionString() should return eventHubConnectionString', () => {
    const expectedEventHubConnectionString =
      'Endpoint=sb://fake-namespace.servicebus.windows.net/;SharedAccessKeyName=FAKE_KEY_NAME;SharedAccessKey=ZmFrZS1zaGFyZWQtYWNjZXNzLWtleQ==;EntityPath=fake-entity-path';
    expect(ApplicationConfig.getEventHubConnectionString()).toBe(expectedEventHubConnectionString);
  });

  it('should return correct host as localeLowerCase', () => {
    expect(ApplicationConfig.getApplicationHost()).toContain('localhost');
  });

  it('should return auth token issuer', () => {
    expect(ApplicationConfig.getAuthIssuer()).toBe('http://fesidp');
  });

  it('should return auth token secret', () => {
    expect(ApplicationConfig.getAuthSecret()).toBe('foobar');
  });

  it('should return B2C auth audience', () => {
    expect(ApplicationConfig.getB2cAuthAudience()).toBe('b2c-audience');
  });

  it('should return identity default policy', () => {
    process.env.IDENTITY_APP_URL = 'http://fesidp';
    process.env.IDENTITY_APP_AUDIENCE = 'b2c-audience';
    process.env.IDENTITY_DEFAULT_POLICY = 'B2C_1A_test_policy';
    process.env.AAD_TENANTID = '6f504113-6b64-43f2-ade9-242e05780007';
    process.env.AAD_CLIENTID = 'admin-audience';
    ApplicationConfig.loadProperties();

    expect(ApplicationConfig.getIdentityDefaultPolicy()).toBe('B2C_1A_test_policy');
  });

  it('should return admin tenant id', () => {
    expect(ApplicationConfig.getAdminAuthTenantId()).toBe('6f504113-6b64-43f2-ade9-242e05780007');
  });

  it('should return computed admin auth issuer from tenant id', () => {
    expect(ApplicationConfig.getAdminAuthIssuer()).toBe('https://sts.windows.net/6f504113-6b64-43f2-ade9-242e05780007/');
  });

  it('should return computed admin auth discovery issuer from tenant id', () => {
    expect(ApplicationConfig.getAdminAuthDiscoveryIssuer()).toBe('https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007');
  });

  it('should return admin auth audience', () => {
    expect(ApplicationConfig.getAdminAuthAudience()).toBe('admin-audience');
  });

  describe('maximum favourites per user', () => {
    it('should return correct maximum favourites per user', () => {
      ApplicationConfig.loadProperties();
      expect(ApplicationConfig._maximumFavouritesPerUser).toBe(100);
    });

    it('should log an error if maximum favourites per user is not set', () => {
      process.env.MAXIMUM_FAVOURITES_PER_USER = undefined;

      ApplicationConfig.loadProperties();

      expect(mockErrorLogger).toHaveBeenCalledWith('MAXIMUM_FAVOURITES_PER_USER is not set');
      expect(ApplicationConfig._maximumFavouritesPerUser).toBeNaN();
    });

    it('should log an error if maximum favourites per user is not numeric', () => {
      process.env.MAXIMUM_FAVOURITES_PER_USER = 'six';

      ApplicationConfig.loadProperties();

      expect(mockErrorLogger).toHaveBeenCalledWith('MAXIMUM_FAVOURITES_PER_USER is not set');
      expect(ApplicationConfig._maximumFavouritesPerUser).toBeNaN();
    });
  });

  it('should log an error if IDENTITY_DEFAULT_POLICY is not set and auth is enabled', () => {
    process.env.DISABLE_AUTH = 'false';
    process.env.IDENTITY_APP_URL = 'http://fesidp';
    process.env.IDENTITY_APP_AUDIENCE = 'b2c-audience';
    process.env.AAD_TENANTID = '6f504113-6b64-43f2-ade9-242e05780007';
    process.env.AAD_CLIENTID = 'admin-audience';
    delete process.env.IDENTITY_DEFAULT_POLICY;

    ApplicationConfig.loadProperties();

    expect(mockErrorLogger).toHaveBeenCalledWith('IDENTITY_DEFAULT_POLICY is not set');
  });
});
