import { CatchCertificate, CatchCertModel, DocumentStatuses } from '../persistence/schema/catchCert';
import { ProcessingStatement, ProcessingStatementModel } from '../persistence/schema/processingStatement';
import { StorageDocument, StorageDocumentModel } from '../persistence/schema/storageDoc';
import { getDraftCache } from '../persistence/services/catchCert';
import DocumentNumberService from '../services/documentNumber.service';
import ServiceNames from './interfaces/service.name.enum';

import logger from '../logger';

type DocumentType = CatchCertificate | ProcessingStatement | StorageDocument;

// Fields required to validate ownership plus the fields consumed downstream when
// the validated document is reused (avoids re-querying the same draft).
const OWNERSHIP_PROJECTION = 'createdBy contactId status documentNumber userReference requestByAdmin exportData';

export const validateDocumentOwnership = async (userId: string, documentId: string, statuses: DocumentStatuses[], contactId: string): Promise<DocumentType> => {

  if (!userId && !contactId) {
    return undefined;
  }

  if (!documentId) {
    return undefined;
  }

  const documentNumber = documentId.toUpperCase();

  let document: DocumentType = await ownerConfirmedInCache(documentNumber, userId, statuses, contactId);

  if (document) logger.debug(`[VALIDATE-DOCUMENT-OWNERSHIP][OWNER-CONFIRMED-IN-CACHE][${documentNumber}]`);

  if (!document) {
    document = await getOwnerFromMongo(documentNumber, statuses, userId, contactId);

    logger.debug(`[VALIDATE-DOCUMENT-OWNERSHIP][OWNER-CONFIRMED-FROM-MONGO][${documentNumber}]`);
  }

  return document;
};

export const ownerConfirmedInCache = async (documentNumber: string, userPrincipal: string, statuses: DocumentStatuses[], contactId: string): Promise<CatchCertificate> => {
  const service = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);

  if (service !== ServiceNames.CC) {
    return undefined;
  }

  const draft = (statuses.includes(DocumentStatuses.Draft))
    ? await getDraftCache(userPrincipal, contactId, documentNumber) as CatchCertificate
    : undefined;

  return draft ?? undefined;
}

export const getOwnerFromMongo = async (documentNumber: string, statuses: DocumentStatuses[], userPrincipal: string, contactId: string): Promise<DocumentType> => {
  const service = DocumentNumberService.getServiceNameFromDocumentNumber(documentNumber);

  let model;
  let document: DocumentType;

  switch (service) {
    case ServiceNames.CC: model = CatchCertModel; break;
    case ServiceNames.PS: model = ProcessingStatementModel; break;
    case ServiceNames.SD: model = StorageDocumentModel; break;
  }

  if (model) {
    const query = {
      documentNumber: documentNumber,
      status: {$in: statuses}
    };

    logger.debug(`[GET-OWNER-FROM-MONGO][DOCUMENT][${documentNumber}][QUERY][${JSON.stringify(query)}]`);

    // Project only the fields required for the ownership check and for downstream
    // reuse (loadRequiredData consumes exportData), and use lean() to skip Mongoose
    // document hydration. This avoids returning the full hydrated document on a
    // query that runs on every owned-document request.
    document = await model.findOne(query, OWNERSHIP_PROJECTION, { lean: true });

    if (!document) {
      return null;
    }

    logger.debug(`[VALIDATE-DOCUMENT-OWNERSHIP][DOCUMENT][${JSON.stringify(document)}]`);
  }

  return validateDocumentOwner(document, userPrincipal, contactId) ? document : undefined;
}

export const validateDocumentOwner = (
  document: DocumentType,
  userPrincipal: string,
  contactId: string
): boolean => {
  if(!document) {
    return false;
  }

  if (userPrincipal && contactId) {
    return (
      document.createdBy === userPrincipal ||
      document.contactId === contactId ||
      document.exportData?.exporterDetails?.contactId === contactId
    );
  }

  if (!userPrincipal && contactId) {
    return (
      document.contactId === contactId ||
      document.exportData?.exporterDetails?.contactId === contactId
    );
  }

  if (userPrincipal && !contactId) {
    return document.createdBy === userPrincipal;
  }

  return false;
};