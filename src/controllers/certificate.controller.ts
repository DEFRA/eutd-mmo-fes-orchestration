
import * as Hapi from '@hapi/hapi';
import { getDocument } from '../persistence/services/catchCert';
import { getDocument as getPSDocument } from '../persistence/services/processingStatement';
import { getDocument as getNMDDocument } from '../persistence/services/storageDoc';
import { CatchCertificate, ICatchStatus } from '../persistence/schema/catchCert';
import { ValidationFailure, SystemFailure, CertificateSummary } from '../persistence/schema/frontEndModels/payload';
import { toFrontEndDocumentNumber } from '../persistence/schema/common';
import { toFrontEndCatchCert } from '../persistence/schema/frontEndModels/catchCertificate';

import SummaryErrorsService from '../services/summaryErrors.service';
import logger from '../logger';
import DocumentNumberService from '../services/documentNumber.service';

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

  public static async getEuDataIntegrationStatus(req: Hapi.Request, userPrincipal: string, documentNumber: string): Promise<ICatchStatus | null> {
    const contactId = <string>(req as any).app.claims.contactId;
    const params = {...(req.params as any) };
    const documentType = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);

    let document = null;
    switch (documentType) {
      case 'CC':
        document = await getDocument(documentNumber, userPrincipal, contactId)
          .catch(e => {
            logger.error(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][ERROR][${e}]`);
            throw new Error(e);
          });
        break;
      case 'PS':
        document = await getPSDocument(documentNumber, userPrincipal, contactId)
          .catch(e => {
            logger.error(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][ERROR][${e}]`);
            throw new Error(e);
          });
        break;
      case 'SD':
        document = await getNMDDocument(documentNumber, userPrincipal, contactId)
          .catch(e => {
            logger.error(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][ERROR][${e}]`);
            throw new Error(e);
          });
        break;
      default:
        logger.info(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][UNSUPPORTED-DOCUMENT-TYPE]`);
        break;
    }

    if (!document?.catchSubmission || document.catchSubmission.status !== params.status) {
      logger.info(`[GET-EU-DATA-INTEGRATION-STATUS][${documentNumber}][NOT-FOUND]`);
      return null;
    }

    return document.catchSubmission;
  }
}