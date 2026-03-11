import Server from '../src/server';
import * as appInsights from 'applicationinsights';
import applicationConfig from '../src/applicationConfig';
import * as dotEnv from 'dotenv';
import { SessionStoreFactory } from '../src/session_store/factory'
import { MongoConnection } from '../src/persistence/mongo';
import Router from '../src/router';
import * as Jwt from 'jsonwebtoken';

// mock dotenv
jest.mock('dotenv');
// mock app insights
jest.mock('applicationinsights', () => ({
  defaultClient: {
    context: {
      tags: {},
      keys: {},
    }
  },
  setup: jest.fn().mockReturnThis(),
  setAutoDependencyCorrelation: jest.fn().mockReturnThis(),
  setAutoCollectRequests: jest.fn().mockReturnThis(),
  setAutoCollectPerformance: jest.fn().mockReturnThis(),
  setAutoCollectExceptions: jest.fn().mockReturnThis(),
  setAutoCollectDependencies: jest.fn().mockReturnThis(),
  setAutoCollectConsole: jest.fn().mockReturnThis(),
  setUseDiskRetryCaching: jest.fn().mockReturnThis(),
  start: jest.fn()
}));
// mock mongoose to avoid DB connection attempts
jest.mock('./persistence/mongo');
// mock app config
jest.mock('./applicationConfig', () => ({
  default: {
    _redisHostName: 'http://127.0.0.1',
    _redisTlsHostName: 'https://127.0.0.1',
    _redisPort: 6666,
    _redisPassword: 'r3dis',
    _redisTlsEnabled: 'true',
    _dbConnectionUri: 'localhost/mongodb',
    _dbName: 'fesdb',
    _dbConnectionPool: 'mongopool',
    _instrumentationKey: '',
    _disableAuth: false,
    _maxLimitLandings: 5,
    getAuthSecret: jest.fn().mockReturnValue('one-two-three-four-five-six-seven'),
    getAuthIssuer: jest.fn().mockReturnValue('http://fesidp'),
  }
}));
// mock session factory
jest.mock('./session_store/factory')
// mock router to avoid loading real routes
jest.mock('./router', () => ({
  default: class {
    static loadRoutes = jest.fn()
  }
}));

const jwtAuthToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vZmVzaWRwIn0.Zw4gsU7iLdqoG5YDmDgi5ZgigoiKyf0gVWCwwfqPfSc';
const basicAuthPwd = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.DbIiSTokTcEin2zVtyl9amBEVur4sf0LeJgHsXbUlNc';

describe('Server', () => {

  describe('start()', () => {
    afterEach(async () => {
      await Server.stop();
    })

    it('should start app insights telemetry when an instrumentation key is present', async () => {
      applicationConfig._instrumentationKey = 'abcde'
      await Server.start();
      expect(appInsights.start).toHaveBeenCalledTimes(1);
      applicationConfig._instrumentationKey = '';
    });

    it('should not attempt to start app insights telemetry when no instrumentation key is present', async () => {
      await Server.start();
      expect(appInsights.start).not.toHaveBeenCalled();
    });

    it('should load config from environment', async () => {
      await Server.start();
      expect(dotEnv.config).toHaveBeenCalledTimes(1);
    });

    it('should configure Redis session store from config', async () => {
      await Server.start();
      expect(SessionStoreFactory.getSessionStore).toHaveBeenCalledWith({
        host: 'http://127.0.0.1',
        port: 6666,
        password: 'r3dis',
        tls: {
          host: 'https://127.0.0.1',
        }
      })
    });

    it('should connect to MongoDB instance using config', async () => {
      await Server.start();
      expect(MongoConnection.connect).toHaveBeenCalledWith(
        'localhost/mongodb',
        'fesdb',
        'mongopool',
      )
    });

    it('should load routes', async () => {
      await Server.start();
      expect(Router.loadRoutes).toHaveBeenCalledWith(Server.instance());
    });
  });

  describe('inject()', () => {

    const createRoute = (path: string = '/', withAuth: boolean = true): any => ({
      method: 'GET',
      path,
      options: {
        auth: withAuth ? { strategies: ['fesApi', 'jwt'] } : false,
        handler: () => 'success'
      }
    })

    beforeEach(async () => {
      await Server.start();
      Server.instance().route([
        createRoute('/private'), // protected endpoint
        createRoute('/public', false) // public endpoint
      ])
    });

    afterEach(async () => {
      await Server.stop();
      jest.restoreAllMocks();
    });

    describe('Basic auth', () => {

      it('should complete the request if valid Authorization header is present for a protected API', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Basic ${Buffer.from(`fes:${basicAuthPwd}`).toString('base64')}`,
          }
        });
        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
        expect(res.result).toBe('success');
      });

      it('should fail the request if Authorization header is not valid for a protected API', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: 'Basic blah',
          }
        });
        expect(res.statusCode).toBe(400); // should probably be a 401
        expect(res.statusMessage).toBe('Bad Request');
      });

      it('should ignore username when performing Basic auth', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Basic ${Buffer.from(`user:${basicAuthPwd}`).toString('base64')}`,
          }
        });
        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
      });

      it('should not authorize the request if the auth password does not match', async () => {
        (applicationConfig as jest.Mocked<typeof applicationConfig>)
          .getAuthSecret
          .mockReturnValueOnce('abc@123');
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Basic ${Buffer.from(`user:${basicAuthPwd}`).toString('base64')}`,
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should not authorize the request if the username is blank', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Basic ${Buffer.from(`:${basicAuthPwd}`).toString('base64')}`,
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });
    });

    describe('JWT auth', () => {

      it('should be the default strategy', () => {
        expect(Server.instance().auth.settings.default.strategies).toEqual(['jwt']);
      });

      it('should complete the request if Authorization header is missing for an unprotected API', async () => {
        const res = await Server.inject({
          url: '/public'
        });
        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
        expect(res.result).toBe('success');
      });

      it('should complete the request if valid Authorization header is present for a protected API', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });
        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
        expect(res.result).toBe('success');
      });

      it('should complete the request for Admin users with unknown issuer', async () => {
        const jwtDecodeMock = jest.spyOn(Jwt, 'decode');
        jwtDecodeMock.mockReturnValue({
          payload: {
            iss: 'http://adminidp',
            roles: ["MMO-ECC-Service-Management"]
          }
        });
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });
        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
        expect(res.result).toBe('success');
      });

      it('should not authorize the request if Authorization header is missing', async () => {
        const res = await Server.inject({
          url: '/private'
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should not authorize the request if Authorization header is not valid', async () => {
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: 'xxx'
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should not authorize the request if JWT issuer is unknown', async () => {
        (applicationConfig as jest.Mocked<typeof applicationConfig>).getAuthIssuer
          .mockReturnValueOnce('http://fesidp2');
        // match first issuer
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should not authorize the request if JWT issuer is unknown and non-Admin user', async () => {
        const jwtDecodeMock = jest.spyOn(Jwt, 'decode');
        jwtDecodeMock.mockReturnValue({
          payload: {
            iss: 'http://fesidpfake'
          }
        });
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should not authorize the request if auth issuer is not configured', async () => {
        (applicationConfig as jest.Mocked<typeof applicationConfig>).getAuthIssuer
          .mockReturnValueOnce('');
        // match first issuer
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });
        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });
    })
  });
});