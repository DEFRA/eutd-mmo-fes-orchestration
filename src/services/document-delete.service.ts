import logger from '../logger';
import * as CatchCertService from '../persistence/services/catchCert'
import * as ProcessingStatementService from '../persistence/services/processingStatement'
import * as StorageDocumentService from '../persistence/services/storageDoc'
import { catchCerts, storageNote, processingStatement } from '../services/documentNumber.service';
import SummaryErrorsService from "../services/summaryErrors.service";
import { clearSessionDataForCurrentJourney } from "../helpers/sessionManager";

export default class DocumentDeleteService {

  public static async deleteDocument(userPrincipal: string, documentNumber: string, journey: string, contactId: string): Promise<any> {
    try {
      switch (journey) {
        case catchCerts: {
          await SummaryErrorsService.clearErrors(documentNumber);
          logger.info(`[CATCH-CERTIFICATE][DELETING-DRAFT][${documentNumber}]`);
          await CatchCertService.deleteDraftCertificate(userPrincipal,documentNumber, contactId);
          break;
        }
        case processingStatement: {
          logger.info(`[PROCESSING-STATEMENT][DELETING-DRAFT][${documentNumber}]`);
          await ProcessingStatementService.deleteDraftStatement(userPrincipal, documentNumber, contactId);
          break;
        }
        case storageNote: {
          logger.info(`[STORAGE-DOCUMENT][DELETING-DRAFT][${documentNumber}]`);
          await StorageDocumentService.deleteDraft(userPrincipal,documentNumber, contactId);
          break;
        }
        default:
          throw new Error('[deleteDocument][INVALID-JOURNEY]');
      }

      await clearSessionDataForCurrentJourney(userPrincipal, documentNumber, contactId);
      void CatchCertService.invalidateDraftCache(userPrincipal, documentNumber, contactId);
    } catch (e) {
      logger.error(`[DELETING-DRAFT][ERROR: ${e}]`);
      throw new Error(e.message);
    }
  }
}
