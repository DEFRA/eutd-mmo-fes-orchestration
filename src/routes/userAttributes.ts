import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import acceptsHtml from "../helpers/acceptsHtml";
import errorExtractor from '../helpers/errorExtractor';
import { saveOrUpdate, find } from '../persistence/services/userAttributes';
import { IAttribute, IUserAttributes } from '../persistence/schema/userAttributes';
import { HapiRequestApplicationStateExtended } from '../types';
import * as moment from 'moment';
import { isEmpty } from 'lodash';
import ApplicationConfig from '../applicationConfig'

export default class UserAttributesRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'POST',
          path: '/v1/userAttributes',
          options: {
            security: true,
            cors: true,
            description: 'Set user attributes',
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              const payload = req.payload as any;
              const allAttributes = await saveOrUpdate((req.app as HapiRequestApplicationStateExtended).claims.sub, payload.key, payload.value);
              if (acceptsHtml(req.headers)) {
                return h.redirect(payload.nextUri);
              }
              return allAttributes;
            },
            tags: ['api'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);

                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: Joi.object({
                key: Joi.string().required(),
                value: Joi.any().when('key', { not: 'language', then: Joi.any(), otherwise: Joi.string().valid('en_UK','cy_UK').required() })
              })
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/userAttributes',
          options: {
            security: true,
            cors: true,
            description: 'Get user attributes for user',
            handler: async (req: Hapi.Request) => {
              const userId = (req.app as HapiRequestApplicationStateExtended).claims.sub;
              const allUserAttributes: IUserAttributes | null = await find(userId, ['attributes']);
              const attributes = allUserAttributes?.attributes;

              if (!attributes?.length) {
                return [];
              }

              const hasPrivacyThreshold = !isEmpty(ApplicationConfig._lastUpdatedPrivacyStatement);
              const hasCookieThreshold = !isEmpty(ApplicationConfig._lastUpdatedCookiePolicy);

              const privacyThreshold = hasPrivacyThreshold
                ? moment.utc(ApplicationConfig._lastUpdatedPrivacyStatement).valueOf()
                : 0;
              const cookieThreshold = hasCookieThreshold
                ? moment.utc(ApplicationConfig._lastUpdatedCookiePolicy).valueOf()
                : 0;

              const filteredAttributes: IAttribute[] = [];

              for (const attribute of attributes) {
                if (attribute.name === 'privacy_statement') {
                  if (!hasPrivacyThreshold || moment.utc(attribute.modifiedAt).valueOf() >= privacyThreshold) {
                    filteredAttributes.push(attribute);
                  }
                  continue;
                }

                if (attribute.name === 'accepts_cookies') {
                  if (!hasCookieThreshold || moment.utc(attribute.modifiedAt).valueOf() >= cookieThreshold) {
                    filteredAttributes.push(attribute);
                  }
                  continue;
                }

                filteredAttributes.push(attribute);
              }

              return filteredAttributes;
            },
            tags: ['api']
          }
        }
      ]);
      resolve(null);
    });
  }
}