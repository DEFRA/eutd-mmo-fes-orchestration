import * as Hapi from "@hapi/hapi";
import Controller from '../controllers/certificate.controller';
import { CatchCertificate, DocumentStatuses } from "../persistence/schema/catchCert";
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
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId, document) => {
                // P1 optimization: pass document from ownership validation to avoid duplicate read
                const documentSummary = await Controller.getSummaryCertificate(request, h, userPrincipal, documentNumber, document as Partial<CatchCertificate>);

                if (!documentSummary) {
                  return h.response().code(404);
                }

                return documentSummary;
              }, [DocumentStatuses.Draft, DocumentStatuses.Locked,DocumentStatuses.Complete]).catch(e => {
                logger.error(`[GET-CERTIFICATE-SUMMARY][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get certificate summary information',
            tags: ['api', 'certificate']
          }
        },
        {
          method: 'GET',
          path: '/v1/certificate/catchCertificate/pre-submit',
          options: {
            security: true,
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber, contactId, document) => {
                const preSubmitBundle = await Controller.getCatchCertificatePreSubmit(request, userPrincipal, documentNumber, document as Partial<CatchCertificate>);

                if (!preSubmitBundle) {
                  return h.response().code(404);
                }

                return preSubmitBundle;
              }, [DocumentStatuses.Draft, DocumentStatuses.Locked]).catch(e => {
                logger.error(`[GET-CC-PRE-SUBMIT][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get consolidated catch certificate pre-submit payload',
            tags: ['api', 'certificate', 'pre-submit']
          }
        },
        {
          method: 'GET',
          path: '/v1/certificate/eu-data-integration/check-status',
          options: {
            security: true,
            cors: true,
            handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>) => {
              return await withDocumentLegitimatelyOwned(request, h, async (userPrincipal, documentNumber) => {
                const euIntegrationData = await Controller.getEuDataIntegrationStatus(request, userPrincipal, documentNumber);

                if (!euIntegrationData) {
                  return h.response().code(403);
                }

                return euIntegrationData;
              }, [DocumentStatuses.Complete]).catch(e => {
                logger.error(`[GET-EU-DATA-INTEGRATION-STATUS][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get EU data integration status with CATCH reference number',
            tags: ['api', 'certificate', 'eu-integration']
          }
        }
      ]);
      resolve(null);
    })
  }
}