import * as moment from 'moment';
import { SessionStoreFactory } from '../session_store/factory';
import { getRedisOptions } from '../session_store/redis';
import { STATUS_DRAFT } from '../services/constants';
import {
  CATCH_CERTIFICATE_KEY,
  PROCESSING_STATEMENT_KEY,
  STORAGE_NOTES_KEY
} from '../session_store/constants';
import * as CatchCertService from "../persistence/services/catchCert";
import * as ProcessingStatementService from "../persistence/services/processingStatement";
import * as StorageDocumentService from "../persistence/services/storageDoc";
import ServiceNames from '../validators/interfaces/service.name.enum';
import { CatchCertificate, DocumentStatuses } from "../persistence/schema/catchCert"

import { CatchCertificateDraft } from '../persistence/schema/frontEndModels/catchCertificate';
import { ProcessingStatementDraft } from '../persistence/schema/frontEndModels/processingStatement';
import { StorageDocumentDraft } from '../persistence/schema/frontEndModels/storageDocument';
import { ProcessingStatement } from '../persistence/schema/processingStatement';
import { StorageDocument } from '../persistence/schema/storageDoc';

export const catchCerts = CATCH_CERTIFICATE_KEY;
export const storageNote = STORAGE_NOTES_KEY;
export const processingStatement = PROCESSING_STATEMENT_KEY;

export default class DocumentNumberService {

  public static async getFullDocument(documentNumber: string) {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const payload = await sessionStore.getDocument(documentNumber);
    return payload;
  }

  public static getDocumentNumber(service: string) {
    const year = new Date().getUTCFullYear();
    return `GBR-${year}-${service}-${randomId()}`;
  }

  public static async getUniqueDocumentNumber(service: string, model: any) {
    for (let i = 0; i < 10; i++) {
      const documentNumber = this.getDocumentNumber(service);
      const isDuplicate = !!await model.exists({documentNumber: documentNumber});

      if (!isDuplicate) {
        return documentNumber;
      }
    }

    throw new Error(`[getUniqueDocumentNumber][service: ${service}][ERROR] Failed to create a unique document number.`);
  }

  public static getServiceNameFromDocumentNumber(documentNumber: string): ServiceNames {
    if (documentNumber && documentNumber.length > 11) {
      switch (documentNumber.substring(9, 11)) {
        case 'CC': return ServiceNames.CC
        case 'PS': return ServiceNames.PS
        case 'SD': return ServiceNames.SD
        default  : return ServiceNames.UNKNOWN
      }
    }

    return ServiceNames.UNKNOWN;
  }

  public static async getDocument(documentNumber: string, userPrincipal: string, contactId: string): Promise<any> {
    const service = this.getServiceNameFromDocumentNumber(documentNumber);
    let document = null;

    switch (service) {
      case ServiceNames.CC:
        document = await CatchCertService.getDocument(documentNumber, userPrincipal, contactId);
        break;
      case ServiceNames.PS:
        document = await ProcessingStatementService.getDocument(documentNumber, userPrincipal, contactId);
        break;
      case ServiceNames.SD:
        document = await StorageDocumentService.getDocument(documentNumber, userPrincipal, contactId);
        break;
    }

    return (document !== null && (document.status === DocumentStatuses.Complete || document.status === DocumentStatuses.Pending))
      ? {documentNumber: document.documentNumber, documentUri: document.documentUri, documentStatus: document.status, createdAt: document.createdAt, userReference: document.userReference}
      : null;
  }

  public static async getDraftDocuments(userPrincipal:any, key:string, contactId: string): Promise<CatchCertificateDraft[]|ProcessingStatementDraft[]|StorageDocumentDraft[]> {
    if (key.match(processingStatement)) {
      return await ProcessingStatementService.getDraftDocumentHeaders(userPrincipal, contactId) || [];
    }
    else if (key.match(storageNote)) {
      return await StorageDocumentService.getDraftDocumentHeaders(userPrincipal, contactId) || [];
    }
    return await CatchCertService.getDraftCatchCertHeadersForUser(userPrincipal, contactId) || [];
  }

  public static async createDocumentNumber(userPrincipal:string, service: string, key:string, journey: string, contactId: string): Promise<any>  {
    const sessionStore = await SessionStoreFactory.getSessionStore(getRedisOptions());
    const documentNumber = this.getDocumentNumber(service);
    const document = {
      documentNumber,
      status: STATUS_DRAFT,
      startedAt: moment().format( "DD MMM YYYY")
    };
    const payload = {...document} as any;
    await sessionStore.writeAllFor(userPrincipal, contactId, key, payload);
    await sessionStore.tagByDocumentNumber(userPrincipal, contactId, documentNumber, journey);
    return payload;
  }

  public static async getCompletedDocuments(
    documentType: string,
    userPrincipal: string,
    contactId: string,
    pageNumber: number,
    limit: number
  ): Promise<
    CatchCertificate[] | ProcessingStatement[] | StorageDocument[]
  > {
    let documents;

    switch (documentType) {
      case 'catchCertificate':
        documents = await CatchCertService.getCompletedDocuments(
          userPrincipal,
          contactId,
          limit,
          pageNumber
        );
        break;
      case 'processingStatement':
        documents = await ProcessingStatementService.getCompletedDocuments(
          userPrincipal,
          contactId,
          limit,
          pageNumber
        );
        break;
      case 'storageNotes':
        documents = await StorageDocumentService.getCompletedDocuments(
          userPrincipal,
          contactId,
          limit,
          pageNumber
        );
        break;
    }

    return documents;
  }

  public static async countDocuments(
    documentType: string,
    userPrincipal: string,
    contactId: string
  ): Promise<number> {
    let count;

    switch (documentType) {
      case 'catchCertificate':
        count = await CatchCertService.countCompletedDocuments(
          userPrincipal,
          contactId
        );
        break;
      case 'processingStatement':
        count = await ProcessingStatementService.countCompletedDocuments(
          userPrincipal,
          contactId
        );
        break;
      case 'storageNotes':
        count = await StorageDocumentService.countCompletedDocuments(
          userPrincipal,
          contactId
        );
        break;
    }

    return count;
  }
}

function randomId() {
  // taken from https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); // tslint:disable-line
    return v.toString(16).toUpperCase();
  });
}
