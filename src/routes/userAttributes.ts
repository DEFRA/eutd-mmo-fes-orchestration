import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';

import acceptsHtml from "../helpers/acceptsHtml";
import errorExtractor from '../helpers/errorExtractor';
import { saveOrUpdate, find } from '../persistence/services/userAttributes';
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
              const allUserAttributes = await find((req.app as HapiRequestApplicationStateExtended).claims.sub);
              if (allUserAttributes && allUserAttributes.attributes) {
                return allUserAttributes.attributes.filter((val) => (val.name === "privacy_statement" && moment.utc(ApplicationConfig._lastUpdatedPrivacyStatement).isSameOrBefore(val.modifiedAt)) || isEmpty(ApplicationConfig._lastUpdatedPrivacyStatement) ? val : val.name !== 'privacy_statement');
              }
              return [];
            },
            tags: ['api']
          }
        }
      ]);
      resolve(null);
    });
  }
}