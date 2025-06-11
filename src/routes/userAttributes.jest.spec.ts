import * as Hapi from '@hapi/hapi';
import * as UserAttributeService from '../persistence/services/userAttributes';
import UserAttributesRoutes from './userAttributes';
import ApplicationConfig from "../applicationConfig";

describe('user attribute routes', () => {

  const server = Hapi.server();

  beforeAll(async () => {
    const routes = await new UserAttributesRoutes();
    await routes.register(server);
    await server.initialize();
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('for a user attributes', () => {
    const request : any = {
      method: 'GET',
      url: '/v1/userAttributes',
      app: {
        claims: {
          sub: 'Bob'
        }
      }
    };

    const userAttributes = {
      userPrincipal: 'Bob',
      attributes: [],
      favourites: {
        products: []
      }
    }

    let mockFindUserAttributes;

    beforeEach(() => {
      mockFindUserAttributes = jest.spyOn(UserAttributeService, 'find');
      mockFindUserAttributes.mockResolvedValue(userAttributes);
    });

    afterEach(() => {
      mockFindUserAttributes.mockRestore();
    });

    it('will return 200', async () => {
      const response = await server.inject(request);

      expect(mockFindUserAttributes).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
    });

    it('will return empty if userattributes is empty', async () => {
      mockFindUserAttributes.mockResolvedValue(null);

      const response = await server.inject(request);

      expect(mockFindUserAttributes).toHaveBeenCalled();
      expect(response.result).toHaveLength(0);
    });

    it('will return privacy accepted if date is after Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2019-02-26T23:54:00Z'
      }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-12-20';

      mockFindUserAttributes.mockResolvedValue(data);

      const response = await server.inject(request);

      expect(response.result).toHaveLength(1)
    });

    it('will return cookies accepted if date is after Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
          name: 'accepts_cookies',
          value: 'yes',
          modifiedAt: '2025-06-10T13:00:00Z'
        }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedCookiePolicy = '2025-06-10T12:00:00Z';

      mockFindUserAttributes.mockResolvedValue(data);

      const response = await server.inject(request);

      expect(response.result).toHaveLength(1)
    });

    it('will return cookies not accepted if date is before Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
          name: 'accepts_cookies',
          value: 'no',
          modifiedAt: '2025-06-10T11:00:00Z'
        }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedCookiePolicy = '2025-06-10T12:00:00Z';

      mockFindUserAttributes.mockResolvedValue(data);

      const response = await server.inject(request);

      expect(response.result).toHaveLength(0)
    });

    it('will return cookies accepted if _lastUpdatedCookiePolicy is empty', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
          name: 'accepts_cookies',
          value: 'yes',
          modifiedAt: '2025-06-10T13:00:00Z'
        }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedCookiePolicy = '';

      mockFindUserAttributes.mockResolvedValue(data);

      const response = await server.inject(request);

      expect(response.result).toHaveLength(1)
    });

    it('will not return privacy accepted if date is before Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2017-02-26T23:54:00Z'
      }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-12-20';
      mockFindUserAttributes.mockResolvedValue(data);
      const response = await server.inject(request);
      expect(response.result).toHaveLength(0)
    });

    it('will return language object even if privacy statement is before last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2017-02-26T23:54:00Z'
      }, {
        name: 'language',
        value: 'en_UK',
        modifiedAt: '2019-02-26T23:54:00Z'
        }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-12-20';
      mockFindUserAttributes.mockResolvedValue(data);
      const response = await server.inject(request);
      expect(response.result).toHaveLength(1)
      expect(response.result?.[0].name).toEqual("language");
    });

    it('will return privacy accepted if date and time is after Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2018-11-20T20:15:00Z'
      }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-11-20T20:14:00Z';

      mockFindUserAttributes.mockResolvedValue(data);

      const response = await server.inject(request);

      expect(response.result).toHaveLength(1)
    });

    it('will not return privacy accepted if date and time is before Last updated date', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2017-02-26T21:14:00Z'
      }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-12-20T13:24:00Z';
      mockFindUserAttributes.mockResolvedValue(data);
      const response = await server.inject(request);
      expect(response.result).toHaveLength(0)
    });

    it('will return language object even if privacy statement is before last updated date and time', async () => {
      const data = {
        userPrincipal: 'Bob',
        attributes: [{
        name: 'privacy_statement',
        value: true,
        modifiedAt: '2017-02-26T19:47:00Z'
      }, {
        name: 'language',
        value: 'en_UK',
        modifiedAt: '2019-04-20T23:54:00Z'
        }],
        favourites: {
          products: []
        }
      }

      ApplicationConfig._lastUpdatedPrivacyStatement = '2018-12-20T13:50:00Z';
      mockFindUserAttributes.mockResolvedValue(data);
      const response = await server.inject(request);
      expect(response.result).toHaveLength(1)
      expect(response.result?.[0].name).toEqual("language");
    });

    it('will throw an 500 error', async () => {
      const e = new Error('an error occurred')
      mockFindUserAttributes.mockRejectedValue(e);
      const response = await server.inject(request);
      expect(response.statusCode).toBe(500);
    });
  });
});