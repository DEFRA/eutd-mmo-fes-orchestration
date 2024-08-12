import * as Hapi from '@hapi/hapi';
import acceptsHtml from '../helpers/acceptsHtml';
import Controller from '../controllers/confirmDocumentDelete.controller';
import errorExtractor from '../helpers/errorExtractor';
import documentDeleteSchema from '../schemas/documentDeleteSchema';
import {withDocumentLegitimatelyOwned} from "../helpers/withDocumentLegitimatelyOwned";
import logger from "../logger";
import { defineAuthStrategies } from '../helpers/auth';

export default class ConfirmDocumentDeleteRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'POST',
          path: '/v1/confirm-document-delete',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request,h,async (userPrincipal, documentNumber, contactId) => {
                return await Controller.confirmDocumentDelete(request,h,userPrincipal,documentNumber, contactId);
              }).catch(error => {
                logger.error(`[DELETING-CERTIFICATE][ERROR][${error.stack || error}`);
                return h.response().code(500);
              })
            },
            description: 'Confirm selected draft document to be deleted',
            tags: ['api', 'confirm-document-delete'],
            validate: {
              options: {abortEarly: false},
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }

                return h.response(errorObject).code(400).takeover();
              },
              payload: documentDeleteSchema
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}
