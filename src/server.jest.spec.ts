import Server from './server';
import * as appInsights from 'applicationinsights';
import applicationConfig from './applicationConfig';
import * as dotEnv from 'dotenv';
import { SessionStoreFactory } from './session_store/factory';
import { MongoConnection } from './persistence/mongo';
import Router from './router';
import * as Jwt from 'jsonwebtoken';
import * as jwksRsa from 'jwks-rsa';
import logger from './logger';
import { getJwksUriForIssuer } from './helpers/oidcDiscovery';
import { generateKeyPairSync } from 'crypto';

jest.mock('dotenv');
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

jest.mock('jwks-rsa', () => ({
  hapiJwt2KeyAsync: jest.fn(),
}));

jest.mock('./helpers/oidcDiscovery', () => ({
  getJwksUriForIssuer: jest.fn(),
}));

jest.mock('./persistence/mongo');

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
    getAuthIssuer: jest.fn().mockReturnValue('https://dcidmtest.b2clogin.com/131a35fb-0000-0000-0000-000000000000/v2.0/'),
    getB2cAuthAudience: jest.fn().mockReturnValue('00c16cdb-1b7a-4d94-a915-21f30370e584'),
    getAdminAuthIssuer: jest.fn().mockReturnValue('https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0'),
    getAdminAuthAudience: jest.fn().mockReturnValue('0c050745-281a-49d6-b184-8e44fb38a9c1'),
  }
}));

jest.mock('./session_store/factory');

jest.mock('./router', () => ({
  default: class {
    static loadRoutes = jest.fn();
  }
}));

const basicAuthPwd = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.DbIiSTokTcEin2zVtyl9amBEVur4sf0LeJgHsXbUlNc';

const b2cIssuer = 'https://dcidmtest.b2clogin.com/131a35fb-0000-0000-0000-000000000000/v2.0/';
const b2cAudience = '00c16cdb-1b7a-4d94-a915-21f30370e584';
const adminIssuer = 'https://login.microsoftonline.com/6f504113-6b64-43f2-ade9-242e05780007/v2.0';
const adminAudience = '0c050745-281a-49d6-b184-8e44fb38a9c1';
const b2cJwksUri = 'https://dcidmtest.b2clogin.com/keys';
const adminJwksUri = 'https://login.microsoftonline.com/tenant/keys';

const b2cKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const adminKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });

const b2cPrivateKey = b2cKeyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });
const b2cPublicKey = b2cKeyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });
const adminPrivateKey = adminKeyPair.privateKey.export({ type: 'pkcs1', format: 'pem' });
const adminPublicKey = adminKeyPair.publicKey.export({ type: 'pkcs1', format: 'pem' });

const createRs256Token = (
  issuer: string,
  audience: string,
  privateKey: Jwt.Secret,
  kid: string,
  options: Jwt.SignOptions = {},
) => Jwt.sign(
  {
    sub: 'user-123',
    contactId: 'contact-456',
    email: 'test@example.com',
    roles: ['MMO-ECC-Service-Management'],
  },
  privateKey,
  {
    algorithm: 'RS256',
    issuer,
    audience,
    expiresIn: '1h',
    header: { kid, alg: 'RS256' },
    ...options,
  },
);

const createNoneToken = (issuer: string, audience: string): string => {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'user-123',
      iss: issuer,
      aud: audience,
      exp: now + 3600,
      iat: now,
    }),
  ).toString('base64url');

  return `${header}.${payload}.`;
};

describe('Server', () => {
  describe('start()', () => {
    afterEach(async () => {
      await Server.stop();
    });

    it('should start app insights telemetry when an instrumentation key is present', async () => {
      applicationConfig._instrumentationKey = 'abcde';
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
      });
    });

    it('should connect to MongoDB instance using config', async () => {
      await Server.start();
      expect(MongoConnection.connect).toHaveBeenCalledWith(
        'localhost/mongodb',
        'fesdb',
        'mongopool',
      );
    });

    it('should load routes', async () => {
      await Server.start();
      expect(Router.loadRoutes).toHaveBeenCalledWith(Server.instance());
    });
  });

  describe('inject()', () => {
    const createRoute = (path = '/', withAuth = true): any => ({
      method: 'GET',
      path,
      options: {
        auth: withAuth ? { strategies: ['fesApi', 'jwt'] } : false,
        handler: () => 'success'
      }
    });

    beforeEach(async () => {
      await Server.start();
      Server.instance().route([
        createRoute('/private'),
        createRoute('/public', false)
      ]);
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
        expect(res.statusCode).toBe(400);
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
      beforeEach(() => {
        (getJwksUriForIssuer as jest.Mock).mockImplementation(async (issuer: string) => {
          if (issuer === b2cIssuer) {
            return b2cJwksUri;
          }
          if (issuer === adminIssuer) {
            return adminJwksUri;
          }
          throw new Error('Unknown issuer');
        });

        (jwksRsa.hapiJwt2KeyAsync as jest.Mock).mockImplementation(({ jwksUri }) => {
          const keyMap = {
            [b2cJwksUri]: b2cPublicKey,
            [adminJwksUri]: adminPublicKey,
          };

          return async () => ({ key: keyMap[jwksUri] });
        });
      });

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

      it('should complete the request for a valid B2C JWT', async () => {
        const jwtAuthToken = createRs256Token(b2cIssuer, b2cAudience, b2cPrivateKey, 'b2c-kid');
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

      it('should complete the request for a valid admin-tenant JWT', async () => {
        const jwtAuthToken = createRs256Token(adminIssuer, adminAudience, adminPrivateKey, 'admin-kid');
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          },
        });

        expect(res.statusCode).toBe(200);
        expect(res.statusMessage).toBe('OK');
        expect(res.result).toBe('success');
      });

      it('should reject a JWT when issuer and audience pairing is invalid', async () => {
        const jwtAuthToken = createRs256Token(b2cIssuer, adminAudience, b2cPrivateKey, 'b2c-kid');
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
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

      it('should reject a JWT with unknown issuer', async () => {
        const jwtAuthToken = createRs256Token('https://malicious-issuer.example', b2cAudience, b2cPrivateKey, 'b2c-kid');
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should reject an expired JWT', async () => {
        const jwtAuthToken = createRs256Token(b2cIssuer, b2cAudience, b2cPrivateKey, 'b2c-kid', { expiresIn: '-1h' });
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should reject a JWT with alg none', async () => {
        const jwtAuthToken = createNoneToken(b2cIssuer, b2cAudience);
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          }
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should reject a JWT signed with HS256', async () => {
        const jwtAuthToken = Jwt.sign(
          { sub: 'user-123' },
          'hs-secret',
          {
            algorithm: 'HS256',
            issuer: b2cIssuer,
            audience: b2cAudience,
            expiresIn: '1h',
            header: { kid: 'b2c-kid', alg: 'HS256' },
          },
        );
        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          },
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should reject a JWT with tampered signature', async () => {
        const jwtAuthToken = createRs256Token(b2cIssuer, b2cAudience, b2cPrivateKey, 'b2c-kid');
        const [header, payload, signature] = jwtAuthToken.split('.');
        // Flip an interior char (full 6 significant bits) rather than the last
        // char, whose base64url group only encodes 2 bits and can leave the
        // decoded signature bytes unchanged, making the tamper a flaky no-op.
        const midIndex = Math.floor(signature.length / 2);
        const flippedChar = signature.charAt(midIndex) === 'A' ? 'B' : 'A';
        const tamperedSignature = `${signature.slice(0, midIndex)}${flippedChar}${signature.slice(midIndex + 1)}`;
        const tamperedToken = `${header}.${payload}.${tamperedSignature}`;

        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${tamperedToken}`,
          },
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
      });

      it('should fail closed when OIDC discovery fails and should log an error', async () => {
        const jwtAuthToken = createRs256Token(b2cIssuer, b2cAudience, b2cPrivateKey, 'b2c-kid');
        (getJwksUriForIssuer as jest.Mock).mockRejectedValueOnce(new Error('OIDC discovery fetch failed'));
        const loggerSpy = jest.spyOn(logger, 'error');

        const res = await Server.inject({
          url: '/private',
          headers: {
            Authorization: `Bearer ${jwtAuthToken}`,
          },
        });

        expect(res.statusCode).toBe(401);
        expect(res.statusMessage).toBe('Unauthorized');
        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('[JWT-AUTH][KEY-PROVIDER-ERROR]'));
      });
    });
  });
});
