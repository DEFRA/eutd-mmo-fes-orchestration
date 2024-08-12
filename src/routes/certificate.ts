import * as Hapi from "@hapi/hapi";
import Controller from '../controllers/certificate.controller';
import { DocumentStatuses } from "../persistence/schema/catchCert";
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';


export default class CertificateRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/certificate/{journey}',
          options: {
            security: true,
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber) => {
                const documentSummary = await Controller.getSummaryCertificate(request,h,userPrincipal,documentNumber);

                if (!documentSummary) {
                  return h.response().code(404);
                }

                return documentSummary;
              }, [DocumentStatuses.Draft, DocumentStatuses.Locked]).catch(e => {
                logger.error(`[GET-CERTIFICATE-SUMMARY][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get certificate summary information',
            tags: ['api', 'certificate']
          }
        }
      ]);
      resolve(null);
    })
  }
}