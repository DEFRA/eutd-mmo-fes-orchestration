import * as Hapi from '@hapi/hapi';
import * as Joi from 'joi';
import logger from '../logger';

import UserReferenceController from '../controllers/userReference.controller';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from "../helpers/errorExtractor";

import { defineAuthStrategies } from '../helpers/auth';

export default class UserReferenceRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/userReference',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Get the user reference for a draft',
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(req, h, async (_userPrincipal, _documentNumber, _contactId, document) => {
                const result = await UserReferenceController.getUserReference(document);

                if (result === null) {
                  return h.response().code(404);
                }

                if (result === undefined) {
                  return h.response().code(204);
                }

                return result;
              }).catch(error => {
                logger.error(`[ADDING-USER-REFERENCE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              });
            },
            tags: ['api', 'user reference']
          }
        },
        {
          method: 'POST',
          path: '/v1/userReference',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Post the user reference for a draft',
            handler: async (req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(req, h, async (userPrincipal, documentNumber, contactId) => {
                const userReference = (req.payload as any).userReference;

                const result = await UserReferenceController.addUserReference(userPrincipal, documentNumber, userReference, contactId);

                if (result === null) {
                  return h.response().code(404);
                }

                return userReference;
              }).catch(error => {
                logger.error(`[ADDING-USER-REFERENCE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            tags: ['api', 'user reference'],
            validate: {
              options: {
                abortEarly: false
              },
              payload: Joi.object({
                userReference: Joi.string().regex(/^[a-zA-Z0-9\\-\s/.]+$/).max(50).allow(''),
              }),
              failAction: function (req, h, error) {
              logger.info("[Entered '/v1/userReference' route validate-failAction function]")
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              }
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}
