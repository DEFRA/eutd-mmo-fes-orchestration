import * as Hapi from '@hapi/hapi';
import Controller from "../controllers/conservation.controller";
import acceptsHtml from "../helpers/acceptsHtml";
import conservationSchema from '../schemas/catchcerts/conservationSchema';
import conservationSaveAsDraftSchema from '../schemas/catchcerts/conservationSaveAsDraftSchema';

import errorExtractor from "../helpers/errorExtractor";
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';
import { defineAuthStrategies } from '../helpers/auth';

export default class ConservationRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {

      server.route([
        {
          method: 'POST',
          path: '/v1/conservation',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addConservation(req, h, false, userPrincipal, documentNumber, contactId)
              }).catch(error => {
                logger.error(`[ADDING-CONSERVATION][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            description: 'add conservation',
            tags: ['api', 'conservation'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                    return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify({errorObject})).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: async (value: any, options) => {
                if (value.caughtInOtherWaters === 'Y' && value.otherWaters === undefined && acceptsHtml(options.context.headers)) {
                  return value;
                }

                const errors = conservationSchema.validate({ ...value}, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }
              }
            }
          }
        },
        {
          method: 'GET',
          path: '/v1/conservation',
          options: {
            auth: defineAuthStrategies(),
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.getConservation(request, h, userPrincipal, documentNumber, contactId)
              }).catch(error => {
                logger.error(`[GET-CONSERVATION][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            description: 'get conservations',
            tags: ['api', 'conservation']
          }
        },
        {
          method: 'POST',
          path: '/v1/conservation/saveAsDraft',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Add conservation and save current URI to track progress',
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId) => {
                return await Controller.addConservationAndSaveAsDraft(request, h, true, userPrincipal, documentNumber, contactId)
              }).catch(error =>  {
                logger.error(`[ADDING-CONSERVATION-SAVE-AS-DRAFT][ERROR][${error.stack || error}`);
                return h.response().code(500);
              })
            },
            tags: ['api', 'conservation', 'save as draft'],
            validate: {
              options: {
                abortEarly: false
              },
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                    return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify({errorObject})).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: function(value: any, options) {


                if ( value.caughtInOtherWaters === 'Y' && value.otherWaters === undefined && acceptsHtml(options.context.headers)) {
                  return value;
                }

                const errors = conservationSaveAsDraftSchema.validate(value, {
                  abortEarly: false,
                  allowUnknown: true
                });

                if (errors.error) {
                  throw errors.error;
                }
              }
            },
          }
        }
      ]);
      resolve(null);
    });
  }
}
