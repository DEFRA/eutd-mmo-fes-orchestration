
import * as Hapi from '@hapi/hapi';
import { getDocument } from '../persistence/services/catchCert';
import { CatchCertificate } from '../persistence/schema/catchCert';
import { ValidationFailure, SystemFailure, CertificateSummary } from '../persistence/schema/frontEndModels/payload';
import { toFrontEndDocumentNumber } from '../persistence/schema/common';
import { toFrontEndCatchCert } from '../persistence/schema/frontEndModels/catchCertificate';

import SummaryErrorsService from '../services/summaryErrors.service';
import logger from '../logger';

export default class CertificateController {
  public static async getSummaryCertificate(req: Hapi.Request, h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>, userPrincipal: string, documentNumber: string): Promise<CertificateSummary> {
    const contactId = <string>(req as any).app.claims.contactId;
    const document: CatchCertificate = await getDocument(documentNumber, userPrincipal, contactId)
      .catch(e => {
        logger.error(`[GET-SUMMARY-CERTIFICATE][GET-DOCUMENT][ERROR][${e}]`);
        throw new Error(e);
      });

    if (!document) {
      logger.info('[GET-SUMMARY-CERTIFICATE][GET-DOCUMENT][NOT-FOUND]');
      return null;
    }

    const summaryErrors: (ValidationFailure | SystemFailure)[] = await SummaryErrorsService.get(userPrincipal, documentNumber, contactId)
      .catch(e => {
        logger.error(`[GET-SUMMARY-CERTIFICATE][GET-SUMMARY-ERRORS][ERROR][${e}]`);
        throw new Error(e);
      });

    return {
      ...toFrontEndDocumentNumber(document),
      ...toFrontEndCatchCert(document),
      validationErrors: summaryErrors
    };
  }
}