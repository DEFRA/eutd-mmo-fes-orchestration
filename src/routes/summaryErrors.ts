import * as Hapi from '@hapi/hapi';
import SummaryErrorService from '../services/summaryErrors.service';
import { withDocumentLegitimatelyOwned } from '../helpers/withDocumentLegitimatelyOwned';
import logger from '../logger';

export default class SummaryErrorsRoutes {
  public async register(server: Hapi.Server): Promise<any> {
    return new Promise<void>(resolve => {
      server.route([
        {
          method: 'GET',
          path: '/v1/summary-errors',
          options: {
            security: true,
            cors: true,
            handler: async (request, h) => {
              return await withDocumentLegitimatelyOwned(request, h, async (_userPrincipal, documentNumber, contactId) => {
                return await SummaryErrorService.get(_userPrincipal, documentNumber, contactId);
              })
              .catch(e => {
                logger.error(`[GET-SUMMARY-ERRORS][ERROR][${e.stack || e}]`);
                return h.response().code(500);
              });
            },
            description: 'Get summary errors for the frontend',
            tags: ['api']
          }
        }
      ]);
      resolve(null);
    });
  }
}