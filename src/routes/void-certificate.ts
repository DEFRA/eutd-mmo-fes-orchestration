import * as Hapi from '@hapi/hapi';
import acceptsHtml from '../helpers/acceptsHtml';
import errorExtractor from '../helpers/errorExtractor';
import documentVoidSchema from '../schemas/documentVoidSchema';
import logger from '../logger';

import Controller from '../controllers/manage-certs.controller';

import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { DocumentStatuses } from '../persistence/schema/catchCert';
import { defineAuthStrategies } from '../helpers/auth';

export default class ConfirmDocumentVoidRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'POST',
          path: '/v1/void-certificate',
          options: {
            security: true,
            auth: defineAuthStrategies(),
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(request, h, async () => {
                return await Controller.voidCertificate(request, h);
              }, [DocumentStatuses.Complete]).catch(error => {
                logger.error(`[VOIDING-CERTIFICATE][ERROR][${error.stack || error}]`);
                return h.response().code(500);
              })
            },
            description: 'Void certificate',
            tags: ['api', 'void-certificate'],
            validate: {
              options: {abortEarly: false},
              failAction: function(req, h, error) {
                const errorObject = errorExtractor(error);
                if (acceptsHtml(req.headers)) {
                  return h.redirect(`${(req.payload as any).currentUri}?error=` + JSON.stringify(errorObject)).takeover();
                }
                return h.response(errorObject).code(400).takeover();
              },
              payload: documentVoidSchema
            }
          }
        }
      ]);
      resolve(null);
    });
  }
}
