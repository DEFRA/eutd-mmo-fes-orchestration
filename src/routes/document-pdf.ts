
import * as Hapi from '@hapi/hapi';
import { defineAuthStrategies } from '../helpers/auth';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import { DocumentStatuses } from '../persistence/schema/catchCert';
import DocumentController from '../controllers/document.controller';
import logger from '../logger';

export default class DocumentPdfRoutes {

  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/document/pdf',
          options: {
            auth: defineAuthStrategies(),
            security: true,
            cors: true,
            description: 'Get document pdf from redis and mongo',
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal: string, documentNumber: string, contactId: string) => {
                const document = await DocumentController.getDocumentPdf(documentNumber, userPrincipal, contactId);
                return h.response(document).code(200);
              }, [DocumentStatuses.Complete]).catch(e => {
                logger.error(`[GET-DOCUMENT-PDF][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            tags: ['api'],
            validate: {
              options: {
                abortEarly: false
              }
            }
          }
        }
      ]);
      resolve(null);
    });
  }


}
