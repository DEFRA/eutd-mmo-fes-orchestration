import * as Hapi from '@hapi/hapi';
import { CatchCertificate, DocumentStatuses } from '../persistence/schema/catchCert';
import { ProcessingStatement } from '../persistence/schema/processingStatement';
import { StorageDocument } from '../persistence/schema/storageDoc';
import { validateDocumentOwnership } from '../validators/documentOwnershipValidator';
import logger from '../logger';
import { HapiRequestApplicationStateExtended } from '../types';

export const withDocumentLegitimatelyOwned = async (
  req: Hapi.Request,
  h: Hapi.ResponseToolkit<Hapi.ReqRefDefaults>,
  executeTransaction: (
    userPrincipal: string,
    documentNumber: string,
    contactId: string,
    document?: CatchCertificate | ProcessingStatement | StorageDocument
  ) => any,
  statuses: DocumentStatuses[] = [DocumentStatuses.Draft]): Promise<Hapi.ResponseObject> => {
  let documentNumber = req.headers['documentnumber'];
  const app = req.app as HapiRequestApplicationStateExtended;
  const userPrincipal = app.claims.sub;
  const contactId = app.claims.contactId;
  let document: CatchCertificate | ProcessingStatement | StorageDocument;
  if (userPrincipal) {
    logger.debug(`[VALIDATE-DOCUMENT-OWNERSHIP][USER-PRINCIPLE][${userPrincipal}][DOCUMENT-NUMBER][${documentNumber}]`);
  } else {
    logger.debug(`[VALIDATE-DOCUMENT-OWNERSHIP][CONTACT-ID]${contactId}][DOCUMENT-NUMBER][${documentNumber}]`);
  }

  if (documentNumber) {
    documentNumber = documentNumber.toUpperCase();
    document = await validateDocumentOwnership(userPrincipal, documentNumber, statuses, contactId);

    if (document === undefined) {
      logger.info(`[DOCUMENT-VALIDATOR][CHECK-USER-OWNERSHIP][docNumber:${documentNumber},userPrincipal:${userPrincipal}][FAILED]`);
      return h.response().code(403);
    }

    if (document === null) {
      logger.info(`[DOCUMENT-VALIDATOR][DOCUMENT-DOESNT-EXIST][docNumber:${documentNumber},userPrincipal:${userPrincipal}][FAILED]`);
      return h.response().code(404);
    }
  }

  logger.info(`[DOCUMENT-VALIDATOR][CHECK-USER-OWNERSHIP][${documentNumber}][SUCCESS]`);
  return executeTransaction(userPrincipal, documentNumber, contactId, document);
};
