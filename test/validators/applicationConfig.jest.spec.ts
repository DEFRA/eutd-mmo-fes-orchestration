import ApplicationConfig from "../../src/applicationConfig";
import logger from "../../src/logger";

describe("ApplicationConfig", () => {
  let mockErrorLogger;

  beforeAll(() => {
    ApplicationConfig.loadProperties();
    ApplicationConfig._referenceServiceHost = "http://localhost:9000";
    ApplicationConfig.eventHubNamespace = "insights-application-logs";
    ApplicationConfig._refServiceBasicAuthUser = 'REF-SERVICE-BASIC-AUTH-USER';
    ApplicationConfig._identityAppUrl = 'http://fesidp';
    ApplicationConfig._fesApiMasterPassword = 'foobar';
  });

  beforeEach(() => {
    mockErrorLogger = jest.spyOn(logger, 'error');
  });

  afterEach(()=>{
    mockErrorLogger.mockRestore();
  });

  it("getReferenceServiceUrl() should return parsed URL", () => {
    expect(ApplicationConfig.getReferenceServiceUrl()).toContain('REF-SERVICE-BASIC-AUTH-USER');
  });

  it("getEventHubNamespace() should return eventHubNamespace", () => {
    const expectedEventHubNamespace = "insights-application-logs";
    expect(ApplicationConfig.getEventHubNamespace()).toBe(
      expectedEventHubNamespace
    );
  });

  it("getEventHubConnectionString() should return eventHubConnectionString", () => {
    const expectedEventHubConnectionString =
      "Endpoint=sb://sndmmosocens001.servicebus.windows.net/;SharedAccessKeyName=QRADAR_APP;SharedAccessKey=Kowc1RMzOG4L3U/AcFswmxIvS1susT6LD9WqUT8kCwA=;EntityPath=insights-application-logs";
    expect(ApplicationConfig.getEventHubConnectionString()).toBe(
      expectedEventHubConnectionString
    );
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

  describe('maximum favourites per user', () => {

    it('should return correct maximum favourites per user', () => {
      ApplicationConfig.loadProperties();

      expect(ApplicationConfig._maximumFavouritesPerUser).toBe(50);
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

});
