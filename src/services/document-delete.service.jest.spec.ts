import DocumentDeleteService from './document-delete.service';
import * as ProcessingStatementService from '../persistence/services/processingStatement';
import * as CatchCertService from '../persistence/services/catchCert';
import * as StorageDocumentService from '../persistence/services/storageDoc';
import * as SessionManager from "../helpers/sessionManager";
import {
  CATCH_CERTIFICATE_KEY,
  DRAFT_HEADERS_KEY,
  PROCESSING_STATEMENT_KEY,
  STORAGE_NOTES_KEY
} from '../session_store/constants';
import SummaryErrorsService from "../services/summaryErrors.service";

describe('deleteDocument', () => {

  let mockDeleteCC;
  let mockSessionDelete;
  let mockDeletePS;
  let mockDeleteSD;
  let mockInvalidateDraftCache;
  let mockClearErrors;

  const contactId = 'contactBob';

  beforeEach(() => {
    mockSessionDelete = jest.spyOn(SessionManager,'clearSessionDataForCurrentJourney');
    mockDeleteCC = jest.spyOn(CatchCertService, 'deleteDraftCertificate');
    mockDeletePS = jest.spyOn(ProcessingStatementService, 'deleteDraftStatement');
    mockDeleteSD = jest.spyOn(StorageDocumentService, 'deleteDraft');
    mockInvalidateDraftCache = jest.spyOn(CatchCertService, 'invalidateDraftCache');
    mockClearErrors = jest.spyOn(SummaryErrorsService, "clearErrors");
    mockClearErrors.mockResolvedValue(null);
  });

  afterEach(() => {
    mockDeleteCC.mockRestore();
    mockDeletePS.mockRestore();
    mockDeleteSD.mockRestore();
    mockInvalidateDraftCache.mockRestore();
    mockClearErrors.mockRestore();
  });

  it('will delete draft catch certificates from mongo and clear session data', async () => {
    mockDeleteCC.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob', 'GBR-344234-23423423-4234234', CATCH_CERTIFICATE_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteCC).toHaveBeenCalledTimes(1);
    expect(mockDeleteCC).toHaveBeenCalledWith('Bob','GBR-344234-23423423-4234234', contactId);
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-344234-23423423-4234234', contactId);
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', `${CATCH_CERTIFICATE_KEY}/${DRAFT_HEADERS_KEY}`, contactId);
    expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
    expect(mockClearErrors).toHaveBeenCalled();
    expect(mockClearErrors).toHaveBeenCalledTimes(1);
    expect(mockClearErrors).toHaveBeenCalledWith('GBR-344234-23423423-4234234');
  });

  it('will delete draft processing statements from mongo and clear session data', async () => {
    mockDeletePS.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob','GBR-REAACA-E4343-34FASD', PROCESSING_STATEMENT_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeletePS).toHaveBeenCalledTimes(1);
    expect(mockDeletePS).toHaveBeenCalledWith('Bob','GBR-REAACA-E4343-34FASD', contactId);
    expect(mockInvalidateDraftCache).toHaveBeenCalled();
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-REAACA-E4343-34FASD', 'contactBob');
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', `${PROCESSING_STATEMENT_KEY}/${DRAFT_HEADERS_KEY}`, 'contactBob');
    expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
    expect(mockClearErrors).not.toHaveBeenCalled();
  });

  it('will delete storage documents from mongo and clear session data', async () => {
    mockDeleteSD.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob','GBR-REAACA-E4343-34FASD', STORAGE_NOTES_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteSD).toHaveBeenCalledTimes(1);
    expect(mockDeleteSD).toHaveBeenCalledWith('Bob','GBR-REAACA-E4343-34FASD', 'contactBob');
    expect(mockInvalidateDraftCache).toHaveBeenCalled();
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', 'GBR-REAACA-E4343-34FASD', 'contactBob');
    expect(mockInvalidateDraftCache).toHaveBeenCalledWith('Bob', `${STORAGE_NOTES_KEY}/${DRAFT_HEADERS_KEY}`, 'contactBob');
    expect(mockInvalidateDraftCache).toHaveBeenCalledTimes(2);
    expect(mockClearErrors).not.toHaveBeenCalled();
  });

  it('will delete draft catch certificates from mongo and clear session data with document number GBR-REAACA-E4343-34FASD', async () => {
    mockDeleteCC.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob','GBR-REAACA-E4343-34FASD', CATCH_CERTIFICATE_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteCC).toHaveBeenCalledTimes(1);
    expect(mockDeleteCC).toHaveBeenCalledWith('Bob','GBR-REAACA-E4343-34FASD', contactId);
  });

  it('will delete draft processing statements from mongo and clear session data with document number GBR-REAACA-E4343-34FASD', async () => {
    mockDeletePS.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob','GBR-REAACA-E4343-34FASD', PROCESSING_STATEMENT_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeletePS).toHaveBeenCalledTimes(1);
    expect(mockDeletePS).toHaveBeenCalledWith('Bob','GBR-REAACA-E4343-34FASD', contactId);
  });

  it('will delete storage documents from mongo and clear session data with document number GBR-REAACA-E4343-34FASD', async () => {
    mockDeleteSD.mockResolvedValue(null);
    mockSessionDelete.mockResolvedValue(true);

    await DocumentDeleteService.deleteDocument('Bob','GBR-REAACA-E4343-34FASD', STORAGE_NOTES_KEY, contactId);

    expect(mockSessionDelete).toHaveBeenCalledTimes(1);
    expect(mockDeleteSD).toHaveBeenCalledTimes(1);
    expect(mockDeleteSD).toHaveBeenCalledWith('Bob','GBR-REAACA-E4343-34FASD', 'contactBob');
  });

  it('will throw an error if an invalid journey is specified', async () => {
    await expect(DocumentDeleteService.deleteDocument('Bob',undefined, 'test', contactId))
      .rejects
      .toThrow('[deleteDocument][INVALID-JOURNEY]');
  });

});