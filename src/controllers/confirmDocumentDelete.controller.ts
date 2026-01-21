import * as Hapi from '@hapi/hapi';
import DocumentDeleteService from '../services/document-delete.service';
import SaveAsDraftService from '../services/saveAsDraft.service';
import * as DataReferenceReader from "../services/reference-data.service"
import acceptsHtml from '../helpers/acceptsHtml';
import logger from '../logger';

import { HapiRequestApplicationStateExtended } from '../types';

export default class ConfirmDocumentDeleteController {
  public static async confirmDocumentDelete(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string, contactId: string) {
    try {
      const journey = <string>(req as any).payload.journey;
      const payload: any = { ...(req.payload as Object) };
      payload.user_id = userPrincipal;

      let redirectUri = payload.previousUri;
      if (payload.documentDelete === 'Yes') {
        await Promise.all([
          DataReferenceReader.reportDocumentDeleted(documentNumber)
            .catch(e => logger.error(`[REPORT-DOCUMENT-DELETE][${documentNumber}][ERROR][${e}]`)),
          DocumentDeleteService.deleteDocument(userPrincipal, documentNumber, journey, contactId)
            .then(() => SaveAsDraftService.deleteDraftLink(userPrincipal, documentNumber, journey, contactId))
            .catch(e => logger.error(`[DELETE-ERROR][${e}]`))
        ]);

        logger.info(`[REPORT-DOCUMENT-DELETE][${documentNumber}][SUCCESS]`);
        redirectUri = payload.nextUri;
      }

      if (acceptsHtml(req.headers)) {
        return h.redirect(redirectUri);
      } else {
        return payload;
      }
    } catch (e) {
      logger.error({ userPrincipal: (req.app as HapiRequestApplicationStateExtended).claims.sub }, 'Cannot delete document');
      logger.error(e);
    }
  }
}
