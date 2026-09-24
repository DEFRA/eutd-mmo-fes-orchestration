import setupInsights from './azureAppInsights';
import * as Hapi from '@hapi/hapi';
import * as DotEnv from 'dotenv';
import * as mongo from './persistence/mongo';

import Router from './router';
import logger from './logger';

import { SessionStoreFactory } from './session_store/factory';
import { IStorage, IStoreable } from './session_store/storeable';
import { getRedisOptions } from './session_store/redis';
import { HapiRequestApplicationStateExtended } from './types';

import ApplicationConfig from './applicationConfig';
import acceptsHtml from "./helpers/acceptsHtml";
import * as Boom from '@hapi/boom';
import * as jwksRsa from 'jwks-rsa';
import { verify as jwtVerify, JwtPayload } from 'jsonwebtoken';
import { isRequestByAdmin } from './helpers/auth';
import { getJwksUriForIssuer } from './helpers/oidcDiscovery';

export default class Server {
  private static _instance: Hapi.Server<Hapi.ServerApplicationState>;

  public static async start(port?: number): Promise<Hapi.Server<Hapi.ServerApplicationState>> {
    try {
      DotEnv.config();
      setupInsights();

      Server._instance = Hapi.server({
        host: ApplicationConfig._host,
        port: port || ApplicationConfig._port,
        routes: {
          validate: {
            options: {
              allowUnknown: true, // god forgive me
              abortEarly: true  //  set this to false if you want all the errors to be returned at once
            }
          }
        }
      });

      Server.onRequest();
      Server.onCredentials();
      Server.onPostAuth();
      Server.onPreResponse();

      // Initialize redis as session store
      const options = getRedisOptions();
      const sessionStore: IStorage<IStoreable> =
        await SessionStoreFactory.getSessionStore(options);
      (Server._instance.app as any).sessionStore = sessionStore;

      // Initialize mongo connection
      await mongo.MongoConnection.connect(ApplicationConfig._dbConnectionUri, ApplicationConfig._dbName, ApplicationConfig._dbConnectionPool);

      // This check is only for running the test/local dev.
      if (ApplicationConfig._disableAuth) {
        logger.info('Starting without auth');
        Server.onPreAuth();

      } else {
        await Server.setUpAuth();
        Server.onPreAuthWithAuth();
      }

      await Server._instance.register([
        { plugin: require('@hapi/inert') },
        { plugin: require('@hapi/vision') }
      ]);
      await Router.loadRoutes(Server._instance);

      await Server._instance.start();
      logger.info('Server successfully started');
      return Server._instance;

    } catch (error) {
      logger.error('Could not start the server. The error is ', error);
      throw error;
    }
  }

  public static async stop(): Promise<Error | null | void> {
    return Server._instance.stop();
  }

  public static async restart(port?: number): Promise<Hapi.Server> {
    await Server.stop();
    return await Server.start(port);
  }

  public static instance(): Hapi.Server {
    return Server._instance;
  }

  public static async inject(options: string | Hapi.ServerInjectOptions): Promise<Hapi.ServerInjectResponse<object>> {
    return await Server._instance.inject(options);
  }

  private static onPreAuth() {
    Server._instance.ext('onPreAuth', (request, h) => {
      (request.app as HapiRequestApplicationStateExtended).claims = {
        // Static GUID as user principal - this should be used only in local DEV
        sub: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ12',
        email: 'foo@foo.com',
        contactId: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX-YZ13',
      };
      return h.continue;
    });
  }

  private static onRequest() {
    Server._instance.ext('onRequest', function (request, h) {

      logger.info({
        requestId: (request as any).id,
        data: {
          method: request.method,
          path: request.path,
          requestBody: request.payload ? request.payload : '',
          requestParams: request.params ? request.params : '',
          accept: request.headers["accept"], userAgent: request.headers["user-agent"],
          userPrincipal: (request.app as HapiRequestApplicationStateExtended)?.claims?.sub || ''
        }
      },
        'on-request');

      return h.continue;
    });
  }

  private static onPreAuthWithAuth() {
    Server._instance.ext('onPreAuth', (request, h) => {

      logger.info({
        requestId: (request as any).id,
        data: {
          method: request.method,
          path: request.path,
          requestBody: request.payload ? request.payload : '',
          requestParams: request.params ? request.params : '',
          accept: request.headers["accept"], userAgent: request.headers["user-agent"],
          userPrincipal: (request.app as HapiRequestApplicationStateExtended)?.claims?.sub || ''
        }
      },
        'on-pre-auth');

      return h.continue;
    });
  }

  private static onCredentials() {
    Server._instance.ext('onCredentials', (request, h) => {

      logger.info({
        requestId: (request as any).id,
        data: {
          method: request.method,
          path: request.path,
          requestBody: request.payload ? request.payload : '',
          requestParams: request.params ? request.params : '',
          accept: request.headers["accept"], userAgent: request.headers["user-agent"],
          userPrincipal: (request.app as HapiRequestApplicationStateExtended)?.claims?.sub || ''
        }
      },
        'on-credentials');

      return h.continue;
    });
  }

  private static onPostAuth() {
    Server._instance.ext('onPostAuth', function (request, h) {

      logger.info({
        requestId: (request as any).id,
        data: {
          method: request.method,
          path: request.path,
          requestBody: request.payload ? request.payload : '',
          requestParams: request.params ? request.params : '',
          accept: request.headers["accept"], userAgent: request.headers["user-agent"],
          userPrincipal: (request.app as HapiRequestApplicationStateExtended)?.claims?.sub || ''
        }
      },
        'on-post-auth');

      return h.continue;
    });
  }

  private static onPreResponse() {
    Server._instance.ext('onPreResponse', function (request: any, h) {
      const { response } = request;

      logger.info({
        requestId: (request).id,
        data: {
          method: request.method,
          path: request.path,
          responseBody: response.source,
          statusCode: response.statusCode,
          userPrincipal: (request.app as HapiRequestApplicationStateExtended)?.claims?.sub || 'USER-PRINCIPAL-UNAVAILABLE'
        }
      },
        'api-response');

      const permissions =
        'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), document-domain=(), encrypted-media=(), fullscreen=(), geolocation=(), gyroscope=(), layout-animations=(), legacy-image-formats=*, magnetometer=(), microphone=(), midi=(), oversized-images=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), sync-xhr=*, usb=(), vr=(), screen-wake-lock=(), web-share=(), xr-spatial-tracking=()';

      if (response.isBoom) {
        response.output.headers['Permissions-Policy'] = permissions;
      } else {
        response.header('Permissions-Policy', permissions);
      }

      if (response.isBoom && acceptsHtml(request.headers))
        return h.redirect('/there-is-a-problem-with-the-service');
      else if (request?.response?.headers) {
        request.response.headers['cache-control'] = 'no-store';
        request.response.headers['Pragma'] = 'no-store';
      }

      return h.continue;
    });
  }

  private static async setUpAuth() {
    try {
      await Server._instance.register(require('@hapi/basic'));
      logger.info('Registered @hapi/basic')

      await Server._instance.register(require('hapi-auth-jwt2'));
      logger.info('Registered hapi-auth-jwt2');

      const fesApiValidate = async (
        request: Hapi.Request,
        username: string,
        password: string
      ) => {
        logger.info('Validating token for FES API');
        try {
          const claims = jwtVerify(
            password,
            ApplicationConfig.getAuthSecret(),
          );

          const app = request.app as HapiRequestApplicationStateExtended;
          app.claims = claims as JwtPayload;
          app.claims.fesApi = true;

          const credentials = { id: "fesApi", name: username };

          return { isValid: true, credentials };
        } catch (err) {
          logger.error(`[FES-API-AUTH][ERROR][${err}]`);
          return { isValid: false };
        }
      };

      Server._instance.auth.strategy('fesApi', 'basic', {
        validate: fesApiValidate,
      });

      const b2cIssuer = ApplicationConfig.getAuthIssuer();
      const b2cAudience = ApplicationConfig.getB2cAuthAudience();
      const adminIssuer = ApplicationConfig.getAdminAuthIssuer();
      const adminAudience = ApplicationConfig.getAdminAuthAudience();
      const applicationConfigWithOptionalTenantId = ApplicationConfig as typeof ApplicationConfig & {
        getAdminAuthTenantId?: () => string;
      };
      const aadTenantId =
        typeof applicationConfigWithOptionalTenantId.getAdminAuthTenantId === 'function'
          ? applicationConfigWithOptionalTenantId.getAdminAuthTenantId()
          : 'UNAVAILABLE';
      // TEMP-DEBUG: verify SND auth config values, remove after diagnosing JWT-AUTH 404
      logger.info(`[TEMP-DEBUG][AUTH-CONFIG][b2cIssuer:${b2cIssuer}][b2cAudience:${b2cAudience}][adminIssuer:${adminIssuer}][adminAudience:${adminAudience}][aadTenantId:${aadTenantId}]`);

      Server._instance.auth.strategy('jwt', 'jwt', {
        complete: true,
        key: async (decodedToken) => {
          const decodedPayload = decodedToken?.payload as JwtPayload | undefined;
          const tokenIssuer = decodedPayload?.iss;
          const allowedIssuers = [b2cIssuer, adminIssuer].filter(Boolean);

          if (!tokenIssuer || !allowedIssuers.includes(tokenIssuer)) {
            logger.error(`[JWT-AUTH][KEY-PROVIDER-ERROR][JWT token issuer is invalid][issuer:${tokenIssuer || 'missing'}]`);
            throw Boom.unauthorized('Invalid token');
          }

          try {
            const jwksUri = await getJwksUriForIssuer(tokenIssuer);
            const keyProvider = jwksRsa.hapiJwt2KeyAsync({
              jwksUri,
              cache: true,
              cacheMaxEntries: 10,
              cacheMaxAge: 10 * 60 * 1000,
              rateLimit: true,
              jwksRequestsPerMinute: 10,
              timeout: 5000,
            });

            return await keyProvider(decodedToken);
          } catch (error) {
            logger.error(`[JWT-AUTH][KEY-PROVIDER-ERROR][${error}]`);
            throw Boom.unauthorized('Invalid token');
          }
        },
        verifyOptions: {
          algorithms: ['RS256'],
          issuer: [b2cIssuer, adminIssuer].filter(Boolean),
          audience: [b2cAudience, adminAudience].filter(Boolean),
          clockTolerance: 60,
        },
        validate: async (decoded: JwtPayload, request) => {
          const tokenIssuer = decoded.iss;
          const tokenAudience = decoded.aud;

              let audienceValues: string[] = [];
              if (typeof tokenAudience === 'string') {
                audienceValues = [tokenAudience];
              } else if (Array.isArray(tokenAudience)) {
                audienceValues = tokenAudience;
              }

          const hasAudience = (expectedAudience?: string) =>
            Boolean(expectedAudience && audienceValues.includes(expectedAudience));

          const isB2cPair = tokenIssuer === b2cIssuer && hasAudience(b2cAudience);
          const isAdminPair = tokenIssuer === adminIssuer && hasAudience(adminAudience);

          if (!isB2cPair && !isAdminPair) {
            logger.warn('[JWT-AUTH][INVALID-ISSUER-AUDIENCE-PAIR]');
            return { isValid: false };
          }

          const roles = decoded.roles;
          if (Array.isArray(roles) && isRequestByAdmin(roles)) {
            logger.info('[JWT-AUTH][ADMIN-ROLE-VERIFIED]');
          }

          request.app.claims = decoded;
          return { isValid: true, credentials: decoded };
        },
      });
      logger.info('strategy has been set');

      Server._instance.auth.default('jwt');
      logger.info('jwt token set as default authentication');

      logger.info('[SETUP-AUTH] has been setup');
    }
    catch (error) {
      logger.error(`[SETUP-AUTH][ERROR]${error}]`);
      throw error;
    }
  }
}
